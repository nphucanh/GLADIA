import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  ChevronRight,
  ExternalLink,
  FileUser,
  FolderKanban,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  MessageSquareText,
  Newspaper,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react';
import { admin, isAdminDemo, type InboxStats } from '../api/admin';
import type { AdminSession } from '../api/admin/auth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { resetDemoDb } from '../api/demoStore';
import { FeedbackProvider, Loading, TooltipLayer, useFeedback } from './ui';
import Login from './pages/Login';
import './admin.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectsPage = lazy(() => import('./pages/Projects'));
const ProjectEdit = lazy(() => import('./pages/ProjectEdit'));
const FloorPlansPage = lazy(() => import('./pages/FloorPlans'));
const NewsPage = lazy(() => import('./pages/News'));
const NewsEdit = lazy(() => import('./pages/NewsEdit'));
const JobsPage = lazy(() => import('./pages/Jobs'));
const ContactsPage = lazy(() => import('./pages/Contacts'));
const ApplicationsPage = lazy(() => import('./pages/Applications'));

export const ADMIN_BASE = '/quan-tri';

// ---------- Phiên đăng nhập + số mục mới trong hộp thư (hiện trên menu) ----------

interface AdminContextValue {
  session: AdminSession;
  stats: InboxStats | null;
  refreshStats: () => void;
}
const AdminContext = createContext<AdminContextValue | null>(null);
export const useAdmin = () => useContext(AdminContext)!;

export default function AdminApp() {
  useDocumentTitle('Quản trị — Terra');
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    admin.auth
      .getAdminSession()
      .then((s) => alive && setSession(s))
      .catch(() => alive && setSession(null));
    // Đăng xuất / hết phiên ở tab khác → về trang đăng nhập
    const off = admin.auth.onAuthChange((s) => {
      if (!s) setSession(null);
    });
    return () => {
      alive = false;
      off();
    };
  }, []);

  return (
    <div className="adm">
      <FeedbackProvider>
        {session === undefined ? (
          <Loading label="Đang kiểm tra phiên đăng nhập…" />
        ) : (
          <Routes>
            <Route
              path="dang-nhap"
              element={session ? <Navigate to={ADMIN_BASE} replace /> : <Login onSignedIn={setSession} />}
            />
            <Route
              path="*"
              element={session ? <Shell session={session} /> : <Navigate to={`${ADMIN_BASE}/dang-nhap`} replace />}
            />
          </Routes>
        )}
      </FeedbackProvider>
      <TooltipLayer />
    </div>
  );
}

