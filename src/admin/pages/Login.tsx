import { useState, type FormEvent } from 'react';
import { LogIn } from 'lucide-react';
import { admin, isAdminDemo } from '../../api/admin';
import type { AdminSession } from '../../api/admin/auth';
import { errorText, Field } from '../ui';

export default function Login({ onSignedIn }: { onSignedIn: (s: AdminSession) => void }) {
  const [email, setEmail] = useState(isAdminDemo ? 'demo@terra.vn' : '');
  const [password, setPassword] = useState(isAdminDemo ? 'xem-thu' : '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSignedIn(await admin.auth.signIn(email, password));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="a-login">
      <form className="a-login-card" onSubmit={submit} noValidate>
        <div className="a-brand">
          <b>TERRA</b>
          <span>Quản trị</span>
        </div>
        <h1>Đăng nhập</h1>
        <p>Quản lý dự án, tin tức, tuyển dụng và yêu cầu của khách hàng.</p>
        <div className="a-form">
          {isAdminDemo && (
            <div className="a-alert warn">
              Chế độ xem thử: chưa kết nối Supabase. Bấm <b>&nbsp;Đăng nhập&nbsp;</b> để quản lý dữ liệu mẫu (lưu trong trình duyệt này).
            </div>
          )}
          {error && (
            <div className="a-alert danger" role="alert">
              {error}
            </div>
          )}
          <Field label="Email" htmlFor="a-email">
            <input
              id="a-email"
              className="a-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </Field>
          <Field label="Mật khẩu" htmlFor="a-password">
            <input
              id="a-password"
              className="a-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <button type="submit" className="a-btn a-btn--primary" disabled={busy || !email || !password}>
            <LogIn size={16} /> {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </div>
        <p className="a-login-foot">
          <a href="/">← Về website</a>
        </p>
      </form>
    </div>
  );
}
