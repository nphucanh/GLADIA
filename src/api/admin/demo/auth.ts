// Xem thử › Đăng nhập: đăng nhập bằng email bất kỳ (phiên lưu trong sessionStorage).
import type { Session, User } from '@supabase/supabase-js';
import { ApiError } from '../../client';
import { ensure } from '../../validate';
import type * as AuthApi from '../auth';
import { delay, now } from './shared';

const SESSION_KEY = 'terra-admin-demo';
const listeners = new Set<(s: Session | null) => void>();
const fakeSession = (email: string) => {
  const user = { id: 'demo-admin', email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: now() } as User;
  return { user, session: { access_token: 'demo', refresh_token: 'demo', expires_in: 3600, token_type: 'bearer', user } as Session };
};
/** Email đang đăng nhập ở chế độ xem thử. */
export const currentDemoEmail = () => readSession() ?? 'demo@terra.vn';

const readSession = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};

export const auth: typeof AuthApi = {
  async signIn(email, password, captchaToken) {
    ensure([
      [/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), 'Email không hợp lệ.'],
      [password.length > 0, 'Vui lòng nhập mật khẩu.'],
      // giống Supabase khi đã bật CAPTCHA: thiếu mã xác minh thì từ chối
      [!!captchaToken, 'Xác minh chống robot không hợp lệ hoặc đã hết hạn — vui lòng xác minh lại rồi đăng nhập.'],
    ]);
    try {
      sessionStorage.setItem(SESSION_KEY, email.trim());
    } catch {
      /* trình duyệt chặn lưu trữ — vẫn đăng nhập trong phiên hiện tại */
    }
    const s = fakeSession(email.trim());
    listeners.forEach((cb) => cb(s.session));
    return delay(s);
  },
  async signOut() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* bỏ qua */
    }
    listeners.forEach((cb) => cb(null));
  },
  async getAdminSession() {
    const email = readSession();
    return email ? fakeSession(email) : null;
  },
  onAuthChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  async requestPasswordReset() {
    await delay(null);
  },
  async updatePassword(pw) {
    if (pw.length < 8) throw new ApiError('Mật khẩu tối thiểu 8 ký tự.', 'validation');
    await delay(null);
  },
};
