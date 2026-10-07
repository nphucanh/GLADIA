// Đăng nhập quản trị (Supabase Auth, email + mật khẩu). Chỉ user có trong bảng admin_users mới là admin.
import type { Session, User } from '@supabase/supabase-js';
import { ApiError, db, toApiError, unwrap } from '../client';

export interface AdminSession {
  user: User;
  session: Session;
}

async function isAdminUser(userId: string) {
  const row = unwrap<{ user_id: string } | null>(
    await db().from('admin_users').select('user_id').eq('user_id', userId).maybeSingle(),
  );
  return row !== null;
}

/** Đăng nhập; tài khoản không phải admin → đăng xuất ngay và ném ApiError 'unauthorized'. */
export async function signIn(email: string, password: string): Promise<AdminSession> {
  const { data, error } = await db().auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.session) throw new ApiError('Email hoặc mật khẩu không đúng.', 'unauthorized', error);
  if (!(await isAdminUser(data.user.id))) {
    await db().auth.signOut();
    throw new ApiError('Tài khoản này không có quyền quản trị.', 'unauthorized');
  }
  return { user: data.user, session: data.session };
}

export async function signOut() {
  const { error } = await db().auth.signOut();
  if (error) throw toApiError(error);
}

/** Phiên admin hiện tại (đọc từ bộ nhớ trình duyệt), null nếu chưa đăng nhập / không phải admin. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const { data } = await db().auth.getSession();
  if (!data.session) return null;
  return (await isAdminUser(data.session.user.id)) ? { user: data.session.user, session: data.session } : null;
}

/** Theo dõi đăng nhập / đăng xuất / hết hạn phiên. Trả về hàm huỷ theo dõi. */
export function onAuthChange(cb: (session: Session | null) => void) {
  const { data } = db().auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

/** Gửi email đặt lại mật khẩu; `redirectTo` là trang đặt mật khẩu mới của web quản trị. */
export async function requestPasswordReset(email: string, redirectTo?: string) {
  const { error } = await db().auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) throw toApiError(error);
}

/** Đổi mật khẩu của admin đang đăng nhập (kể cả sau khi bấm link đặt lại mật khẩu). */
export async function updatePassword(newPassword: string) {
  if (newPassword.length < 8) throw new ApiError('Mật khẩu tối thiểu 8 ký tự.', 'validation');
  const { error } = await db().auth.updateUser({ password: newPassword });
  if (error) throw toApiError(error);
}
