// Trang quản trị › Tài khoản của tôi (/quan-tri/tai-khoan): hồ sơ + đổi mật khẩu của người đang đăng nhập.
// Bảng: admin_users (sửa qua hàm admin_update_profile — chỉ họ tên / SĐT / ảnh, không tự đổi được vai trò).
import { ApiError, db, toApiError, unwrap } from '../client';
import type { AdminUserRow } from '../rows';
import { ensure, isValidPhone } from '../validate';

export interface ProfileInput {
  full_name: string;
  phone: string;
  avatar_url: string | null;
}

/** Hồ sơ của người đang đăng nhập. */
export async function getMyProfile(): Promise<AdminUserRow> {
  const { data } = await db().auth.getUser();
  if (!data.user) throw new ApiError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', 'unauthorized');
  const row = unwrap<Omit<AdminUserRow, 'last_sign_in_at'> | null>(
    await db()
      .from('admin_users')
      .select('user_id, email, full_name, phone, avatar_url, role, is_active, created_at')
      .eq('user_id', data.user.id)
      .maybeSingle(),
  );
  if (!row) throw new ApiError('Tài khoản này không có quyền quản trị.', 'unauthorized');
  return { ...row, email: data.user.email ?? row.email, last_sign_in_at: data.user.last_sign_in_at ?? null };
}

export function validateProfile(p: ProfileInput) {
  ensure([
    [p.full_name.trim().length <= 120, 'Họ tên tối đa 120 ký tự.'],
    [!p.phone.trim() || isValidPhone(p.phone), 'Số điện thoại không hợp lệ (9–11 chữ số).'],
  ]);
}

export async function updateMyProfile(p: ProfileInput): Promise<void> {
  validateProfile(p);
  unwrap(await db().rpc('admin_update_profile', { p_full_name: p.full_name, p_phone: p.phone, p_avatar_url: p.avatar_url ?? '' }));
}

/**
 * Đổi mật khẩu: kiểm tra mật khẩu hiện tại trước (đăng nhập lại), để người cầm máy đang mở sẵn trang quản trị
 * không đổi được mật khẩu nếu không biết mật khẩu cũ. `captchaToken`: bắt buộc khi Supabase bật CAPTCHA.
 */
export async function changePassword(current: string, next: string, captchaToken?: string | null): Promise<void> {
  ensure([
    [current.length > 0, 'Vui lòng nhập mật khẩu hiện tại.'],
    [next.length >= 8, 'Mật khẩu mới tối thiểu 8 ký tự.'],
    [next !== current, 'Mật khẩu mới phải khác mật khẩu hiện tại.'],
  ]);
  const { data } = await db().auth.getUser();
  const email = data.user?.email;
  if (!email) throw new ApiError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', 'unauthorized');
  const check = await db().auth.signInWithPassword({ email, password: current, options: captchaToken ? { captchaToken } : undefined });
  if (check.error) {
    if (/captcha/i.test(check.error.message)) throw new ApiError('Xác minh chống robot không hợp lệ hoặc đã hết hạn — vui lòng xác minh lại.', 'validation', check.error);
    throw new ApiError('Mật khẩu hiện tại không đúng.', 'validation', check.error);
  }
  const { error } = await db().auth.updateUser({ password: next });
  if (error) throw toApiError(error);
}
