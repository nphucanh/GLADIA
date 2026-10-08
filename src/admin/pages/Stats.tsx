import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, BarChart3, Download, ExternalLink, Eye, ListChecks, MessageSquareText, Pencil, Percent, RefreshCw, Sigma, Trophy, type LucideIcon } from 'lucide-react';
import { admin, type ItemStat, type StatsKind } from '../../api/admin';
import { ADMIN_BASE } from '../AdminApp';
import { BarList, BUILDING_COLOR, ChartCard, DonutChart, Heatmap, NEWS_CATEGORY_COLOR, OTHER_COLOR, PALETTE, SERIES_COLOR, tint, type Slice } from '../charts';
import {
  Delta,
  fmtNum,
  Legend,
  fmtPct,
  itemEditUrl,
  itemImage,
  itemLabel,
  itemSiteUrl,
  Meter,
  PeriodSeg,
  rate,
  RefreshButton,
  sum,
  TrendChart,
  usePeriod,
  useUpdatedAt,
  type Period,
} from '../statsUi';
import { Badge, Empty, ErrorBox, Loading, PageHeader, paginate, Pager, ResultInfo, SearchBox, Seg, Sheet, useAsync, useDebounced, usePaging } from '../ui';

type Tab = 'projects' | 'news';
type SortKey = 'title' | 'views' | 'delta' | 'total' | 'leads' | 'rate';

const deltaOf = (s: ItemStat) => (s.prevViews > 0 ? (s.views - s.prevViews) / s.prevViews : s.views > 0 ? Infinity : 0);
const SORTERS: Record<SortKey, (s: ItemStat) => number | string> = {
  title: (s) => s.title.toLowerCase(),
  views: (s) => s.views,
  delta: deltaOf,
  total: (s) => s.totalViews,
  leads: (s) => s.leads,
  rate: (s) => rate(s.leads, s.views),
};

