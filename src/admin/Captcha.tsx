// Xác minh chống robot (Cloudflare Turnstile) cho trang đăng nhập quản trị.
// Mã xác minh được gửi kèm lệnh đăng nhập và do CHÍNH SUPABASE kiểm tra với Cloudflare (bật ở Supabase ›
// Authentication › Attack Protection › CAPTCHA) — gọi thẳng API mà không qua trang này cũng bị chặn.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useAdminTheme } from './theme';
import { isAdminDemo } from '../api/admin';

declare global {
  interface Window {
    turnstile?: {
      render(el: HTMLElement, opts: Record<string, unknown>): string;
      reset(id?: string): void;
      remove(id?: string): void;
    };
  }
}

// Khoá thử của Cloudflare: luôn xác minh thành công — chỉ dùng cho chế độ xem thử.
const TEST_SITE_KEY = '1x00000000000000000000AA';

/** Site key (công khai) của Turnstile; null = không dùng captcha. */
export const CAPTCHA_SITE_KEY: string | null = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || (isAdminDemo ? TEST_SITE_KEY : null);

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise: Promise<void> | null = null;

function loadScript() {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null; // cho phép thử lại
      reject(new Error('turnstile'));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export interface CaptchaHandle {
  /** Lấy mã mới (mỗi mã chỉ dùng được một lần — gọi sau mỗi lần đăng nhập thất bại). */
  reset(): void;
}

type Status = 'loading' | 'ready' | 'failed';

export const Captcha = forwardRef<CaptchaHandle, { onToken: (token: string | null) => void }>(function Captcha({ onToken }, ref) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const cb = useRef(onToken);
  cb.current = onToken;
  const [status, setStatus] = useState<Status>('loading');
  const [attempt, setAttempt] = useState(0);
  const { resolved: theme } = useAdminTheme();

  useImperativeHandle(ref, () => ({
    reset() {
      cb.current(null);
      if (widget.current && window.turnstile) window.turnstile.reset(widget.current);
    },
  }));

  useEffect(() => {
    if (!CAPTCHA_SITE_KEY) return;
    let alive = true;
    setStatus('loading');
    loadScript()
      .then(() => {
        if (!alive || !box.current || !window.turnstile) return;
        widget.current = window.turnstile.render(box.current, {
          sitekey: CAPTCHA_SITE_KEY,
          language: 'vi',
          theme, // theo chế độ sáng / tối của trang quản trị
          size: 'flexible',
          callback: (token: string) => cb.current(token),
          'expired-callback': () => cb.current(null),
          'timeout-callback': () => cb.current(null),
          'error-callback': () => {
            cb.current(null);
            return true; // để Turnstile tự thử lại
          },
        });
        setStatus('ready');
      })
      .catch(() => alive && setStatus('failed'));
    return () => {
      alive = false;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [attempt, theme]);

  if (!CAPTCHA_SITE_KEY) return null;
  return (
    <div className="a-captcha">
      <div ref={box} className="a-captcha-box" />
      {status === 'loading' && <span className="a-hint">Đang tải ô xác minh chống robot…</span>}
      {status === 'failed' && (
        <div className="a-alert danger" role="alert">
          <span>
            Không tải được ô xác minh chống robot (mạng chặn challenges.cloudflare.com?).{' '}
            <button type="button" className="a-clear" onClick={() => setAttempt((n) => n + 1)}>
              Thử lại
            </button>
          </span>
        </div>
      )}
    </div>
  );
});
