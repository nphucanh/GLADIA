import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useActiveSection } from '../context/ActiveSectionContext';

const NAV_ITEMS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/gioi-thieu', label: 'Giới thiệu' },
  { to: '/du-an', label: 'Dự án' },
  { to: '/tien-ich', label: 'Tiện ích' },
  { to: '/lien-he', label: 'Liên hệ' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Sidebar dọc bên trái, cố định — lấy cảm hứng từ nav icon+label của thegio.vn.
 * Khi đang ở Trang chủ, mục đang được tô sáng sẽ "bám theo" phần đang cuộn tới
 * (vd cuộn tới phần Dự án nổi bật thì mục "Dự án" sáng lên) thay vì luôn cố định ở "Trang chủ".
 */
export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const { activeSection } = useActiveSection();

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const currentActive = location.pathname === '/' && activeSection ? activeSection : location.pathname;

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-rule" />
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link ${currentActive === item.to ? 'active' : ''}`}
            >
              <span className="sidebar-ring" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.3" />
                  <circle className="dot" cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-rule sidebar-rule-end" />
      </aside>
      {open && <div className="sidebar-scrim" onClick={onClose} />}
    </>
  );
}