function Shell({ session }: { session: AdminSession }) {
  const { confirm } = useFeedback();
  async function resetDemo() {
    const ok = await confirm({
      title: 'Khôi phục dữ liệu mẫu?',
      message: 'Mọi dự án, bài viết, vị trí, yêu cầu… đã thêm / sửa ở chế độ xem thử sẽ bị xoá, trang quản trị và website quay về dữ liệu mẫu ban đầu.',
      confirmLabel: 'Khôi phục',
      danger: true,
    });
    if (!ok) return;
    resetDemoDb();
    window.location.reload();
  }
  const [stats, setStats] = useState<InboxStats | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const refreshStats = useCallback(() => {
    admin.inbox.getInboxStats().then(setStats).catch(() => undefined);
  }, []);
  useEffect(refreshStats, [refreshStats]);
  useEffect(() => setNavOpen(false), [location.pathname]);

  return (
    <AdminContext.Provider value={{ session, stats, refreshStats }}>
      <div className={navOpen ? 'nav-open' : undefined}>
        <Sidebar stats={stats} />
        {navOpen && <div className="a-scrim" onClick={() => setNavOpen(false)} />}
        <div className="a-main">
          <Topbar email={session.user.email ?? ''} onMenu={() => setNavOpen(true)} />
          {isAdminDemo && (
            <div className="a-demo" role="note">
              <TriangleAlert size={16} />
              <span>
                <b>Chế độ xem thử</b> — chưa kết nối Supabase. Thay đổi hiện ngay trên website nhưng chỉ lưu trong trình
                duyệt này. Xem docs/API.md để kết nối.
              </span>
              <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={resetDemo}>
                <RotateCcw size={13} /> Khôi phục dữ liệu mẫu
              </button>
            </div>
          )}
          <main className="a-content">
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="du-an" element={<ProjectsPage />} />
                <Route path="du-an/moi" element={<ProjectEdit />} />
                <Route path="du-an/:id" element={<ProjectEdit />} />
                <Route path="mat-bang" element={<FloorPlansPage />} />
                <Route path="tin-tuc" element={<NewsPage />} />
                <Route path="tin-tuc/moi" element={<NewsEdit />} />
                <Route path="tin-tuc/:id" element={<NewsEdit />} />
                <Route path="tuyen-dung" element={<JobsPage />} />
                <Route path="lien-he" element={<ContactsPage />} />
                <Route path="ung-tuyen" element={<ApplicationsPage />} />
                <Route path="*" element={<Navigate to={ADMIN_BASE} replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}

const SECTION: Record<string, string> = {
  'du-an': 'Dự án',
  'mat-bang': 'Mặt bằng',
  'tin-tuc': 'Tin tức',
  'tuyen-dung': 'Tuyển dụng',
  'lien-he': 'Yêu cầu tư vấn',
  'ung-tuyen': 'Hồ sơ ứng tuyển',
};

/** Thanh trên cùng: đường dẫn trang hiện tại + xem website + tài khoản / đăng xuất. */
function Topbar({ email, onMenu }: { email: string; onMenu: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [, , section, sub] = pathname.split('/');
  const crumbs = [
    { label: 'Quản trị', to: ADMIN_BASE },
    ...(section && SECTION[section] ? [{ label: SECTION[section], to: `${ADMIN_BASE}/${section}` }] : []),
    ...(sub ? [{ label: sub === 'moi' ? 'Thêm mới' : 'Chỉnh sửa', to: '' }] : []),
  ];
  if (crumbs.length === 1) crumbs.push({ label: 'Tổng quan', to: '' });
  async function signOut() {
    await admin.auth.signOut().catch(() => undefined);
    navigate(`${ADMIN_BASE}/dang-nhap`, { replace: true });
  }
  return (
    <header className="a-topbar">
      <button type="button" className="a-topbar-menu" onClick={onMenu} aria-label="Mở menu">
        <Menu size={18} />
      </button>
      <nav className="a-crumbs" aria-label="Vị trí trang">
        {crumbs.map((c, i) => (
          <span key={i}>
            {i > 0 && <ChevronRight size={14} aria-hidden="true" />}
            {c.to && i < crumbs.length - 1 ? <NavLink to={c.to} end>{c.label}</NavLink> : <b>{c.label}</b>}
          </span>
        ))}
      </nav>
      <div className="a-topbar-right">
        <a className="a-btn a-btn--secondary a-btn--sm" href="/" target="_blank" rel="noreferrer">
          <ExternalLink size={15} /> Xem website
        </a>
        <span className="a-topbar-sep" aria-hidden="true" />
        <div className="a-user">
          <span className="a-avatar" aria-hidden="true">
            {(email[0] ?? 'A').toUpperCase()}
          </span>
          <div>
            <b title={email}>{email}</b>
            <small>Quản trị viên</small>
          </div>
        </div>
        <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={signOut}>
          <LogOut size={15} /> Đăng xuất
        </button>
      </div>
    </header>
  );
}

function Sidebar({ stats }: { stats: InboxStats | null }) {
  const item = (to: string, icon: ReactNode, label: string, count?: number, end?: boolean) => (
    <NavLink to={`${ADMIN_BASE}${to}`} end={end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
      {icon}
      {label}
      {!!count && <span className="a-nav-count">{count}</span>}
    </NavLink>
  );
  return (
    <aside className="a-side" aria-label="Menu quản trị">
      <NavLink to={ADMIN_BASE} className="a-brand">
        <b>TERRA</b>
        <span>Quản trị</span>
      </NavLink>
      <nav className="a-nav">
        {item('', <LayoutDashboard size={18} />, 'Tổng quan', undefined, true)}
        <div className="a-nav-label">Nội dung</div>
        {item('/du-an', <FolderKanban size={18} />, 'Dự án')}
        {item('/mat-bang', <LayoutTemplate size={18} />, 'Mặt bằng')}
        {item('/tin-tuc', <Newspaper size={18} />, 'Tin tức')}
        {item('/tuyen-dung', <Briefcase size={18} />, 'Tuyển dụng')}
        <div className="a-nav-label">Hộp thư</div>
        {item('/lien-he', <MessageSquareText size={18} />, 'Yêu cầu tư vấn', stats?.newContacts)}
        {item('/ung-tuyen', <FileUser size={18} />, 'Hồ sơ ứng tuyển', stats?.newApplications)}
      </nav>
      <div className="a-side-foot">Terra · Hệ thống quản trị nội dung</div>
    </aside>
  );
}
