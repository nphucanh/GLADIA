import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, Eye, EyeOff, KeyRound, Save, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { admin, isAdminDemo, type ProfileInput } from '../../api/admin';
import { Avatar, ROLE_LABEL, useAdmin } from '../AdminApp';
import { Captcha, CAPTCHA_SITE_KEY, type CaptchaHandle } from '../Captcha';
import { Badge, ErrorBox, Field, fmtDate, fmtDateTime, Loading, PageHeader, useAction } from '../ui';

export default function Account() {
  const { session, profile, profileError, refreshProfile } = useAdmin();
  if (!profile)
    return profileError ? (
      <div className="a-card">
        <ErrorBox message={profileError} onRetry={refreshProfile} />
      </div>
    ) : (
      <Loading label="Đang tải tài khoản…" />
    );
  return (
    <>
      <PageHeader title="Tài khoản của tôi" />
      <div className="a-account">
        <ProfileCard key={`${profile.full_name}|${profile.phone}|${profile.avatar_url}`} email={session.user.email ?? profile.email} onSaved={refreshProfile} />
        <PasswordCard email={session.user.email ?? profile.email} />
      </div>
    </>
  );
}

function ProfileCard({ email, onSaved }: { email: string; onSaved: () => void }) {
  const { profile } = useAdmin();
  const p = profile!;
  const [d, setD] = useState<ProfileInput>({ full_name: p.full_name ?? '', phone: p.phone ?? '', avatar_url: p.avatar_url });
  const [touched, setTouched] = useState(false);
  const { runOk, run, busy } = useAction();
  const file = useRef<HTMLInputElement>(null);
  const dirty = d.full_name !== (p.full_name ?? '') || d.phone !== (p.phone ?? '') || d.avatar_url !== p.avatar_url;
  const phoneError = d.phone.trim() && !/^[0-9]{9,11}$/.test(d.phone.replace(/\s/g, '')) ? 'Số điện thoại không hợp lệ (9–11 chữ số).' : null;

  async function pickAvatar(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const up = await run(() => admin.media.uploadMedia(f, 'avatars'), 'Đã tải ảnh — bấm "Lưu thay đổi" để áp dụng');
    if (up) setD((x) => ({ ...x, avatar_url: up.url }));
  }

  async function save() {
    setTouched(true);
    if (phoneError) return;
    if (await runOk(() => admin.account.updateMyProfile(d), 'Đã lưu thông tin tài khoản')) onSaved();
  }

  return (
    <div className="a-card">
      <div className="a-card-head">
        <div>
          <h2>
            <UserRound size={17} /> Thông tin cá nhân
          </h2>
        </div>
      </div>
      <div className="a-card-body a-form">
        <div className="a-account-avatar">
          <Avatar name={d.full_name || email} src={d.avatar_url} size={76} />
          <div>
            <div className="a-actions">
              <button type="button" className="a-btn a-btn--secondary a-btn--sm" disabled={busy} onClick={() => file.current?.click()}>
                <Camera size={14} /> {d.avatar_url ? 'Đổi ảnh' : 'Tải ảnh lên'}
              </button>
              {d.avatar_url && (
                <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setD((x) => ({ ...x, avatar_url: null }))}>
                  <Trash2 size={14} /> Bỏ ảnh
                </button>
              )}
            </div>
            <small className="a-hint">JPG, PNG, WebP · tối đa 10MB. Nên dùng ảnh vuông.</small>
            <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={pickAvatar} />
          </div>
        </div>

        <div className="a-grid-2">
          <Field label="Họ và tên" htmlFor="acc-name">
            <input id="acc-name" className="a-input" value={d.full_name} maxLength={120} placeholder="vd. Nguyễn Văn An" onChange={(e) => setD((x) => ({ ...x, full_name: e.target.value }))} />
          </Field>
          <Field label="Số điện thoại" htmlFor="acc-phone" error={touched ? phoneError : null}>
            <input
              id="acc-phone"
              className={`a-input${touched && phoneError ? ' invalid' : ''}`}
              inputMode="tel"
              value={d.phone}
              placeholder="vd. 0901234567"
              onChange={(e) => setD((x) => ({ ...x, phone: e.target.value }))}
            />
          </Field>
        </div>
        <div className="a-grid-2">
          <Field label="Email đăng nhập" hint="Muốn đổi email, liên hệ chủ sở hữu trang quản trị.">
            <input className="a-input" value={email} disabled readOnly />
          </Field>
          <Field label="Vai trò">
            <div className="a-account-meta">
              <Badge tone={p.role === 'owner' ? 'accent' : 'info'}>{ROLE_LABEL[p.role]}</Badge>
              <span>Tham gia {fmtDate(p.created_at)}</span>
            </div>
          </Field>
        </div>
        <div className="a-form-actions">
          <button type="button" className="a-btn a-btn--primary" disabled={busy || !dirty} onClick={save}>
            <Save size={15} /> Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

/** Ô mật khẩu có nút con mắt riêng để ẩn/hiện. */
function PasswordInput({ id, autoComplete, value, onChange }: { id: string; autoComplete: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="a-pw">
      <input id={id} className="a-input" type={show ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} />
      <button type="button" className="a-pw-eye" onClick={() => setShow((v) => !v)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={show}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function PasswordCard({ email }: { email: string }) {
  const { profile } = useAdmin();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [touched, setTouched] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captcha = useRef<CaptchaHandle>(null);
  const needCaptcha = !!CAPTCHA_SITE_KEY && !isAdminDemo;
  const { runOk, busy } = useAction();
  useEffect(() => setTouched(false), [email]);

  const strength = scorePassword(next);
  const errors = {
    current: current ? null : 'Vui lòng nhập mật khẩu hiện tại.',
    next: next.length >= 8 ? (next === current ? 'Mật khẩu mới phải khác mật khẩu hiện tại.' : null) : 'Mật khẩu mới tối thiểu 8 ký tự.',
    again: again === next ? null : 'Mật khẩu nhập lại không khớp.',
  };
  const invalid = !!(errors.current || errors.next || errors.again);

  async function save() {
    setTouched(true);
    if (invalid || (needCaptcha && !captchaToken)) return;
    const ok = await runOk(() => admin.account.changePassword(current, next, captchaToken), 'Đã đổi mật khẩu');
    captcha.current?.reset();
    if (ok) {
      setCurrent('');
      setNext('');
      setAgain('');
      setTouched(false);
    }
  }

  return (
    <div className="a-card">
      <div className="a-card-head">
        <div>
          <h2>
            <KeyRound size={17} /> Đổi mật khẩu
          </h2>
          <p className="a-card-sub">
            {profile?.last_sign_in_at ? `Đăng nhập gần nhất: ${fmtDateTime(profile.last_sign_in_at)}.` : 'Dùng mật khẩu mạnh, không dùng lại ở nơi khác.'}
          </p>
        </div>
      </div>
      <form
        className="a-card-body a-form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <input type="email" autoComplete="username" value={email} readOnly hidden />
        <Field label="Mật khẩu hiện tại" htmlFor="pw-current" error={touched ? errors.current : null}>
          <PasswordInput id="pw-current" autoComplete="current-password" value={current} onChange={setCurrent} />
        </Field>
        <Field label="Mật khẩu mới" htmlFor="pw-next" error={touched ? errors.next : null}>
          <PasswordInput id="pw-next" autoComplete="new-password" value={next} onChange={setNext} />
        </Field>
        {next && (
          <div className={`a-pw-meter s${strength.score}`} aria-live="polite">
            <span>
              <i />
              <i />
              <i />
              <i />
            </span>
            <small>{strength.label}</small>
          </div>
        )}
        <Field label="Nhập lại mật khẩu mới" htmlFor="pw-again" error={touched ? errors.again : null}>
          <PasswordInput id="pw-again" autoComplete="new-password" value={again} onChange={setAgain} />
        </Field>
        {needCaptcha && (
          <Field label="Xác minh bạn không phải robot">
            <Captcha ref={captcha} onToken={setCaptchaToken} />
          </Field>
        )}
        <p className="a-hint">
          <ShieldCheck size={13} /> Mật khẩu hiện tại được kiểm tra lại trước khi đổi.
          {isAdminDemo && ' (Chế độ xem thử: không có mật khẩu thật để đổi.)'}
        </p>
        <div className="a-form-actions">
          <button type="submit" className="a-btn a-btn--primary" disabled={busy || (needCaptcha && !captchaToken)}>
            <KeyRound size={15} /> Đổi mật khẩu
          </button>
        </div>
      </form>
    </div>
  );
}

/** Độ mạnh mật khẩu (0–4) theo độ dài và số loại ký tự. */
function scorePassword(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '' };
  const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  let score = pw.length < 8 ? 1 : kinds <= 1 ? 1 : kinds === 2 ? 2 : 3;
  if (score === 3 && pw.length >= 12) score = 4;
  return { score, label: ['', 'Yếu', 'Trung bình', 'Khá mạnh', 'Mạnh'][score] };
}