export default function Stats() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'news' ? 'news' : 'projects';
  const openId = Number(params.get('id')) || null;
  const [period, setPeriod] = usePeriod();
  const [search, setSearch] = useState('');
  const q = useDebounced(search).trim().toLowerCase();
  const [chartMode, setChartMode] = useState<'line' | 'bar'>('line');
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'views', desc: true });
  const { page, setPage, pageSize, setPageSize } = usePaging('stats');
  const stats = useAsync(() => admin.stats.getInterestStats(period), [period]);
  const updatedAt = useUpdatedAt(stats.data);
  // Tăng mỗi lần bấm "Làm mới" → khung chi tiết đang mở cũng tải lại
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => {
    stats.reload();
    setRefreshKey((k) => k + 1);
  };

  const s = stats.data;
  const all = s ? (tab === 'news' ? s.news : s.projects) : [];
  const rows = useMemo(() => {
    const get = SORTERS[sort.key];
    const filtered = all.filter((r) => !q || r.title.toLowerCase().includes(q) || itemLabel(r).toLowerCase().includes(q));
    return filtered.sort((a, b) => {
      const x = get(a);
      const y = get(b);
      const c = typeof x === 'string' ? x.localeCompare(y as string, 'vi') : (x as number) - (y as number);
      return (sort.desc ? -c : c) || b.views - a.views || a.id - b.id;
    });
  }, [all, q, sort]);
  const view = paginate(rows, page, pageSize);
  const max = Math.max(1, ...all.map((r) => r.views));
  const open = openId ? all.find((r) => r.id === openId) ?? null : null;

  const setTab = (t: Tab) => {
    setParams(t === 'news' ? { tab: 'news' } : {}, { replace: true });
    setPage(1);
    setSort((x) => (t === 'news' && (x.key === 'leads' || x.key === 'rate') ? { key: 'views', desc: true } : x));
  };
  const openItem = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('id', String(id));
    else next.delete('id');
    setParams(next, { replace: true });
  };
  const sortBy = (key: SortKey) => {
    setSort((x) => (x.key === key ? { key, desc: !x.desc } : { key, desc: key !== 'title' }));
    setPage(1);
  };

  const views = sum(all.map((r) => r.views));
  const prevViews = sum(all.map((r) => r.prevViews));
  const leads = sum(all.map((r) => r.leads));
  const prevLeads = sum(all.map((r) => r.prevLeads));
  const active = all.filter((r) => r.views > 0).length;
  const isProjects = tab === 'projects';
  const unit = isProjects ? 'dự án' : 'bài viết';
  const tone = isProjects ? SERIES_COLOR.project : SERIES_COLOR.news;
  const top10: Slice[] = [...all]
    .sort((a, b) => b.views - a.views)
    .slice(0, 10)
    .filter((x) => x.views > 0)
    .map((x) => ({ label: x.title, value: x.views }));

  // Xu hướng chung (cả dự án lẫn tin tức) — nửa sau chuỗi ngày là kỳ này
  const cur = s ? s.daily.slice(s.days) : [];
  const byType = s ? groupBy(s.projects, itemLabel, (p) => BUILDING_COLOR[p.buildingType ?? ''] ?? OTHER_COLOR) : [];
  const byCategory = s ? groupBy(s.news, itemLabel, (n) => NEWS_CATEGORY_COLOR[n.label] ?? OTHER_COLOR) : [];

  function exportCsv() {
    const head = isProjects
      ? ['ID', 'Dự án', 'Loại hình', 'Hiển thị', `Lượt xem ${period} ngày`, 'Kỳ trước', 'Tổng lượt xem', `Yêu cầu tư vấn ${period} ngày`, 'Tỉ lệ chuyển đổi (%)']
      : ['ID', 'Bài viết', 'Chuyên mục', 'Hiển thị', `Lượt đọc ${period} ngày`, 'Kỳ trước', 'Tổng lượt đọc'];
    const body = rows.map((r) =>
      isProjects
        ? [r.id, r.title, itemLabel(r), r.isPublished ? 'Có' : 'Ẩn', r.views, r.prevViews, r.totalViews, r.leads, rate(r.leads, r.views).toFixed(2)]
        : [r.id, r.title, itemLabel(r), r.isPublished ? 'Có' : 'Ẩn', r.views, r.prevViews, r.totalViews],
    );
    const csv = [head, ...body].map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `thong-ke-${isProjects ? 'du-an' : 'tin-tuc'}-${period}-ngay.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <PageHeader
        title="Thống kê lượt quan tâm"
        actions={
          <>
            <RefreshButton loading={stats.loading} onClick={refresh} updatedAt={updatedAt} />
            <PeriodSeg value={period} onChange={(p) => (setPeriod(p), setPage(1))} />
            <button type="button" className="a-btn a-btn--secondary" onClick={exportCsv} disabled={!s || rows.length === 0}>
              <Download size={16} /> Xuất CSV
            </button>
          </>
        }
      />

      {stats.error ? (
        <div className="a-card">
          <ErrorBox message={stats.error} onRetry={stats.reload} />
        </div>
      ) : (
        <>
          <h2 className="a-section-title">Xu hướng chung</h2>
          <div className="a-dash">
            <ChartCard
              title="Lượt quan tâm theo ngày"
              sub="Lượt mở trang chi tiết dự án và bài viết · rê chuột để xem từng ngày"
              tools={
                s && (
                  <div className="a-card-tools">
                    <Legend
                      items={[
                        { label: 'Dự án', color: SERIES_COLOR.project },
                        { label: 'Tin tức', color: SERIES_COLOR.news },
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
                )
              }
            >
              {s ? (
                <TrendChart
                  mode={chartMode}
                  days={cur.map((d) => d.day)}
                  series={[
                    { label: 'Xem dự án', color: SERIES_COLOR.project, values: cur.map((d) => d.projectViews), area: chartMode === 'line' },
                    { label: 'Đọc tin tức', color: SERIES_COLOR.news, values: cur.map((d) => d.newsViews) },
                  ]}
                  extra={[{ label: 'Yêu cầu tư vấn', values: cur.map((d) => d.leads) }]}
                />
              ) : (
                <Loading />
              )}
            </ChartCard>
            <ChartCard title="Lịch lượt quan tâm" sub={`${period * 2} ngày gần nhất · đậm hơn = nhiều lượt hơn`}>
              {s ? <Heatmap days={s.daily.map((d) => d.day)} values={s.daily.map((d) => d.projectViews + d.newsViews)} /> : <Loading />}
            </ChartCard>
          </div>

          <div className="a-dash-3 a-dash-pair">
            <ChartCard title="Lượt xem theo loại hình" sub="Tỉ trọng lượt xem dự án trong kỳ">
              {s ? <DonutChart data={byType} /> : <Loading />}
            </ChartCard>
            <ChartCard title="Lượt đọc theo chuyên mục" sub="Tỉ trọng lượt đọc tin tức trong kỳ">
              {s ? <DonutChart data={byCategory} unit="lượt đọc" /> : <Loading />}
            </ChartCard>
          </div>

          <div className="a-section-head">
            <h2 className="a-section-title">Chi tiết từng {unit}</h2>
            <Seg<Tab>
              label="Loại nội dung"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'projects', label: 'Dự án', count: s?.projects.length },
                { value: 'news', label: 'Bài viết', count: s?.news.length },
              ]}
            />
          </div>
          <div className="a-kpis a-kpis--flat">
            <Summary icon={Eye} color={tone} label={isProjects ? 'Lượt xem dự án' : 'Lượt đọc bài viết'} value={s && fmtNum(views)} delta={s && <Delta cur={views} prev={prevViews} />} />
            <Summary
              icon={ListChecks}
              color={SERIES_COLOR.active}
              label={isProjects ? 'Dự án có lượt xem' : 'Bài viết có lượt đọc'}
              value={s && `${fmtNum(active)} / ${fmtNum(all.length)}`}
              note={`trong ${period} ngày`}
            />
            {isProjects ? (
              <>
                <Summary icon={MessageSquareText} color={SERIES_COLOR.lead} label="Yêu cầu tư vấn theo dự án" value={s && fmtNum(leads)} delta={s && <Delta cur={leads} prev={prevLeads} />} />
                <Summary icon={Percent} color={PALETTE[4]} label="Tỉ lệ chuyển đổi" value={s && fmtPct(rate(leads, views), 2)} note="yêu cầu tư vấn / lượt xem" />
              </>
            ) : (
              <>
                <Summary icon={Sigma} color={PALETTE[4]} label="Trung bình mỗi bài" value={s && fmtNum(all.length ? views / all.length : 0)} note={`lượt đọc / ${period} ngày`} />
                <Summary icon={Trophy} color={PALETTE[6]} label="Bài đọc nhiều nhất" value={s && fmtNum(Math.max(0, ...all.map((r) => r.views)))} note="lượt đọc" />
              </>
            )}
          </div>

          <div className="a-top10">
            <ChartCard title={`Top 10 ${unit} trong ${period} ngày`} sub={isProjects ? 'Theo lượt xem trang chi tiết' : 'Theo lượt đọc'}>
              {!s ? <Loading /> : top10.length ? <BarList data={top10} color={tone} unit={isProjects ? 'lượt xem' : 'lượt đọc'} /> : <Empty title="Chưa có số liệu trong kỳ này" />}
            </ChartCard>
          </div>

          <div className="a-card">
            <div className="a-toolbar">
              <SearchBox
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                placeholder={isProjects ? 'Tìm tên dự án, loại hình…' : 'Tìm tiêu đề, chuyên mục…'}
              />
              <ResultInfo total={s ? rows.length : undefined} unit={unit} onClear={search ? () => setSearch('') : undefined} />
            </div>
            {!s ? (
              <Loading />
            ) : rows.length === 0 ? (
              <Empty title={`Không có ${unit} phù hợp`} icon={<BarChart3 size={36} strokeWidth={1.4} />} />
            ) : (
              <>
                <div className="a-table-wrap">
                  <table className="a-table a-stats-table">
                    <thead>
                      <tr>
                        <th style={{ width: 56 }}>#</th>
                        <SortTh k="title" sort={sort} onSort={sortBy}>
                          {isProjects ? 'Dự án' : 'Bài viết'}
                        </SortTh>
                        <SortTh k="views" sort={sort} onSort={sortBy} num wide>
                          {isProjects ? 'Lượt xem' : 'Lượt đọc'} ({period} ngày)
                        </SortTh>
                        <SortTh k="delta" sort={sort} onSort={sortBy} num>
                          So với kỳ trước
                        </SortTh>
                        <SortTh k="total" sort={sort} onSort={sortBy} num>
                          Tổng từ trước
                        </SortTh>
                        {isProjects && (
                          <>
                            <SortTh k="leads" sort={sort} onSort={sortBy} num>
                              Yêu cầu tư vấn
                            </SortTh>
                            <SortTh k="rate" sort={sort} onSort={sortBy} num>
                              Chuyển đổi
                            </SortTh>
                          </>
                        )}
                        <th className="actions">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {view.items.map((r, i) => (
                        <tr key={r.id} className="clickable" onClick={() => openItem(r.id)}>
                          <td className="a-rank">{view.offset + i + 1}</td>
                          <td>
                            <div className="a-cell-main">
                              <img className="a-thumb" src={itemImage(r)} alt="" loading="lazy" />
                              <div>
                                <b className="a-clamp">{r.title}</b>
                                <small>
                                  {itemLabel(r)}
                                  {!r.isPublished && (
                                    <>
                                      {' · '}
                                      <span className="a-muted-tag">Đang ẩn</span>
                                    </>
                                  )}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="num">
                            <div className="a-views-cell">
                              <b>{fmtNum(r.views)}</b>
                              <Meter value={r.views} max={max} color={tone} />
                            </div>
                          </td>
                          <td className="num">
                            <Delta cur={r.views} prev={r.prevViews} />
                          </td>
                          <td className="num">{fmtNum(r.totalViews)}</td>
                          {isProjects && (
                            <>
                              <td className="num">{r.leads ? <b>{fmtNum(r.leads)}</b> : <span className="a-faint">0</span>}</td>
                              <td className="num">{r.views ? fmtPct(rate(r.leads, r.views), 2) : <span className="a-faint">—</span>}</td>
                            </>
                          )}
                          <td className="actions" onClick={(e) => e.stopPropagation()}>
                            <div className="a-row-actions">
                              <button type="button" className="a-btn a-btn--secondary a-btn--sm" onClick={() => openItem(r.id)}>
                                <BarChart3 size={14} /> Chi tiết
                              </button>
                              <Link to={`${ADMIN_BASE}${itemEditUrl(r)}`} className="a-icon-btn" title="Sửa" aria-label={`Sửa ${r.title}`}>
                                <Pencil size={15} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pager page={view.page} totalPages={view.totalPages} total={view.total} pageSize={pageSize} onChange={setPage} onPageSize={setPageSize} unit={unit} />
              </>
            )}
          </div>
        </>
      )}

      {open && <ItemSheet item={open} period={period} refreshKey={refreshKey} refreshing={stats.loading} onRefresh={refresh} onClose={() => openItem(null)} />}
    </>
  );
}

function groupBy(items: ItemStat[], key: (s: ItemStat) => string, color?: (s: ItemStat) => string): Slice[] {
  const m = new Map<string, Slice>();
  for (const it of items) {
    const k = key(it);
    const g = m.get(k) ?? { label: k, value: 0, color: color?.(it) };
    g.value += it.views;
    m.set(k, g);
  }
  return [...m.values()].sort((a, b) => b.value - a.value);
}

function Summary({
  icon: Icon,
  color,
  label,
  value,
  delta,
  note,
}: {
  icon: LucideIcon;
  color: string;
  label: string;
  value?: React.ReactNode;
  delta?: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="a-card a-kpi a-kpi--flat a-kpi--tinted" style={{ '--k': color } as React.CSSProperties}>
      <span className="a-kpi-head">
        <span className="a-kpi-icon" style={{ color, background: tint(color) }}>
          <Icon size={17} />
        </span>
        {label}
      </span>
      <span className="a-kpi-value">
        <b>{value ?? '–'}</b>
        {delta}
      </span>
      {note && <small>{note}</small>}
    </div>
  );
}

function SortTh({
  k,
  sort,
  onSort,
  num,
  wide,
  children,
}: {
  k: SortKey;
  sort: { key: SortKey; desc: boolean };
  onSort: (k: SortKey) => void;
  num?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const active = sort.key === k;
  return (
    <th className={num ? 'num' : undefined} style={wide ? { width: 220 } : undefined} aria-sort={active ? (sort.desc ? 'descending' : 'ascending') : 'none'}>
      <button type="button" className={`a-sort${active ? ' active' : ''}`} onClick={() => onSort(k)}>
        {children}
        {active ? sort.desc ? <ArrowDown size={13} /> : <ArrowUp size={13} /> : <ArrowDown size={13} className="ghost" />}
      </button>
    </th>
  );
}

function ItemSheet({
  item,
  period,
  refreshKey,
  refreshing,
  onRefresh,
  onClose,
}: {
  item: ItemStat;
  period: Period;
  refreshKey: number;
  refreshing: boolean;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const kind: StatsKind = item.kind;
  const daily = useAsync(() => admin.stats.getItemDaily(kind, item.id, period), [kind, item.id, period, refreshKey]);
  const [mode, setMode] = useState<'line' | 'bar'>('line');
  const isProject = kind === 'project';
  const d = daily.data;
  return (
    <Sheet
      open
      onClose={onClose}
      title={item.title}
      subtitle={`${isProject ? 'Dự án' : 'Bài viết'} · ${itemLabel(item)}`}
      footer={
        <>
          {item.isPublished ? <Badge tone="ok">Đang hiển thị</Badge> : <Badge tone="neutral">Đang ẩn</Badge>}
          <div className="a-actions">
            {item.isPublished && (
              <a className="a-btn a-btn--secondary a-btn--sm" href={itemSiteUrl(item)} target="_blank" rel="noreferrer">
                <ExternalLink size={14} /> Xem trên website
              </a>
            )}
            <Link className="a-btn a-btn--primary a-btn--sm" to={`${ADMIN_BASE}${itemEditUrl(item)}`}>
              <Pencil size={14} /> Sửa {isProject ? 'dự án' : 'bài viết'}
            </Link>
          </div>
        </>
      }
    >
      <img className="a-sheet-cover" src={itemImage(item)} alt="" />
      <div className="a-sheet-kpis">
        <span>
          {isProject ? 'Lượt xem' : 'Lượt đọc'} {period} ngày
          <b>{fmtNum(item.views)}</b>
          <Delta cur={item.views} prev={item.prevViews} />
        </span>
        <span>
          Tổng từ trước
          <b>{fmtNum(item.totalViews)}</b>
        </span>
        {isProject && (
          <>
            <span>
              Yêu cầu tư vấn
              <b>{fmtNum(item.leads)}</b>
              <Delta cur={item.leads} prev={item.prevLeads} />
            </span>
            <span>
              Chuyển đổi
              <b>{item.views ? fmtPct(rate(item.leads, item.views), 2) : '—'}</b>
            </span>
          </>
        )}
      </div>
      <div className="a-field">
        <div className="a-field-head">
          <span className="a-label">{isProject ? 'Lượt xem' : 'Lượt đọc'} theo ngày</span>
          <button
            type="button"
            className="a-icon-btn"
            style={{ marginLeft: 'auto' }}
            onClick={onRefresh}
            disabled={refreshing || daily.loading}
            title="Làm mới số liệu"
            aria-label="Làm mới số liệu"
          >
            <RefreshCw size={15} className={refreshing || daily.loading ? 'a-spin' : undefined} />
          </button>
          <Seg<'line' | 'bar'>
            label="Dạng biểu đồ"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'line', label: 'Đường' },
              { value: 'bar', label: 'Cột' },
            ]}
          />
        </div>
        {daily.error ? (
          <ErrorBox message={daily.error} onRetry={daily.reload} />
        ) : !d ? (
          <Loading />
        ) : (
          <TrendChart
            mode={mode}
            height={200}
            days={d.map((x) => x.day)}
            series={[{ label: isProject ? 'Lượt xem' : 'Lượt đọc', color: isProject ? SERIES_COLOR.project : SERIES_COLOR.news, values: d.map((x) => x.views), area: mode === 'line' }]}
            extra={isProject ? [{ label: 'Yêu cầu tư vấn', values: d.map((x) => x.leads) }] : undefined}
          />
        )}
      </div>
      <p className="a-hint">
        Mỗi trình duyệt được tính tối đa 1 lượt / {isProject ? 'dự án' : 'bài viết'} / ngày.
        {isProject && ' Yêu cầu tư vấn được tính khi khách chọn dự án này trong form Liên hệ (không tính spam).'}
      </p>
    </Sheet>
  );
}
