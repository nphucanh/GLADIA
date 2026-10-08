// Đăng nhập quản trị (Supabase Auth, email + mật khẩu). Chỉ user có trong bảng admin_users mới là admin.
import type { Session, User } from '@supabase/supabase-js';
import { ApiError, db, toApiError, unwrap } from '../client';

export interface AdminSession {
  user: User;
  session: Session;
}

/** Có trong admin_users và đang hoạt động (tài khoản bị tạm khoá → không còn quyền). */
async function isAdminUser(userId: string) {
  // select('*'): vẫn chạy với database chưa có cột is_active (chưa chạy update-nguoi-dung.sql)
  const row = unwrap<{ user_id: string; is_active?: boolean } | null>(
    await db().from('admin_users').select('*').eq('user_id', userId).maybeSingle(),
  );
  return row !== null && row.is_active !== false;
}

/** Lỗi captcha từ Supabase Auth (thiếu / sai / hết hạn mã xác minh). */
const isCaptchaError = (e: { message?: string; code?: string } | null) => !!e && (/captcha/i.test(e.message ?? '') || /captcha/i.test(e.code ?? ''));
const CAPTCHA_MESSAGE = 'Xác minh chống robot không hợp lệ hoặc đã hết hạn — vui lòng xác minh lại rồi đăng nhập.';

/**
 * Đăng nhập; tài khoản không phải admin → đăng xuất ngay và ném ApiError 'unauthorized'.
 * `captchaToken`: mã Turnstile — bắt buộc khi đã bật CAPTCHA ở Supabase (Supabase tự kiểm tra mã).
 */
export async function signIn(email: string, password: string, captchaToken?: string | null): Promise<AdminSession> {
  const { data, error } = await db().auth.signInWithPassword({
    email: email.trim(),
    password,
    options: captchaToken ? { captchaToken } : undefined,
  });
  if (isCaptchaError(error)) throw new ApiError(CAPTCHA_MESSAGE, 'validation', error);
  if (error?.status === 429) throw new ApiError('Đăng nhập sai quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.', 'unauthorized', error);
  if (error || !data.session) throw new ApiError('Email hoặc mật khẩu không đúng.', 'unauthorized', error);
  if (!(await isAdminUser(data.user.id))) {
    await db().auth.signOut();
    throw new ApiError('Tài khoản này không có quyền quản trị hoặc đã bị tạm khoá.', 'unauthorized');
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
export async function requestPasswordReset(email: string, redirectTo?: string, captchaToken?: string | null) {
  const { error } = await db().auth.resetPasswordForEmail(email.trim(), { redirectTo, captchaToken: captchaToken ?? undefined });
  if (isCaptchaError(error)) throw new ApiError(CAPTCHA_MESSAGE, 'validation', error);
  if (error) throw toApiError(error);
}

/** Đổi mật khẩu của admin đang đăng nhập (kể cả sau khi bấm link đặt lại mật khẩu). */
export async function updatePassword(newPassword: string) {
  if (newPassword.length < 8) throw new ApiError('Mật khẩu tối thiểu 8 ký tự.', 'validation');
  const { error } = await db().auth.updateUser({ password: newPassword });
  if (error) throw toApiError(error);
}
