// Các dạng biểu đồ phụ cho Tổng quan / Thống kê: tròn (donut), thanh ngang, cột, bản đồ nhiệt theo ngày.
// Vẽ bằng SVG / CSS, không dùng thư viện. Số liệu chi tiết hiện qua tooltip (thuộc tính title → TooltipLayer).
import { useState, type ReactNode } from 'react';
import { fmtDayLong, fmtNum, fmtPct } from './statsUi';

/**
 * Bảng màu phân loại cho biểu đồ nhiều nhóm — gán theo thứ tự cố định, không xoay vòng.
 * Giá trị thật nằm ở biến CSS --a-c1…--a-c8 (admin.css): mỗi chế độ sáng / tối có bậc màu riêng, đã kiểm tra
 * phân biệt được cả với người mù màu trên nền tương ứng. Dùng trong style={{…}}, không dùng thuộc tính SVG fill= / stroke=
 * (thuộc tính SVG không hiểu var()).
 */
export const PALETTE = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `var(--a-c${i})`);

/** Nền nhạt của một màu (vd. ô biểu tượng): pha màu với nền trong suốt. */
export const tint = (color: string, pct = 12) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

/** Màu cố định theo đối tượng — giống nhau ở Tổng quan, Thống kê và mọi biểu đồ. */
export const SERIES_COLOR = {
  project: PALETTE[0], // lượt xem dự án
  news: PALETTE[1], // lượt đọc tin tức
  lead: PALETTE[2], // yêu cầu tư vấn
  application: PALETTE[6], // hồ sơ ứng tuyển
  active: PALETTE[3], // số dự án / bài có lượt xem
};

/** Màu theo loại hình / chuyên mục — theo khoá, không theo thứ hạng, để lọc lại không đổi màu. */
export const BUILDING_COLOR: Record<string, string> = { apartment: PALETTE[0], villa: PALETTE[1], land: PALETTE[2], shophouse: PALETTE[3] };
export const NEWS_CATEGORY_COLOR: Record<string, string> = { 'du-an': PALETTE[0], 'cong-ty': PALETTE[1], 'thien-nguyen': PALETTE[2] };
export const OTHER_COLOR = 'var(--a-c-other)';

export interface Slice {
  label: string;
  value: number;
  color?: string;
}

// ---------- Biểu đồ tròn ----------

export function DonutChart({ data, unit = 'lượt', size = 168 }: { data: Slice[]; unit?: string; size?: number }) {
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 42;
  const C = 2 * Math.PI * R;
  const GAP = data.filter((d) => d.value > 0).length > 1 ? 0.6 : 0; // khe hở giữa các phần (đơn vị chu vi)
  let offset = 0;
  const cur = active !== null ? data[active] : null;

  return (
    <div className="a-donut">
      <div className="a-donut-ring" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r={R} fill="none" style={{ stroke: 'var(--a-sunken)' }} strokeWidth="12" />
          {total > 0 &&
            data.map((d, i) => {
              const len = (d.value / total) * C;
              const seg = (
                <circle
                  key={d.label}
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  style={{ stroke: d.color ?? PALETTE[i % PALETTE.length], opacity: active === null || active === i ? 1 : 0.35 }}
                  strokeWidth={active === i ? 14.5 : 12}
                  strokeDasharray={`${Math.max(0, len - GAP)} ${C}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 50 50)"
                  className="a-donut-seg"
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                />
              );
              offset += len;
              return seg;
            })}
        </svg>
        <div className="a-donut-center">
          <b>{fmtNum(cur ? cur.value : total)}</b>
          <small>{cur ? cur.label : `tổng ${unit}`}</small>
        </div>
      </div>
      <ul className="a-donut-legend">
        {data.map((d, i) => (
          <li
            key={d.label}
            className={active === i ? 'active' : undefined}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
          >
            <i style={{ background: d.color ?? PALETTE[i % PALETTE.length] }} />
            <span>{d.label}</span>
            <b>{fmtNum(d.value)}</b>
            <em>{total ? fmtPct((d.value / total) * 100, 0) : '0%'}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Thanh ngang (xếp hạng nhóm) ----------

export function BarList({ data, unit = 'lượt', color = PALETTE[0] }: { data: Slice[]; unit?: string; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ul className="a-barlist">
      {data.map((d) => (
        <li key={d.label} title={`${d.label}: ${fmtNum(d.value)} ${unit}${total ? ` (${fmtPct((d.value / total) * 100)})` : ''}`}>
          <div className="a-barlist-track">
            <i style={{ width: `${(d.value / max) * 100}%`, background: d.color ?? color }} />
            <span>{d.label}</span>
          </div>
          <b>{fmtNum(d.value)}</b>
          <em>{total ? fmtPct((d.value / total) * 100, 0) : '0%'}</em>
        </li>
      ))}
    </ul>
  );
}

// ---------- Bản đồ nhiệt theo ngày (tuần × thứ) ----------

const WEEK_ROWS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function Heatmap({ days, values, unit = 'lượt xem' }: { days: string[]; values: number[]; unit?: string }) {
  if (days.length === 0) return null;
  // Cột = tuần (bắt đầu thứ 2), hàng = thứ
  const dow = (d: string) => (new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7; // 0 = thứ 2
  const lead = dow(days[0]);
  const cells: ({ day: string; value: number } | null)[] = [...Array(lead).fill(null), ...days.map((day, i) => ({ day, value: values[i] ?? 0 }))];
  while (cells.length % 7) cells.push(null);
  const weeks = cells.length / 7;
  // Thang màu từ ngày ít nhất → nhiều nhất (có lượt xem) để thấy rõ chênh lệch
  const positive = values.filter((v) => v > 0);
  const max = Math.max(1, ...positive);
  const min = positive.length ? Math.min(...positive) : 0;
  const level = (v: number) => (v <= 0 ? 0 : max === min ? 3 : 1 + Math.min(3, Math.floor(((v - min) / (max - min)) * 4)));

  return (
    <div className="a-heat">
      <div className="a-heat-grid" style={{ gridTemplateColumns: `auto repeat(${weeks}, minmax(9px, 26px))` }}>
        {WEEK_ROWS.map((w, r) => (
          <div key={w} className="a-heat-row" style={{ display: 'contents' }}>
            <span className="a-heat-day">{w}</span>
            {Array.from({ length: weeks }, (_, c) => {
              const cell = cells[c * 7 + r];
              return cell ? (
                <span key={c} className={`a-heat-cell l${level(cell.value)}`} title={`${fmtDayLong(cell.day)}: ${fmtNum(cell.value)} ${unit}`} />
              ) : (
                <span key={c} className="a-heat-cell empty" />
              );
            })}
          </div>
        ))}
      </div>
      <div className="a-heat-legend">
        Ít
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={`a-heat-cell l${l}`} />
        ))}
        Nhiều
      </div>
    </div>
  );
}

// ---------- Khung thẻ biểu đồ ----------

export function ChartCard({ title, sub, tools, children }: { title: string; sub?: string; tools?: ReactNode; children: ReactNode }) {
  return (
    <div className="a-card">
      <div className="a-card-head">
        <div>
          <h2>{title}</h2>
          {sub && <p className="a-card-sub">{sub}</p>}
        </div>
        {tools}
      </div>
      <div className="a-card-body">{children}</div>
    </div>
  );
}
