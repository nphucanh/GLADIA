import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DependencyList,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, ImagePlus, Inbox, Search, Trash2, X } from 'lucide-react';
import { admin, type MediaFolder } from '../api/admin';
import { ApiError } from '../api/client';

// ============================================================
// Dữ liệu
// ============================================================

export interface AsyncState<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  reload: () => void;
  setData: (fn: (d: T | undefined) => T | undefined) => void;
}

/** Tải dữ liệu bất đồng bộ; tự tải lại khi deps đổi, bỏ kết quả cũ nếu đã có lần tải mới hơn. */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setDataState] = useState<T>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const run = useRef(0);
  useEffect(() => {
    const id = ++run.current;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => id === run.current && setDataState(d))
      .catch((e) => id === run.current && setError(errorText(e)))
      .finally(() => id === run.current && setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, error, loading, reload: () => setTick((t) => t + 1), setData: (f) => setDataState(f) };
}

export const errorText = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : String(e));

/** Giá trị trễ (vd. ô tìm kiếm — chỉ gọi API khi ngừng gõ). */
export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// ============================================================
// Định dạng
// ============================================================

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('vi-VN') : '—';

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

/** "5 phút trước", "Hôm qua", hoặc ngày. */
export function fmtAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2 * 86400) return 'Hôm qua';
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} ngày trước`;
  return fmtDate(iso);
}

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ============================================================
// Bố cục
// ============================================================

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
}) {
  return (
    <div className="a-page-head">
      <div>
        {back && (
          <Link to={back.to} className="a-back">
            <ArrowLeft size={14} /> {back.label}
          </Link>
        )}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="a-actions">{actions}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="a-field">
      <label htmlFor={htmlFor}>
        {label}
        {required && <span className="req">*</span>}
      </label>
      {children}
      {error ? <span className="a-error-text">{error}</span> : hint ? <span className="a-hint">{hint}</span> : null}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="a-switch" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
      {label && (
        <span>
          {label}
          {hint && <small>{hint}</small>}
        </span>
      )}
    </label>
  );
}

export type Tone = 'ok' | 'warn' | 'info' | 'danger' | 'accent' | 'neutral';

export function Badge({ tone = 'neutral', plain, children }: { tone?: Tone; plain?: boolean; children: ReactNode }) {
  return <span className={`a-badge ${tone}${plain ? ' plain' : ''}`}>{children}</span>;
}

export function Loading({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <div className="a-loading" role="status">
      <span className="a-spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function Empty({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="a-empty">
      {icon ?? <Inbox size={36} strokeWidth={1.4} />}
      <b>{title}</b>
      {children}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="a-card-body">
      <div className="a-alert danger" role="alert">
        <AlertTriangle size={18} style={{ flex: 'none' }} />
        <div style={{ flex: 1 }}>{message}</div>
        {onRetry && (
          <button type="button" className="a-btn a-btn--sm a-btn--secondary" onClick={onRetry}>
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="a-search">
      <Search size={15} />
      <input className="a-input" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

export const PAGE_SIZES = [10, 20, 50, 100];

/** Trang hiện tại + số dòng mỗi trang (số dòng được nhớ theo từng danh sách trên trình duyệt này). */
export function usePaging(key: string, initial = 20) {
  const storeKey = `terra-admin-pagesize:${key}`;
  const [page, setPage] = useState(1);
  const [pageSize, setSize] = useState(() => {
    try {
      const v = Number(localStorage.getItem(storeKey));
      return PAGE_SIZES.includes(v) ? v : initial;
    } catch {
      return initial;
    }
  });
  const setPageSize = (n: number) => {
    setSize(n);
    setPage(1);
    try {
      localStorage.setItem(storeKey, String(n));
    } catch {
      /* bỏ qua */
    }
  };
  return { page, setPage, pageSize, setPageSize };
}

/** Phân trang phía trình duyệt cho danh sách đã tải hết. */
export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const p = Math.min(Math.max(1, page), totalPages);
  return { items: items.slice((p - 1) * pageSize, p * pageSize), page: p, totalPages, total: items.length, offset: (p - 1) * pageSize };
}

/** Dãy số trang có dấu … : 1 … 4 5 [6] 7 8 … 20 */
function pageList(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const lo = Math.max(2, Math.min(page - 1, total - 4));
  const hi = Math.min(total - 1, Math.max(page + 1, 5));
  if (lo > 2) out.push('…');
  for (let i = lo; i <= hi; i++) out.push(i);
  if (hi < total - 1) out.push('…');
  out.push(total);
  return out;
}

export function Pager({
  page,
  totalPages,
  total,
  pageSize = 20,
  onChange,
  onPageSize,
  unit = 'mục',
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize?: number;
  onChange: (p: number) => void;
  onPageSize?: (n: number) => void;
  unit?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const go = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    onChange(p);
    // Đưa đầu danh sách vào tầm nhìn khi chuyển trang
    const card = ref.current?.closest('.a-card');
    if (card && card.getBoundingClientRect().top < 0) card.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  return (
    <div className="a-pager" ref={ref}>
      <div className="a-pager-info">
        <span>
          Hiển thị <b>{from}–{to}</b> trên <b>{total}</b> {unit}
        </span>
        {onPageSize && total > PAGE_SIZES[0] && (
          <label className="a-pager-size">
            <span>Mỗi trang</span>
            <select className="a-input" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {totalPages > 1 && (
        <nav className="a-pager-nav" aria-label="Phân trang">
          <button type="button" className="a-page-btn wide" disabled={page <= 1} onClick={() => go(page - 1)} aria-label="Trang trước">
            <ChevronLeft size={16} /> <span>Trước</span>
          </button>
          {pageList(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="a-page-gap">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`a-page-btn${p === page ? ' active' : ''}`}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => go(p)}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" className="a-page-btn wide" disabled={page >= totalPages} onClick={() => go(page + 1)} aria-label="Trang sau">
            <span>Sau</span> <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}

/** Nút gộp chọn một giá trị (vd. lọc theo trạng thái), có thể kèm số đếm. */
export function Seg<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="a-seg" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value || 'all'}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? 'active' : undefined}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {!!o.count && <i>{o.count}</i>}
        </button>
      ))}
    </div>
  );
}

/** Số kết quả + nút xoá bộ lọc (bên phải thanh công cụ). */
export function ResultInfo({ total, unit, onClear }: { total?: number; unit: string; onClear?: () => void }) {
  return (
    <span className="a-result">
      {total !== undefined && (
        <>
          <b>{total}</b> {unit}
        </>
      )}
      {onClear && (
        <>
          {' · '}
          <button type="button" className="a-clear" onClick={onClear}>
            Xoá bộ lọc
          </button>
        </>
      )}
    </span>
  );
}

/** Ngăn kéo bên phải (chi tiết yêu cầu, sửa nhanh). */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="a-overlay" />
        <Dialog.Content className="a-sheet" aria-describedby={undefined}>
          <div className="a-sheet-head">
            <div>
              <Dialog.Title asChild>
                <h2>{title}</h2>
              </Dialog.Title>
              {subtitle && <p>{subtitle}</p>}
            </div>
            <Dialog.Close className="a-icon-btn" aria-label="Đóng">
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="a-sheet-body">{children}</div>
          {footer && <div className="a-sheet-foot">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ============================================================
// Hộp xác nhận + thông báo (dùng chung toàn trang quản trị)
// ============================================================

interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}

interface FeedbackApi {
  confirm: (o: ConfirmOptions) => Promise<boolean>;
  toast: (message: string, kind?: 'ok' | 'error') => void;
}

const FeedbackContext = createContext<FeedbackApi>({ confirm: async () => false, toast: () => undefined });
export const useFeedback = () => useContext(FeedbackContext);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [ask, setAsk] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; kind: 'ok' | 'error' }[]>([]);
  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => setAsk({ ...o, resolve })), []);
  const toast = useCallback((message: string, kind: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 6000 : 3200);
  }, []);
  const close = (v: boolean) => {
    ask?.resolve(v);
    setAsk(null);
  };
  return (
    <FeedbackContext.Provider value={{ confirm, toast }}>
      {children}
      <Dialog.Root open={!!ask} onOpenChange={(v) => !v && close(false)}>
        <Dialog.Portal>
          <Dialog.Overlay className="a-overlay" />
          <Dialog.Content className="a-dialog" aria-describedby={undefined}>
            <Dialog.Title asChild>
              <h2>{ask?.title}</h2>
            </Dialog.Title>
            {ask?.message && <p>{ask.message}</p>}
            <div className="a-dialog-actions">
              <button type="button" className="a-btn a-btn--secondary" onClick={() => close(false)}>
                Huỷ
              </button>
              <button
                type="button"
                className={`a-btn ${ask?.danger ? 'a-btn--danger' : 'a-btn--primary'}`}
                onClick={() => close(true)}
                autoFocus
              >
                {ask?.danger && <Trash2 size={15} />}
                {ask?.confirmLabel ?? 'Đồng ý'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="a-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`a-toast${t.kind === 'error' ? ' error' : ''}`}>
            {t.kind === 'error' ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
            {t.message}
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

/** Chạy thao tác ghi: hiện thông báo thành công / lỗi, trả về kết quả (undefined nếu lỗi). */
export function useAction() {
  const { toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async <T,>(fn: () => Promise<T>, success?: string): Promise<T | undefined> => {
      setBusy(true);
      try {
        const r = await fn();
        if (success) toast(success);
        return r;
      } catch (e) {
        toast(errorText(e), 'error');
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );
  return { run, busy };
}

// ============================================================
// Ô ảnh (tải lên kho media)
// ============================================================

export function ImageField({
  value,
  onChange,
  folder,
  fallback,
  hint,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: MediaFolder;
  fallback?: string; // ảnh đang hiển thị trên web khi chưa chọn ảnh
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { run, busy } = useAction();
  const shown = value || fallback;
  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const up = await run(() => admin.media.uploadMedia(file, folder), 'Đã tải ảnh lên');
    if (up) onChange(up.url);
  }
  return (
    <div className="a-image-field">
      <div className="a-image-preview">{shown ? <img src={shown} alt="" /> : <span>Chưa có ảnh</span>}</div>
      <div className="a-image-actions">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={pick} />
        <button type="button" className="a-btn a-btn--secondary a-btn--sm" disabled={busy} onClick={() => input.current?.click()}>
          <ImagePlus size={15} /> {busy ? 'Đang tải…' : value ? 'Đổi ảnh' : 'Tải ảnh lên'}
        </button>
        {value && (
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => onChange(null)}>
            Bỏ ảnh
          </button>
        )}
        <span className="a-hint">
          {!value && fallback ? 'Đang dùng ảnh mẫu của website. ' : ''}
          {hint ?? 'JPG, PNG, WebP · tối đa 10MB'}
        </span>
      </div>
    </div>
  );
}

/* ---------- Tooltip ----------
 * Thay tooltip mặc định của trình duyệt (thuộc tính title) bằng nhãn tối, chữ rõ.
 * Chuyển title → data-a-tip khi rê chuột/focus để trình duyệt không hiện tooltip riêng. */
const TIP_SCOPE = '.adm, .a-sheet, .a-dialog';

export function TooltipLayer() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number; below: boolean } | null>(null);
  const target = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let timer = 0;
    const hide = () => {
      window.clearTimeout(timer);
      target.current = null;
      setTip(null);
    };
    const show = (el: HTMLElement, delay: number) => {
      const text = el.getAttribute('data-a-tip');
      if (!text) return;
      window.clearTimeout(timer);
      target.current = el;
      timer = window.setTimeout(() => {
        if (target.current !== el || !el.isConnected) return;
        const r = el.getBoundingClientRect();
        const below = r.top < 52;
        setTip({ text, x: r.left + r.width / 2, y: below ? r.bottom + 8 : r.top - 8, below });
      }, delay);
    };
    const find = (t: EventTarget | null) => {
      const el = (t instanceof Element ? t.closest<HTMLElement>('[title], [data-a-tip]') : null) ?? null;
      if (!el || !el.closest(TIP_SCOPE)) return null;
      const title = el.getAttribute('title');
      if (title) {
        el.setAttribute('data-a-tip', title);
        el.removeAttribute('title');
        if (!el.getAttribute('aria-label') && !el.textContent?.trim()) el.setAttribute('aria-label', title);
      }
      return el;
    };
    const over = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const el = find(e.target);
      if (el === target.current) return;
      if (el) show(el, 250);
      else hide();
    };
    const focus = (e: FocusEvent) => {
      const el = find(e.target);
      if (el && el.matches(':focus-visible')) show(el, 0);
    };
    document.addEventListener('pointerover', over);
    document.addEventListener('focusin', focus);
    document.addEventListener('focusout', hide);
    document.addEventListener('pointerdown', hide);
    window.addEventListener('scroll', hide, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('pointerdown', hide);
      window.removeEventListener('scroll', hide, true);
    };
  }, []);

  const ref = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  useEffect(() => {
    if (!tip || !ref.current) return setShift(0);
    const r = ref.current.getBoundingClientRect();
    const pad = 8;
    setShift(r.left < pad ? pad - r.left : r.right > window.innerWidth - pad ? window.innerWidth - pad - r.right : 0);
  }, [tip]);

  if (!tip) return null;
  return (
    <div
      ref={ref}
      role="tooltip"
      className={`a-tip${tip.below ? ' below' : ''}`}
      style={{ left: tip.x + shift, top: tip.y, ['--a-tip-shift' as string]: `${-shift}px` }}
    >
      {tip.text}
    </div>
  );
}
