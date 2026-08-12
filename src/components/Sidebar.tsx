import { useEffect, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useActiveSection } from '../context/ActiveSectionContext';

// Sidebar chính (menu toàn màn hình, mở bằng nút hamburger): điều hướng thật sự, đầy đủ mọi trang.
const MAIN_NAV_ITEMS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/gioi-thieu', label: 'Giới thiệu' },
  { to: '/du-an', label: 'Dự án' },
  { to: '/tin-tuc', label: 'Tin tức' },
  { to: '/tien-ich', label: 'Tiện ích' },
  { to: '/tuyen-dung', label: 'Tuyển dụng' },
  { to: '/lien-he', label: 'Liên hệ' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Hai vai trò tách biệt:
 * - Thanh dọc luôn hiện (rail, `open === false`): CHỈ cuộn mượt giữa các section của trang trình
 *   chiếu đang mở (Trang chủ, Giới thiệu...) — không bao giờ điều hướng sang trang khác. Bộ mục
 *   hiện trong rail (`railItems`) do chính trang trình chiếu đang mount đăng ký qua context; khi
 *   không trang nào đăng ký, rơi về bộ mặc định của Trang chủ.
 * - Menu mở toàn màn hình (`open === true`, bật bằng nút hamburger trên topbar): đây mới là nơi
 *   điều hướng thật sự sang các trang khác trong site.
 */
export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const { activeSection, goToSlide, railItems } = useActiveSection();

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Trang Tin tức tự quản lý bố cục riêng, không cần thanh rail luôn hiện bên trái.
  // Menu toàn màn hình (hamburger) vẫn hoạt động bình thường trên trang này.
  if (!open && location.pathname.startsWith('/tin-tuc')) {
    return null;
  }

  const icon = (
    <span className="sidebar-ring" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.3" />
        <circle className="dot" cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    </span>
  );

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {open && (
          <div className="sidebar-scene" aria-hidden="true">
            <span className="sidebar-glow sidebar-glow-a" />
            <span className="sidebar-glow sidebar-glow-b" />
            <div className="sidebar-watermark">
              Terra <span>Việt</span>
            </div>
          </div>
        )}
        <div className="sidebar-rule" />
        <nav className="sidebar-nav">
          {open
            ? MAIN_NAV_ITEMS.map((item, idx) => {
                const className = `sidebar-link ${location.pathname === item.to ? 'active' : ''}`;

                // Menu chính mở toàn màn hình → điều hướng thật sự sang trang khác.
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={className}
                    style={{ '--i': idx } as CSSProperties}
                  >
                    <span className="sidebar-link-label">{item.label}</span>
                    {icon}
                  </Link>
                );
              })
            : railItems.map((item) => {
                // Nếu có trang trình chiếu đang mount (activeSection khác null), so khớp theo slide;
                // ngược lại (đứng ở trang thường) so khớp theo đường dẫn thật của trang.
                const isActive = activeSection ? activeSection === item.slide : location.pathname === item.to;
                const className = `sidebar-link ${isActive ? 'active' : ''}`;

                // Thanh dọc nhỏ cố định → chỉ cuộn mượt giữa các section, không điều hướng.
                return (
                  <button key={item.slide} type="button" className={className} onClick={() => goToSlide(item.slide)}>
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
