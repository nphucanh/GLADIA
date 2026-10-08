import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, FileUser, FolderKanban, MessageSquareText, Newspaper, Plus, type LucideIcon } from 'lucide-react';
import { admin, type ItemStat } from '../../api/admin';
import { ADMIN_BASE, useAdmin } from '../AdminApp';
import { SERIES_COLOR, tint } from '../charts';
import { APPLICATION_STATUS, CONTACT_STATUS } from '../meta';
import { Delta, RefreshButton, useUpdatedAt, fmtNum, fmtPct, itemImage, itemLabel, Legend, Meter, PeriodSeg, rate, Sparkline, sum, TrendChart, usePeriod } from '../statsUi';
import { Badge, Empty, ErrorBox, fmtAgo, Loading, PageHeader, Seg, useAsync } from '../ui';

const C_PROJECT = SERIES_COLOR.project;
const C_NEWS = SERIES_COLOR.news;
const C_LEAD = SERIES_COLOR.lead;
const C_APP = SERIES_COLOR.application;

export default function Dashboard() {
  const { session, stats: inbox, refreshStats, profile } = useAdmin();
  const [period, setPeriod] = usePeriod();
  const [chartMode, setChartMode] = useState<'line' | 'bar'>('line');
  const stats = useAsync(() => admin.stats.getInterestStats(period), [period]);
  const recent = useAsync(
    () =>
      Promise.all([admin.contacts.listContactSubmissions({ pageSize: 5 }), admin.applications.listJobApplications({ pageSize: 5 })]).then(([contacts, applications]) => ({
        contacts: contacts.items,
        applications: applications.items,
      })),
    [],
  );

  const updatedAt = useUpdatedAt(stats.data);
  const refresh = () => {
    stats.reload();
    recent.reload();
    refreshStats();
  };

  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const s = stats.data;

  // Nửa đầu chuỗi ngày là kỳ trước, nửa sau là kỳ này
  const cur = s ? s.daily.slice(s.days) : [];
  const prev = s ? s.daily.slice(0, s.days) : [];
  const total = (rows: typeof cur, k: 'projectViews' | 'newsViews' | 'leads' | 'applications') => sum(rows.map((r) => r[k]));
  const series = (k: 'projectViews' | 'newsViews' | 'leads' | 'applications') => cur.map((r) => r[k]);

  const kpis: Kpi[] = s
    ? [
        { icon: FolderKanban, label: 'Lượt xem dự án', value: total(cur, 'projectViews'), prev: total(prev, 'projectViews'), spark: series('projectViews'), color: C_PROJECT, to: '/thong-ke' },
        { icon: Newspaper, label: 'Lượt đọc tin tức', value: total(cur, 'newsViews'), prev: total(prev, 'newsViews'), spark: series('newsViews'), color: C_NEWS, to: '/thong-ke?tab=news' },
        { icon: MessageSquareText, label: 'Yêu cầu tư vấn', value: total(cur, 'leads'), prev: total(prev, 'leads'), spark: series('leads'), color: C_LEAD, to: '/lien-he' },
        { icon: FileUser, label: 'Hồ sơ ứng tuyển', value: total(cur, 'applications'), prev: total(prev, 'applications'), spark: series('applications'), color: C_APP, to: '/ung-tuyen' },
      ]
    : [];

  const topProjects = s ? [...s.projects].sort((a, b) => b.views - a.views || b.leads - a.leads).slice(0, 5) : [];
  const topNews = s ? [...s.news].sort((a, b) => b.views - a.views).slice(0, 5) : [];
  const projectViews = s ? total(cur, 'projectViews') : 0;
  const leads = s ? total(cur, 'leads') : 0;

  return (
    <>
      <PageHeader
        title="Tổng quan"
        subtitle={`${greet}, ${profile?.full_name || session.user.email}.`}
        actions={
          <>
            <RefreshButton loading={stats.loading || recent.loading} onClick={refresh} updatedAt={updatedAt} />
            <PeriodSeg value={period} onChange={setPeriod} />
            <Link to={`${ADMIN_BASE}/thong-ke`} className="a-btn a-btn--secondary">
              <BarChart3 size={16} /> Thống kê chi tiết
            </Link>
          </>
        }
      />

      {stats.error ? (
        <div className="a-card">
          <ErrorBox message={stats.error} onRetry={stats.reload} />
        </div>
      ) : (
        <>
          <div className="a-kpis">
            {s ? kpis.map((k) => <KpiCard key={k.label} k={k} period={period} />) : [0, 1, 2, 3].map((i) => <div key={i} className="a-card a-kpi a-skeleton" />)}
          </div>

          <div className="a-dash">
            <div className="a-card">
              <div className="a-card-head">
                <div>
                  <h2>Lượt quan tâm theo ngày</h2>
                  <p className="a-card-sub">Lượt mở trang chi tiết dự án và bài viết trên website</p>
                </div>
                {s && (
                  <div className="a-card-tools">
                    <Legend
                      items={[
                        { label: 'Dự án', color: C_PROJECT },
                        { label: 'Tin tức', color: C_NEWS },
                      ]}
                    />
                    <Seg<'line' | 'bar'>
                      label="Dạng biểu đồ"
                      value={chartMode}
                      onChange={setChartMode}
                      options={[
                        { value: 'line', label: 'Đường' },
                        { value: 'bar', label: 'Cột' },
                      ]}
                    />
                  </div>
                )}
              </div>
              <div className="a-card-body">
                {s ? (
                  <TrendChart
                    mode={chartMode}
                    days={cur.map((r) => r.day)}
                    series={[
                      { label: 'Xem dự án', color: C_PROJECT, values: series('projectViews'), area: chartMode === 'line' },
                      { label: 'Đọc tin tức', color: C_NEWS, values: series('newsViews') },
                    ]}
                    extra={[{ label: 'Yêu cầu tư vấn', values: series('leads') }]}
                  />
                ) : (
                  <Loading />
                )}
              </div>
              {s && (
                <div className="a-card-foot a-mini-stats">
                  <span>
                    Tỉ lệ chuyển đổi
                    <b>{fmtPct(rate(leads, projectViews), 2)}</b>
                    <small>yêu cầu tư vấn / lượt xem dự án</small>
                  </span>
                  <span>
                    Trung bình mỗi ngày
                    <b>{fmtNum((projectViews + total(cur, 'newsViews')) / period)}</b>
                    <small>lượt xem</small>
                  </span>
                  <span>
                    Ngày đông nhất
                    <b>{busiestDay(cur)}</b>
                    <small>theo tổng lượt xem</small>
                  </span>
                </div>
              )}
            </div>

            <div className="a-dash-side">
              <div className="a-card">
                <div className="a-card-head">
                  <h2>Cần xử lý</h2>
                </div>
                <ul className="a-todo">
                  <TodoRow to="/lien-he" icon={MessageSquareText} label="Yêu cầu tư vấn mới" count={inbox?.newContacts} />
                  <TodoRow to="/ung-tuyen" icon={FileUser} label="Hồ sơ ứng tuyển mới" count={inbox?.newApplications} />
                </ul>
              </div>
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
            </div>
          </div>

          <div className="a-dash-2">
            <TopList
              title="Dự án được quan tâm nhất"
              more="/thong-ke"
              items={topProjects}
              loading={!s}
              meta={(p) => (
                <>
                  {itemLabel(p)} · <b>{fmtNum(p.leads)}</b> yêu cầu tư vấn
                </>
              )}
              empty="Chưa có lượt xem dự án nào trong kỳ này."
            />
            <TopList
              title="Bài viết được đọc nhiều nhất"
              more="/thong-ke?tab=news"
              items={topNews}
              loading={!s}
              meta={(n) => itemLabel(n)}
              color={C_NEWS}
              empty="Chưa có lượt đọc bài viết nào trong kỳ này."
            />
          </div>

        </>
      )}

      <div className="a-dash-2">
        <div className="a-card">
          <div className="a-card-head">
            <h2>Yêu cầu tư vấn gần đây</h2>
            <Link to={`${ADMIN_BASE}/lien-he`}>Xem tất cả →</Link>
          </div>
          {recent.error ? (
            <ErrorBox message={recent.error} onRetry={recent.reload} />
          ) : !recent.data ? (
            <Loading />
          ) : recent.data.contacts.length === 0 ? (
            <Empty title="Chưa có yêu cầu nào" />
          ) : (
            <ul className="a-list">
              {recent.data.contacts.map((c) => (
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
        <div className="a-card">
          <div className="a-card-head">
            <h2>Hồ sơ ứng tuyển gần đây</h2>
            <Link to={`${ADMIN_BASE}/ung-tuyen`}>Xem tất cả →</Link>
          </div>
          {recent.error ? null : !recent.data ? (
            <Loading />
          ) : recent.data.applications.length === 0 ? (
            <Empty title="Chưa có hồ sơ nào" />
          ) : (
            <ul className="a-list">
              {recent.data.applications.map((a) => (
                <li key={a.id}>
                  <div>
                    <b>{a.full_name}</b>
                    <small>{a.position}</small>
                  </div>
                  <Badge tone={APPLICATION_STATUS[a.status].tone}>{APPLICATION_STATUS[a.status].label}</Badge>
                  <time dateTime={a.created_at}>{fmtAgo(a.created_at)}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function busiestDay(rows: { day: string; projectViews: number; newsViews: number }[]) {
  const best = rows.reduce<(typeof rows)[number] | null>((b, r) => (!b || r.projectViews + r.newsViews > b.projectViews + b.newsViews ? r : b), null);
  return best && best.projectViews + best.newsViews > 0 ? `${best.day.slice(8, 10)}/${best.day.slice(5, 7)}` : '—';
}

interface Kpi {
  icon: LucideIcon;
  label: string;
  value: number;
  prev: number;
  spark: number[];
  color: string;
  to: string;
}

function KpiCard({ k, period }: { k: Kpi; period: number }) {
  const Icon = k.icon;
  return (
    <Link to={`${ADMIN_BASE}${k.to}`} className="a-card a-kpi">
      <span className="a-kpi-head">
        <span className="a-kpi-icon" style={{ color: k.color, background: tint(k.color) }}>
          <Icon size={18} />
        </span>
        {k.label}
      </span>
      <span className="a-kpi-value">
        <b>{fmtNum(k.value)}</b>
        <Delta cur={k.value} prev={k.prev} />
      </span>
      <small>so với {period} ngày trước ({fmtNum(k.prev)})</small>
      <Sparkline values={k.spark} color={k.color} />
    </Link>
  );
}

function TodoRow({ to, icon: Icon, label, count }: { to: string; icon: LucideIcon; label: string; count?: number }) {
  return (
    <li>
      <Icon size={18} />
      <span>{label}</span>
      <b className={count ? 'hot' : undefined}>{count ?? '–'}</b>
      <Link to={`${ADMIN_BASE}${to}`} className="a-btn a-btn--secondary a-btn--sm">
        {count ? 'Xử lý' : 'Xem'}
      </Link>
    </li>
  );
}

function TopList({
  title,
  more,
  items,
  loading,
  meta,
  empty,
  color = C_PROJECT,
}: {
  title: string;
  more: string;
  items: ItemStat[];
  loading: boolean;
  meta: (s: ItemStat) => React.ReactNode;
  empty: string;
  color?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.views));
  return (
    <div className="a-card">
      <div className="a-card-head">
        <h2>{title}</h2>
        <Link to={`${ADMIN_BASE}${more}`}>Xem tất cả →</Link>
      </div>
      {loading ? (
        <Loading />
      ) : items.every((i) => i.views === 0) ? (
        <Empty title="Chưa có số liệu">{empty}</Empty>
      ) : (
        <ol className="a-top">
          {items.map((it, i) => (
            <li key={it.id}>
              <span className="a-top-rank">{i + 1}</span>
              <img className="a-thumb" src={itemImage(it)} alt="" loading="lazy" />
              <div className="a-top-main">
                <Link to={`${ADMIN_BASE}/thong-ke?tab=${it.kind === 'news' ? 'news' : 'projects'}&id=${it.id}`} className="a-top-title">
                  {it.title}
                </Link>
                <small>{meta(it)}</small>
                <Meter value={it.views} max={max} color={color} />
              </div>
              <div className="a-top-num">
                <b>{fmtNum(it.views)}</b>
                <Delta cur={it.views} prev={it.prevViews} compact />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
