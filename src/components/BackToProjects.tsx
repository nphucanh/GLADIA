import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowLeft, LayoutGrid } from 'lucide-react';

const TOPBAR_H = 76; // chiều cao header.topbar cố định (layout.css)

interface BackToProjectsProps {
  to?: string;
}

/**
 * Nút quay lại trang danh sách Dự án cho trang chi tiết:
 * - Nút pill ở đầu trang (trên tiêu đề dự án).
 * - Khi cuộn xuống làm nút đầu trang khuất sau topbar → nút nổi "Tất cả dự án" trượt ra ở
 *   góc trái, ngay dưới nút menu, và luôn hiện trong lúc xem các mục bên dưới; cuộn ngược lên
 *   tới đầu trang thì nút nổi tự ẩn (tránh hai nút cùng lúc).
 * Nút nổi render qua portal vào <body> để position:fixed không bị ảnh hưởng bởi khung trang.
 */
export default function BackToProjects({ to = '/du-an' }: BackToProjectsProps) {
  const inlineRef = useRef<HTMLAnchorElement>(null);
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    // Đo trực tiếp vị trí nút đầu trang mỗi lần cuộn / đổi kích thước (gộp theo khung hình bằng
    // rAF) thay vì IntersectionObserver — IO chỉ báo khi vượt ngưỡng nên dễ lệch trạng thái khi
    // cuộn nhanh hoặc khi chiều cao trang đổi (bản đồ, ảnh tải xong) → nút lúc hiện lúc không.
    // Nút nổi hiện ngay khi nút đầu trang bị topbar cố định che (đáy nút < chiều cao topbar).
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = inlineRef.current;
      if (!el) return;
      const next = el.getBoundingClientRect().bottom < TOPBAR_H;
      setShowFloating((prev) => (prev === next ? prev : next));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <Link ref={inlineRef} to={to} className="project-back-link">
        <ArrowLeft size={15} aria-hidden="true" />
        Quay lại Dự án
      </Link>
      {createPortal(
        <Link
          to={to}
          className={`project-back-fab${showFloating ? ' is-visible' : ''}`}
          aria-hidden={!showFloating}
          tabIndex={showFloating ? 0 : -1}
        >
          <span className="project-back-fab-ic" aria-hidden="true">
            <ArrowLeft size={16} />
          </span>
          <span className="project-back-fab-text">Tất cả dự án</span>
          <LayoutGrid size={14} aria-hidden="true" className="project-back-fab-grid" />
        </Link>,
        document.body,
      )}
    </>
  );
}
