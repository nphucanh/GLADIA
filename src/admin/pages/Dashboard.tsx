import { Link } from 'react-router-dom';
import { FileUser, FolderKanban, MessageSquareText, Newspaper, Plus } from 'lucide-react';
import { admin } from '../../api/admin';
import { ADMIN_BASE, useAdmin } from '../AdminApp';
import { APPLICATION_STATUS, CONTACT_STATUS } from '../meta';
import { Badge, Empty, ErrorBox, fmtAgo, Loading, PageHeader, useAsync } from '../ui';

export default function Dashboard() {
  const { session, stats } = useAdmin();
  const data = useAsync(
    async () => {
      const [contacts, applications, projects, news] = await Promise.all([
        admin.inbox.listContactSubmissions({ pageSize: 6 }),
        admin.inbox.listJobApplications({ pageSize: 5 }),
        admin.projects.listProjects({ pageSize: 1, published: true }),
        admin.news.listNews({ pageSize: 1, published: true }),
      ]);
      return { contacts, applications, projects: projects.total, news: news.total };
    },
    [],
  );
  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const d = data.data;

  return (
    <>
      <PageHeader
        title="Tổng quan"
        subtitle={`${greet}, ${session.user.email}. Đây là tình hình website hôm nay.`}
      />

      <div className="a-stats">
        <Stat
          to="/lien-he"
          icon={<MessageSquareText size={22} />}
          label="Yêu cầu tư vấn mới"
          value={stats?.newContacts}
          note={stats ? `${stats.contactsLast7Days} yêu cầu trong 7 ngày qua` : ''}
        />
        <Stat
          to="/ung-tuyen"
          icon={<FileUser size={22} />}
          label="Hồ sơ ứng tuyển mới"
          value={stats?.newApplications}
          note={stats ? `${stats.applicationsLast7Days} hồ sơ trong 7 ngày qua` : ''}
        />
        <Stat to="/du-an" icon={<FolderKanban size={22} />} label="Dự án đang hiển thị" value={d?.projects} note="trên website" />
        <Stat to="/tin-tuc" icon={<Newspaper size={22} />} label="Bài viết đã đăng" value={d?.news} note="trên trang Tin tức" />
      </div>

      {data.error ? (
        <div className="a-card">
          <ErrorBox message={data.error} onRetry={data.reload} />
        </div>
      ) : (
        <div className="a-dash">
          <div className="a-card">
            <div className="a-card-head">
              <h2>Yêu cầu tư vấn gần đây</h2>
              <Link to={`${ADMIN_BASE}/lien-he`}>Xem tất cả →</Link>
            </div>
            {!d ? (
              <Loading />
            ) : d.contacts.items.length === 0 ? (
              <Empty title="Chưa có yêu cầu nào" />
            ) : (
              <ul className="a-list">
                {d.contacts.items.map((c) => (
                  <li key={c.id}>
                    <div>
                      <b>{c.full_name}</b>
                      <small>
                        {c.project_interest ? `${c.project_interest} · ` : ''}
                        {c.topic}
                      </small>
                    </div>
                    <Badge tone={CONTACT_STATUS[c.status].tone}>{CONTACT_STATUS[c.status].label}</Badge>
                    <time dateTime={c.created_at}>{fmtAgo(c.created_at)}</time>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
            <div className="a-card">
              <div className="a-card-head">
                <h2>Thao tác nhanh</h2>
              </div>
              <div className="a-card-body a-quick">
                <Link to={`${ADMIN_BASE}/du-an/moi`}>
                  <Plus size={16} /> Thêm dự án
                </Link>
                <Link to={`${ADMIN_BASE}/tin-tuc/moi`}>
                  <Plus size={16} /> Viết bài mới
                </Link>
                <Link to={`${ADMIN_BASE}/tuyen-dung`}>
                  <Plus size={16} /> Đăng vị trí tuyển dụng
                </Link>
              </div>
            </div>
            <div className="a-card">
              <div className="a-card-head">
                <h2>Hồ sơ ứng tuyển gần đây</h2>
                <Link to={`${ADMIN_BASE}/ung-tuyen`}>Xem tất cả →</Link>
              </div>
              {!d ? (
                <Loading />
              ) : d.applications.items.length === 0 ? (
                <Empty title="Chưa có hồ sơ nào" />
              ) : (
                <ul className="a-list">
                  {d.applications.items.map((a) => (
                    <li key={a.id}>
                      <div>
                        <b>{a.full_name}</b>
                        <small>{a.position}</small>
                      </div>
                      <Badge tone={APPLICATION_STATUS[a.status].tone}>{APPLICATION_STATUS[a.status].label}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ to, icon, label, value, note }: { to: string; icon: React.ReactNode; label: string; value?: number; note: string }) {
  return (
    <Link to={`${ADMIN_BASE}${to}`} className="a-card a-stat">
      <span className="a-stat-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="a-stat-top">{label}</span>
      <b>{value ?? '–'}</b>
      <small>{note}</small>
    </Link>
  );
}
