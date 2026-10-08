// Thành phần dùng chung cho Tổng quan và Thống kê: chọn kỳ, % thay đổi, biểu đồ đường, sparkline, thanh tỉ lệ.
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';
import type { ItemStat } from '../api/admin';
import { NEWS_FEATURED_IMAGE, PROJECT_IMAGE_BY_BUILDING } from '../data/images';
import type { NewsCategory } from '../data/mockNews';
import type { BuildingType } from '../types';
import { BUILDING_LABEL, NEWS_CATEGORY_LABEL } from './meta';
import { Seg } from './ui';

// ---------- Kỳ thống kê ----------

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];
const PERIOD_KEY = 'terra-admin-period';

/** Kỳ đang xem (7 / 30 / 90 ngày) — nhớ trên trình duyệt này, dùng chung cho Tổng quan và Thống kê. */
export function usePeriod(): [Period, (p: Period) => void] {
  const [period, set] = useState<Period>(() => {
    try {
      const v = Number(localStorage.getItem(PERIOD_KEY));
      return (PERIODS as readonly number[]).includes(v) ? (v as Period) : 30;
    } catch {
      return 30;
    }
  });
  const change = (p: Period) => {
    set(p);
    try {
      localStorage.setItem(PERIOD_KEY, String(p));
    } catch {
      /* bỏ qua */
    }
  };
  return [period, change];
}

export function PeriodSeg({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <Seg<string>
      label="Khoảng thời gian"
      value={String(value)}
      onChange={(v) => onChange(Number(v) as Period)}
      options={PERIODS.map((p) => ({ value: String(p), label: `${p} ngày` }))}
    />
  );
}

// ---------- Định dạng ----------

