import { NavLink } from 'react-router-dom';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

/**
 * Topbar tối giản: chỉ còn 1 nút tròn để mở/đóng sidebar (thay cho thanh nav ngang cũ).
 * Bấm nút → Sidebar.tsx chuyển sang trạng thái "open" (tiêu đề lớn, đầy đủ).
 * Không bấm → Sidebar hiển thị mặc định ở dạng thu gọn, tiêu đề nhỏ, không chắn ảnh nền.
 */
export default function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  return (
    <header className="topbar">
      <button
        className="topbar-menu-btn"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? 'Đóng menu' : 'Mở menu'}
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? (
          <span className="icon-x">
            <span />
            <span />
          </span>
        ) : (
          <span className="icon-burger">
            <span />
            <span />
            <span />
          </span>
        )}
      </button>

      <div className="topbar-utils">
        <NavLink to="/" className="util-pill">
          Terra Việt · Est. 2010
        </NavLink>
      </div>

      <a href="tel:19006868" className="topbar-cta">
        Hotline · 1900 6868
      </a>
    </header>
  );
}
