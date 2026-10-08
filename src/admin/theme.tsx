// Chế độ sáng / tối của trang quản trị. Lựa chọn lưu trong trình duyệt; "Hệ thống" đi theo cài đặt của máy.
// Gắn data-admin-theme lên <html> (không phải .adm) vì hộp thoại / ngăn kéo / menu chọn của Radix nằm ngoài .adm (portal).
// Thuộc tính bị gỡ khi rời trang quản trị, nên website không bị ảnh hưởng.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

export type ThemePref = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

const KEY = 'terra-admin-theme';
const MQ = '(prefers-color-scheme: dark)';

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
}
const systemDark = () => typeof window !== 'undefined' && window.matchMedia?.(MQ).matches;
const resolve = (p: ThemePref): Resolved => (p === 'system' ? (systemDark() ? 'dark' : 'light') : p);
const apply = (r: Resolved) => document.documentElement.setAttribute('data-admin-theme', r);

// Gắn ngay khi tải mã quản trị — tránh nháy nền sáng trước khi React vẽ xong
if (typeof document !== 'undefined') apply(resolve(readPref()));

const ThemeContext = createContext<{ pref: ThemePref; resolved: Resolved; setPref: (p: ThemePref) => void }>({
  pref: 'system',
  resolved: 'light',
  setPref: () => undefined,
});
export const useAdminTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(readPref);
  const [resolved, setResolved] = useState<Resolved>(() => resolve(readPref()));

  useEffect(() => {
    const update = () => {
      const r = resolve(pref);
      setResolved(r);
      apply(r);
    };
    update();
    if (pref !== 'system') return;
    const mq = window.matchMedia?.(MQ);
    mq?.addEventListener('change', update);
    return () => mq?.removeEventListener('change', update);
  }, [pref]);

  // Rời trang quản trị (về website) → gỡ thuộc tính
  useEffect(() => () => document.documentElement.removeAttribute('data-admin-theme'), []);

  const setPref = (p: ThemePref) => {
    setPrefState(p);
    try {
      localStorage.setItem(KEY, p);
    } catch {
      /* trình duyệt chặn lưu trữ — vẫn đổi trong phiên này */
    }
  };

  return <ThemeContext.Provider value={{ pref, resolved, setPref }}>{children}</ThemeContext.Provider>;
}

const OPTIONS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Sáng', icon: Sun },
  { value: 'dark', label: 'Tối', icon: Moon },
  { value: 'system', label: 'Theo hệ thống', icon: Monitor },
];

/** Nút chọn Sáng / Tối / Theo hệ thống. */
export function ThemeToggle({ className }: { className?: string }) {
  const { pref, setPref } = useAdminTheme();
  return (
    <div className={`a-theme${className ? ` ${className}` : ''}`} role="radiogroup" aria-label="Giao diện">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={pref === value}
          aria-label={label}
          title={label}
          className={pref === value ? 'active' : undefined}
          onClick={() => setPref(value)}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