const nf = new Intl.NumberFormat('vi-VN');
export const fmtNum = (n: number) => nf.format(Math.round(n));
export const fmtPct = (n: number, digits = 1) => `${n.toLocaleString('vi-VN', { maximumFractionDigits: digits })}%`;
/** "08/10" */
export const fmtDayShort = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const WEEKDAY = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
/** "Thứ 4, 08/10/2026" */
export const fmtDayLong = (day: string) =>
  `${WEEKDAY[new Date(`${day}T00:00:00Z`).getUTCDay()]}, ${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
/** Tỉ lệ chuyển đổi: yêu cầu tư vấn / lượt xem (%). */
export const rate = (leads: number, views: number) => (views > 0 ? (leads / views) * 100 : 0);

export function itemImage(s: ItemStat) {
  if (s.imageUrl) return s.imageUrl;
  return s.kind === 'project' && s.buildingType ? PROJECT_IMAGE_BY_BUILDING[s.buildingType] : NEWS_FEATURED_IMAGE;
}
export function itemLabel(s: ItemStat) {
  return s.kind === 'news' ? NEWS_CATEGORY_LABEL[s.label as NewsCategory] ?? s.label : BUILDING_LABEL[s.buildingType as BuildingType] ?? 'Khác';
}
export const itemEditUrl = (s: ItemStat) => (s.kind === 'project' ? `/du-an/${s.id}` : `/tin-tuc/${s.id}`);
export const itemSiteUrl = (s: ItemStat) => (s.kind === 'project' ? `/du-an/${s.id}` : `/tin-tuc/${s.id}`);

// ---------- % thay đổi so với kỳ trước ----------

export function Delta({ cur, prev, compact }: { cur: number; prev: number; compact?: boolean }) {
  if (cur === 0 && prev === 0) return <span className="a-delta flat">—</span>;
  if (prev === 0) return <span className="a-delta up">{compact ? 'Mới' : 'Mới có'}</span>;
  const pct = ((cur - prev) / prev) * 100;
  if (Math.abs(pct) < 0.5) return <span className="a-delta flat">0%</span>;
  const up = pct > 0;
  return (
    <span className={`a-delta ${up ? 'up' : 'down'}`} title={`Kỳ trước: ${fmtNum(prev)}`}>
      {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {fmtPct(Math.abs(pct), Math.abs(pct) >= 10 ? 0 : 1)}
    </span>
  );
}

// ---------- Thanh tỉ lệ ----------

export function Meter({ value, max, color }: { value: number; max: number; color?: string }) {
  const w = max > 0 ? Math.max(value > 0 ? 3 : 0, (value / max) * 100) : 0;
  return (
    <span className="a-meter" aria-hidden="true">
      <i style={{ width: `${w}%`, background: color }} />
    </span>
  );
}

// ---------- Sparkline (đường nhỏ trong thẻ số liệu) ----------

export function Sparkline({ values, color = 'var(--a-accent)' }: { values: number[]; color?: string }) {
  const id = useId();
  if (values.length < 2) return null;
  const W = 120;
  const H = 36;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - 2 - (v / max) * (H - 6)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  return (
    <svg className="a-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: color }} stopOpacity=".22" />
          <stop offset="1" style={{ stopColor: color }} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L${W},${H}L0,${H}Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" style={{ stroke: color }} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

// ---------- Biểu đồ theo ngày ----------

export interface TrendSeries {
  label: string;
  color: string;
  values: number[];
  area?: boolean;
}

/** Trục tung "đẹp": 0 → max làm tròn, 4 vạch. */
function niceTicks(max: number) {
  if (max <= 4) return [0, 1, 2, 3, 4];
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  return [0, 1, 2, 3, 4].map((i) => Math.round(i * step));
}

/**
 * Biểu đồ đường nhiều chuỗi theo ngày, rê chuột để xem số từng ngày.
 * `extra` thêm dòng vào khung chú thích (vd. số yêu cầu tư vấn hôm đó) mà không vẽ thành đường.
 */
export function TrendChart({
  days,
  series,
  extra,
  height = 260,
  mode = 'line',
}: {
  days: string[];
  series: TrendSeries[];
  extra?: { label: string; values: number[] }[];
  height?: number;
  /** line = đường (mặc định) · bar = cột chồng */
  mode?: 'line' | 'bar';
}) {
  const gid = useId();
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const n = days.length;
  const bar = mode === 'bar';
  const ticks = useMemo(
    () => niceTicks(Math.max(1, ...(bar ? days.map((_, i) => sum(series.map((s) => s.values[i] ?? 0))) : series.flatMap((s) => s.values)))),
    [series, days, bar],
  );
  const top = ticks[ticks.length - 1] || 1;
  const W = 1000;
  const H = height;
  // Cột: mỗi ngày một ô rộng W / n, cột ở giữa ô · Đường: điểm đầu / cuối chạm mép
  const x = (i: number) => (bar ? ((i + 0.5) / n) * W : n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const colW = Math.min(46, (W / Math.max(1, n)) * 0.66);
  const y = (v: number) => H - (v / top) * (H - 8);

  const labelEvery = Math.max(1, Math.ceil(n / 8));
  const xLabels = days.map((d, i) => ({ d, i })).filter(({ i }) => (n - 1 - i) % labelEvery === 0);

  function onMove(e: React.PointerEvent) {
    const r = box.current?.getBoundingClientRect();
    if (!r || n === 0) return;
    const t = (e.clientX - r.left) / r.width;
    const i = bar ? Math.floor(t * n) : Math.round(t * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  }

  const hx = hover === null ? 0 : (x(hover) / W) * 100;
  return (
    <div className="a-trend">
      <div className="a-trend-y" style={{ height: H }}>
        {[...ticks].reverse().map((t) => (
          <span key={t}>{fmtNum(t)}</span>
        ))}
      </div>
      <div className="a-trend-main">
        <div
          ref={box}
          className="a-trend-plot"
          style={{ height: H }}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={`Biểu đồ ${series.map((s) => s.label).join(', ')} theo ngày`}
        >
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <defs>
              {series.map((s, k) => (
                <linearGradient key={k} id={`${gid}-${k}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" style={{ stopColor: s.color }} stopOpacity=".2" />
                  <stop offset="1" style={{ stopColor: s.color }} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            {ticks.map((t) => (
              <line key={t} x1="0" x2={W} y1={y(t)} y2={y(t)} className={t === 0 ? 'base' : 'grid'} vectorEffect="non-scaling-stroke" />
            ))}
            {bar &&
              days.map((_, i) => {
                let acc = 0;
                return (
                  <g key={i} opacity={hover === null || hover === i ? 1 : 0.72}>
                    {series.map((s, k) => {
                      const v = s.values[i] ?? 0;
                      const y0 = y(acc);
                      acc += v;
                      const h = y0 - y(acc);
                      return h > 0 ? <rect key={k} x={x(i) - colW / 2} y={y(acc)} width={colW} height={h} style={{ fill: s.color }} /> : null;
                    })}
                  </g>
                );
              })}
            {!bar && series.map((s, k) => {
              const line = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join('');
              return (
                <g key={k}>
                  {s.area && <path d={`${line}L${x(n - 1)},${H}L${x(0)},${H}Z`} fill={`url(#${gid}-${k})`} />}
                  <path d={line} fill="none" style={{ stroke: s.color }} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </g>
              );
            })}
          </svg>
          {hover !== null && (
            <>
              {!bar && <span className="a-trend-guide" style={{ left: `${hx}%` }} />}
              {!bar && series.map((s, k) => (
                <span key={k} className="a-trend-dot" style={{ left: `${hx}%`, top: y(s.values[hover] ?? 0), background: s.color }} />
              ))}
              <div className={`a-trend-tip${hx > 60 ? ' left' : ''}`} style={{ left: `${hx}%` }}>
                <b>{fmtDayLong(days[hover])}</b>
                {series.map((s, k) => (
                  <span key={k}>
                    <i style={{ background: s.color }} />
                    {s.label}
                    <em>{fmtNum(s.values[hover] ?? 0)}</em>
                  </span>
                ))}
                {extra?.map((e, k) => (
                  <span key={`x${k}`} className="extra">
                    {e.label}
                    <em>{fmtNum(e.values[hover] ?? 0)}</em>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="a-trend-x">
          {xLabels.map(({ d, i }) => (
            <span key={d} style={{ left: `${(x(i) / W) * 100}%` }}>
              {fmtDayShort(d)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; value?: ReactNode }[] }) {
  return (
    <div className="a-legend">
      {items.map((it) => (
        <span key={it.label}>
          <i style={{ background: it.color }} />
          {it.label}
          {it.value !== undefined && <b>{it.value}</b>}
        </span>
      ))}
    </div>
  );
}

// ---------- Làm mới số liệu ----------

/** Thời điểm số liệu được tải xong lần gần nhất (đổi mỗi khi `data` đổi). */
export function useUpdatedAt(data: unknown) {
  const [at, setAt] = useState<Date | null>(null);
  useEffect(() => {
    if (data !== undefined) setAt(new Date());
  }, [data]);
  return at;
}

/** Nút tải lại số liệu (không tải lại cả trang) + giờ cập nhật gần nhất. */
export function RefreshButton({ loading, onClick, updatedAt }: { loading: boolean; onClick: () => void; updatedAt: Date | null }) {
  return (
    <div className="a-refresh">
      {updatedAt && (
        <span className="a-refresh-time">
          Cập nhật lúc {updatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      )}
      <button type="button" className="a-btn a-btn--secondary" onClick={onClick} disabled={loading} aria-busy={loading}>
        <RefreshCw size={16} className={loading ? 'a-spin' : undefined} /> {loading ? 'Đang tải…' : 'Làm mới'}
      </button>
    </div>
  );
}
