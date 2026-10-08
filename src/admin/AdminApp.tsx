import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
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
  UserRound,
  UsersRound,
} from 'lucide-react';
import { admin, isAdminDemo, type InboxStats } from '../api/admin';
import type { AdminSession } from '../api/admin/auth';
import type { AdminUserRow } from '../api/rows';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { resetDemoDb } from '../api/demoStore';
import { hideSplash } from '../lib/splash';
import { ThemeProvider, ThemeToggle } from './theme';
import { ErrorBox, errorText, FeedbackProvider, Loading, TooltipLayer, useFeedback } from './ui';
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
const StatsPage = lazy(() => import('./pages/Stats'));
const AccountPage = lazy(() => import('./pages/Account'));
const UsersPage = lazy(() => import('./pages/Users'));

export const ADMIN_BASE = '/quan-tri';

// ---------- Phiên đăng nhập + số mục mới trong hộp thư (hiện trên menu) ----------

interface AdminContextValue {
  session: AdminSession;
  stats: InboxStats | null;
  refreshStats: () => void;
  /** Hồ sơ người đang đăng nhập (họ tên, ảnh, vai trò); null khi đang tải. */
  profile: AdminUserRow | null;
  /** Lỗi tải hồ sơ (vd. database chưa chạy update-nguoi-dung.sql). */
  profileError: string | null;
  refreshProfile: () => void;
}
const AdminContext = createContext<AdminContextValue | null>(null);
export const useAdmin = () => useContext(AdminContext)!;

export default function AdminApp() {
  useDocumentTitle('Quản trị — Terra');
  useEffect(hideSplash, []);
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
    <ThemeProvider>
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
    </ThemeProvider>
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
  const [profile, setProfile] = useState<AdminUserRow | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const refreshProfile = useCallback(() => {
    setProfileError(null);
    admin.account
      .getMyProfile()
      .then(setProfile)
      .catch((e) => setProfileError(errorText(e)));
  }, []);
  useEffect(refreshProfile, [refreshProfile]);
  const isOwner = profile?.role === 'owner';

  return (
    <AdminContext.Provider value={{ session, stats, refreshStats, profile, profileError, refreshProfile }}>
      <div className={navOpen ? 'nav-open' : undefined}>
        <Sidebar stats={stats} isOwner={isOwner} />
        {navOpen && <div className="a-scrim" onClick={() => setNavOpen(false)} />}
        <div className="a-main">
          <Topbar email={session.user.email ?? ''} profile={profile} onMenu={() => setNavOpen(true)} />
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
                <Route path="thong-ke" element={<StatsPage />} />
                <Route path="tai-khoan" element={<AccountPage />} />
                <Route
                  path="nguoi-quan-tri"
                  element={
                    profile ? (
                      isOwner ? <UsersPage /> : <Navigate to={ADMIN_BASE} replace />
                    ) : profileError ? (
                      <ErrorBox message={profileError} />
                    ) : (
                      <Loading />
                    )
                  }
                />
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
  'thong-ke': 'Thống kê',
  'tai-khoan': 'Tài khoản của tôi',
  'nguoi-quan-tri': 'Người quản trị',
  'du-an': 'Dự án',
  'mat-bang': 'Mặt bằng',
  'tin-tuc': 'Tin tức',
  'tuyen-dung': 'Tuyển dụng',
  'lien-he': 'Yêu cầu tư vấn',
  'ung-tuyen': 'Hồ sơ ứng tuyển',
};

/** Thanh trên cùng: đường dẫn trang hiện tại + xem website + tài khoản / đăng xuất. */
export const ROLE_LABEL: Record<AdminUserRow['role'], string> = { owner: 'Chủ sở hữu', editor: 'Biên tập viên' };

/** Ảnh đại diện: ảnh đã tải lên, hoặc chữ cái đầu của tên / email. */
export function Avatar({ name, src, size = 34 }: { name: string; src?: string | null; size?: number }) {
  return src ? (
    <img className="a-avatar" src={src} alt="" style={{ width: size, height: size, objectFit: 'cover' }} />
  ) : (
    <span className="a-avatar" aria-hidden="true" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {(name.trim()[0] ?? 'A').toUpperCase()}
    </span>
  );
}

function Topbar({ email, profile, onMenu }: { email: string; profile: AdminUserRow | null; onMenu: () => void }) {
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
        <a className="a-btn a-btn--secondary a-btn--sm a-topbar-site" href="/" target="_blank" rel="noreferrer" title="Xem website">
          <ExternalLink size={15} /> <span>Xem website</span>
        </a>
        <ThemeToggle />
        <span className="a-topbar-sep" aria-hidden="true" />
        <NavLink to={`${ADMIN_BASE}/tai-khoan`} className="a-user" title="Tài khoản của tôi">
          <Avatar name={profile?.full_name || email} src={profile?.avatar_url} />
          <div>
            <b title={email}>{profile?.full_name || email}</b>
            <small>{profile ? ROLE_LABEL[profile.role] : 'Quản trị viên'}</small>
          </div>
        </NavLink>
        <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={signOut}>
          <LogOut size={15} /> Đăng xuất
        </button>
      </div>
    </header>
  );
}

function Sidebar({ stats, isOwner }: { stats: InboxStats | null; isOwner: boolean }) {
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
        {item('/thong-ke', <BarChart3 size={18} />, 'Thống kê')}
        <div className="a-nav-label">Nội dung</div>
        {item('/du-an', <FolderKanban size={18} />, 'Dự án')}
        {item('/mat-bang', <LayoutTemplate size={18} />, 'Mặt bằng')}
        {item('/tin-tuc', <Newspaper size={18} />, 'Tin tức')}
        {item('/tuyen-dung', <Briefcase size={18} />, 'Tuyển dụng')}
        <div className="a-nav-label">Hộp thư</div>
        {item('/lien-he', <MessageSquareText size={18} />, 'Yêu cầu tư vấn', stats?.newContacts)}
        {item('/ung-tuyen', <FileUser size={18} />, 'Hồ sơ ứng tuyển', stats?.newApplications)}
        <div className="a-nav-label">Hệ thống</div>
        {item('/tai-khoan', <UserRound size={18} />, 'Tài khoản của tôi')}
        {isOwner && item('/nguoi-quan-tri', <UsersRound size={18} />, 'Người quản trị')}
      </nav>
      <div className="a-side-foot">Terra · Hệ thống quản trị nội dung</div>
    </aside>
  );
}
