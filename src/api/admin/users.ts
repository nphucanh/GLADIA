// Trang quản trị › Người quản trị (/quan-tri/nguoi-quan-tri). CHỈ owner — database tự chặn người khác.
// Bảng admin_users, thao tác qua các hàm admin_*_user (supabase/schema.sql, mục 1).
// Tạo tài khoản đăng nhập mới cần khoá service_role → Edge Function admin-create-user (supabase/functions/).
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js';
import { ApiError, db, toApiError } from '../client';
import type { AdminRole, AdminUserRow } from '../rows';
import { ensure, isValidEmail } from '../validate';

export interface NewAdminInput {
  email: string;
  full_name: string;
  role: AdminRole;
  /** Có = tạo tài khoản mới với mật khẩu tạm; không có = cấp quyền cho tài khoản đã có. */
  password?: string;
}

/** Lỗi từ các hàm admin_*_user → thông báo tiếng Việt. */
function usersError(err: unknown): ApiError {
  const e = err as { code?: string; message?: string };
  const msg = e?.message ?? '';
  if (e?.code === 'P0002' || /user not found/.test(msg))
    return new ApiError('Không tìm thấy tài khoản với email này. Chọn "Tạo tài khoản mới" để tạo kèm mật khẩu tạm.', 'not_found', err);
  if (/cannot change yourself/.test(msg)) return new ApiError('Không thể tự đổi vai trò, khoá hay gỡ quyền của chính mình.', 'validation', err);
  if (/need at least one owner/.test(msg)) return new ApiError('Phải luôn còn ít nhất một chủ sở hữu (owner) đang hoạt động.', 'validation', err);
  if (/invalid role/.test(msg)) return new ApiError('Vai trò không hợp lệ.', 'validation', err);
  return toApiError(err);
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(fn, args);
  if (error) throw usersError(error);
  return data as T;
}

export async function listUsers(): Promise<AdminUserRow[]> {
  return rpc<AdminUserRow[]>('admin_list_users');
}

export function validateNewAdmin(u: NewAdminInput) {
  ensure([
    [isValidEmail(u.email), 'Email không hợp lệ.'],
    [u.full_name.trim().length <= 120, 'Họ tên tối đa 120 ký tự.'],
    [u.password === undefined || u.password.length >= 8, 'Mật khẩu tạm tối thiểu 8 ký tự.'],
  ]);
}

/**
 * Edge Function "admin-create-user" đã được deploy chưa (gửi yêu cầu OPTIONS — function trả lời CORS, không làm gì).
 * Chưa deploy → Supabase trả 404 không kèm CORS → fetch lỗi → false.
 */
export async function canCreateAccounts(): Promise<boolean> {
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`, { method: 'OPTIONS' });
    return res.ok;
  } catch {
    return false;
  }
}

/** Thêm quản trị viên: tạo tài khoản mới (có mật khẩu tạm) hoặc cấp quyền cho tài khoản đã có. */
export async function addUser(u: NewAdminInput): Promise<void> {
  validateNewAdmin(u);
  if (u.password === undefined) {
    await rpc('admin_grant_user', { p_email: u.email.trim(), p_role: u.role, p_full_name: u.full_name });
    return;
  }
  const { error } = await db().functions.invoke('admin-create-user', {
    body: { email: u.email.trim(), password: u.password, full_name: u.full_name, role: u.role },
  });
  if (!error) return;
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    if (res.status === 404)
      throw new ApiError('Chưa cài Edge Function "admin-create-user" nên chưa tạo được tài khoản mới (xem docs/API.md). Vẫn có thể cấp quyền cho tài khoản đã có.', 'not_configured', error);
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.message ?? 'Không tạo được tài khoản.', res.status === 403 ? 'unauthorized' : 'validation', error);
  }
  if (error instanceof FunctionsFetchError || error instanceof FunctionsRelayError)
    throw new ApiError('Không gọi được Edge Function "admin-create-user" — kiểm tra đã deploy chưa (xem docs/API.md).', 'not_configured', error);
  throw toApiError(error);
}

/** Đổi vai trò / tạm khoá - mở khoá (không áp dụng cho chính mình). */
export async function setUser(userId: string, patch: { role: AdminRole; is_active: boolean }): Promise<void> {
  await rpc('admin_set_user', { p_user_id: userId, p_role: patch.role, p_is_active: patch.is_active });
}

/** Gỡ quyền quản trị (tài khoản đăng nhập vẫn còn nhưng không vào được trang quản trị). */
export async function revokeUser(userId: string): Promise<void> {
  await rpc('admin_revoke_user', { p_user_id: userId });
}
