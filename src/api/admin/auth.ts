// Đăng nhập quản trị (Supabase Auth, email + mật khẩu). Chỉ user có trong bảng admin_users mới là admin.
import type { Session, User } from '@supabase/supabase-js';
import { ApiError, db, toApiError, unwrap } from '../client';

export interface AdminSession {
  user: User;
  session: Session;
}

/** Có trong admin_users và đang hoạt động (tài khoản bị tạm khoá → không còn quyền). */
/** Trạng thái quản trị của một tài khoản: 'ok' | 'none' (chưa được cấp quyền) | 'locked' (bị tạm khoá). */
async function adminStatus(userId: string): Promise<'ok' | 'none' | 'locked'> {
  // select('*'): vẫn chạy với database chưa có cột is_active (chưa chạy update-nguoi-dung.sql)
  const row = unwrap<{ user_id: string; is_active?: boolean } | null>(
    await db().from('admin_users').select('*').eq('user_id', userId).maybeSingle(),
  );
  return row === null ? 'none' : row.is_active === false ? 'locked' : 'ok';
}
const isAdminUser = async (userId: string) => (await adminStatus(userId)) === 'ok';

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
  if (error?.code === 'email_not_confirmed')
    throw new ApiError(
      'Tài khoản chưa xác nhận email. Bấm link trong email xác nhận, hoặc nhờ chủ sở hữu vào Supabase › Authentication › Users › chọn tài khoản › "Confirm email".',
      'unauthorized',
      error,
    );
  if (error?.code === 'user_banned') throw new ApiError('Tài khoản đăng nhập này đã bị chặn trên Supabase.', 'unauthorized', error);
  if (error && error.code !== 'invalid_credentials' && (error.status ?? 0) >= 500)
    throw new ApiError('Máy chủ đăng nhập đang lỗi, vui lòng thử lại sau ít phút.', 'network', error);
  if (error || !data.session) throw new ApiError('Email hoặc mật khẩu không đúng.', 'unauthorized', error);
  const status = await adminStatus(data.user.id).catch((e) => {
    void db().auth.signOut();
    throw e;
  });
  if (status !== 'ok') {
    await db().auth.signOut();
    throw new ApiError(
      status === 'locked'
        ? 'Tài khoản này đang bị tạm khoá. Liên hệ chủ sở hữu trang quản trị để mở khoá.'
        : 'Tài khoản này chưa được cấp quyền quản trị. Nhờ chủ sở hữu vào Người quản trị › Thêm quản trị viên › Cấp quyền cho tài khoản có sẵn.',
      'unauthorized',
    );
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
