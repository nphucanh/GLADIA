import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useActiveSection } from '../context/ActiveSectionContext';

// `slide`: id của section tương ứng trên Trang chủ (xem SLIDE_IDS trong Home.tsx).
// Thanh dọc sẽ cuộn mượt tới section đó thay vì điều hướng sang trang khác.
const NAV_ITEMS = [
  { to: '/', label: 'Trang chủ', slide: 'slide-hero' },
  { to: '/gioi-thieu', label: 'Giới thiệu', slide: 'slide-about' },
  { to: '/tin-tuc', label: 'Tin tức', slide: 'slide-news' },
  { to: '/tien-ich', label: 'Tiện ích', slide: 'slide-amenities' },
  { to: '/lien-he', label: 'Liên hệ', slide: 'slide-contact' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Hai vai trò tách biệt:
 * - Thanh dọc luôn hiện (rail, `open === false`): CHỈ cuộn mượt giữa các section của Trang chủ,
 *   không bao giờ điều hướng sang trang khác — kể cả khi đang xem trang khác, bấm vào rail cũng
 *   không rời trang đó.
 * - Menu mở toàn màn hình (`open === true`, bật bằng nút hamburger trên topbar): đây mới là nơi
 *   điều hướng thật sự sang các trang khác trong site.
 */
export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const { activeSection } = useActiveSection();

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const currentActive = location.pathname === '/' && activeSection ? activeSection : location.pathname;

  function scrollToSlide(slideId?: string) {
    if (!slideId) return;
    document.getElementById(slideId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-rule" />
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const icon = (
              <span className="sidebar-ring" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.3" />
                  <circle className="dot" cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </span>
            );
            const className = `sidebar-link ${currentActive === item.to ? 'active' : ''}`;

            // Menu mở (hamburger) → điều hướng thật sự sang trang khác.
            if (open) {
              return (
                <Link key={item.to} to={item.to} className={className}>
                  {icon}
                  {item.label}
                </Link>
              );
            }

            // Thanh dọc cố định → chỉ cuộn section trong Trang chủ, không điều hướng.
            return (
              <button key={item.to} type="button" className={className} onClick={() => scrollToSlide(item.slide)}>
                {icon}
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-rule sidebar-rule-end" />
      </aside>
      {open && <div className="sidebar-scrim" onClick={onClose} />}
    </>
  );
}
