// Trạng thái chờ dùng chung cho website: vòng xoay kèm chữ (trang chi tiết) và khung xương (danh sách thẻ),
// để khách biết trang đang tải chứ không phải lỗi / không có dữ liệu. Màu lấy theo màu chữ hiện tại (currentColor)
// nên hợp cả nền sáng lẫn nền tối. CSS: src/styles/loading.css.
import type { CSSProperties } from 'react';

/** Vòng xoay + dòng chữ, căn giữa. `full` = phủ cả màn hình (vd. đang tải mã trang quản trị). */
export function Spinner({ label = 'Đang tải…', full }: { label?: string; full?: boolean }) {
  return (
    <div className={`site-loading${full ? ' site-loading--full' : ''}`} role="status" aria-live="polite">
      <span className="site-spinner" aria-hidden="true" />
      <span className="site-loading-label">{label}</span>
    </div>
  );
}

/** Một khối xương có ánh sáng chạy qua. */
export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <span className={`sk ${className}`} style={style} aria-hidden="true" />;
}

/** Khung xương của một thẻ: ảnh + vài dòng chữ. */
export function CardSkeleton({ ratio = '4 / 3', lines = 3 }: { ratio?: string; lines?: number }) {
  return (
    <div className="sk-card" aria-hidden="true">
      <Skeleton className="sk-media" style={{ aspectRatio: ratio }} />
      <div className="sk-card-body">
        <Skeleton className="sk-line sk-line--sm" style={{ width: '38%' }} />
        <Skeleton className="sk-line sk-line--lg" style={{ width: '82%' }} />
        {Array.from({ length: Math.max(0, lines - 2) }, (_, i) => (
          <Skeleton key={i} className="sk-line" style={{ width: `${70 - i * 18}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Khung xương của một dòng (vd. vị trí tuyển dụng): biểu tượng + chữ + nút. */
export function RowSkeleton() {
  return (
    <div className="sk-row" aria-hidden="true">
      <Skeleton className="sk-icon" />
      <div className="sk-row-body">
        <Skeleton className="sk-line sk-line--lg" style={{ width: '46%' }} />
        <Skeleton className="sk-line" style={{ width: '88%' }} />
        <Skeleton className="sk-line" style={{ width: '64%' }} />
      </div>
      <Skeleton className="sk-btn" />
    </div>
  );
}

/** Nhãn ẩn cho trình đọc màn hình đi kèm khung xương. */
export function LoadingNote({ label }: { label: string }) {
  return (
    <span className="sr-only" role="status">
      {label}
    </span>
  );
}
