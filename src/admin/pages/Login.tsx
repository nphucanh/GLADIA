import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { admin, isAdminDemo } from '../../api/admin';
import type { AdminSession } from '../../api/admin/auth';
import { HERO_IMAGE } from '../../data/images';
import { Captcha, CAPTCHA_SITE_KEY, type CaptchaHandle } from '../Captcha';
import { ThemeToggle } from '../theme';
import { errorText } from '../ui';

const FEATURES = ['Dự án, mặt bằng và ảnh không gian sống', 'Tin tức và tuyển dụng', 'Yêu cầu tư vấn, hồ sơ ứng tuyển và thống kê'];

export default function Login({ onSignedIn }: { onSignedIn: (s: AdminSession) => void }) {
  const [email, setEmail] = useState(isAdminDemo ? 'demo@terra.vn' : '');
  const [password, setPassword] = useState(isAdminDemo ? 'xem-thu' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captcha = useRef<CaptchaHandle>(null);
  const needCaptcha = !!CAPTCHA_SITE_KEY;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSignedIn(await admin.auth.signIn(email, password, captchaToken));
    } catch (err) {
      setError(errorText(err));
      captcha.current?.reset(); // mã đã dùng → lấy mã mới cho lần thử sau
    } finally {
      setBusy(false);
    }
  }

  const checkCaps = (e: KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.('CapsLock') ?? false);

  return (
    <div className="a-login">
      <aside className="a-login-art" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
        <div className="a-login-art-top">
          <span className="a-login-logo">TERRA</span>
          <span className="a-login-tag">Quản trị</span>
        </div>
        <div className="a-login-art-copy">
          <h2>Quản lý toàn bộ nội dung website ở một nơi.</h2>
          <ul>
            {FEATURES.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="a-login-main">
        <ThemeToggle className="a-login-theme" />
        <form className="a-login-form" onSubmit={submit} noValidate>
          <div className="a-login-mobile-brand">
            <span className="a-login-logo">TERRA</span>
            <span className="a-login-tag">Quản trị</span>
          </div>

          <header className="a-login-head">
            <h1>Chào mừng trở lại</h1>
            <p>Đăng nhập bằng tài khoản quản trị để tiếp tục.</p>
          </header>

          {isAdminDemo && (
            <div className="a-alert warn">
              <span>
                Chế độ xem thử: chưa kết nối Supabase. Bấm <b>Đăng nhập</b> để quản lý dữ liệu mẫu (lưu trong trình duyệt này).
              </span>
            </div>
          )}
          {error && (
            <div className="a-alert danger" role="alert">
              <AlertCircle size={17} style={{ flex: 'none', marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="a-login-field">
            <label htmlFor="a-email">Email</label>
            <div className="a-login-input">
              <Mail size={17} aria-hidden="true" />
              <input
                id="a-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="ten@congty.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="a-login-field">
            <label htmlFor="a-password">Mật khẩu</label>
            <div className="a-login-input">
              <Lock size={17} aria-hidden="true" />
              <input
                id="a-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={checkCaps}
                onKeyDown={checkCaps}
                onBlur={() => setCapsLock(false)}
                required
              />
              <button
                type="button"
                className="a-login-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {capsLock && <small className="a-login-caps">Caps Lock đang bật</small>}
          </div>

          {needCaptcha && (
            <div className="a-login-field">
              <label>Xác minh bạn không phải robot</label>
              <Captcha ref={captcha} onToken={setCaptchaToken} />
            </div>
          )}

          <button type="submit" className="a-login-submit" disabled={busy || !email || !password || (needCaptcha && !captchaToken)}>
            {busy ? (
              <>
                <span className="a-login-spinner" aria-hidden="true" /> Đang đăng nhập…
              </>
            ) : (
              <>
                Đăng nhập <ArrowRight size={17} />
              </>
            )}
          </button>

          <p className="a-login-secure">
            <ShieldCheck size={15} />
            {needCaptcha
              ? captchaToken
                ? 'Đã xác minh — có thể đăng nhập.'
                : 'Hoàn tất xác minh để đăng nhập.'
              : 'Chỉ tài khoản quản trị mới đăng nhập được.'}
          </p>

          <a className="a-login-back" href="/">
            <ArrowLeft size={15} /> Về website
          </a>
        </form>
      </main>
    </div>
  );
}
