import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Newspaper, Pencil, Plus, Trash2 } from 'lucide-react';
import { admin } from '../../api/admin';
import type { NewsRow } from '../../api/rows';
import type { NewsCategory } from '../../data/mockNews';
import { NEWS_FEATURED_IMAGE } from '../../data/images';
import { ADMIN_BASE } from '../AdminApp';
import { NEWS_CATEGORY_LABEL } from '../meta';
import { Badge, Empty, ErrorBox, fmtDate, Loading, PageHeader, Pager, usePaging, ResultInfo, SearchBox, Select, today, useAction, useAsync, useDebounced, useFeedback } from '../ui';

type Visibility = '' | 'published' | 'draft';

export default function News() {
  const navigate = useNavigate();
  const { confirm } = useFeedback();
  const { runOk } = useAction();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<NewsCategory | ''>('');
  const [visibility, setVisibility] = useState<Visibility>('');
  const { page, setPage, pageSize, setPageSize } = usePaging('news');
  const q = useDebounced(search);
  const list = useAsync(
    () =>
      admin.news.listNews({
        search: q,
        category: category || undefined,
        published: visibility === '' ? undefined : visibility === 'published',
        page,
        pageSize,
      }),
    [q, category, visibility, page, pageSize],
  );

  async function remove(n: NewsRow) {
    const ok = await confirm({ title: 'Xoá bài viết?', message: `"${n.title}" sẽ bị xoá vĩnh viễn.`, confirmLabel: 'Xoá bài', danger: true });
    if (ok && (await runOk(() => admin.news.deleteNews(n.id), 'Đã xoá bài viết'))) list.reload();
  }

  const now = today();
  const state = (n: NewsRow) =>
    !n.is_published ? <Badge>Bản nháp</Badge> : n.published_at > now ? <Badge tone="info">Hẹn giờ</Badge> : <Badge tone="ok">Đã đăng</Badge>;
  const filtered = Boolean(q || category || visibility);

  return (
    <>
      <PageHeader
        title="Tin tức"
        actions={
          <Link to={`${ADMIN_BASE}/tin-tuc/moi`} className="a-btn a-btn--primary">
            <Plus size={16} /> Viết bài mới
          </Link>
        }
      />
      <div className="a-card">
        <div className="a-toolbar">
          <SearchBox
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Tìm theo tiêu đề…"
          />
          <Select<NewsCategory | ''>
            value={category}
            onChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
            aria-label="Chuyên mục"
            options={[
              { value: '', label: 'Mọi chuyên mục' },
              ...(Object.keys(NEWS_CATEGORY_LABEL) as NewsCategory[]).map((c) => ({ value: c, label: NEWS_CATEGORY_LABEL[c] })),
            ]}
          />
          <Select<Visibility>
            value={visibility}
            onChange={(v) => {
              setVisibility(v);
              setPage(1);
            }}
            aria-label="Trạng thái"
            options={[
              { value: '', label: 'Mọi trạng thái' },
              { value: 'published', label: 'Đã đăng / hẹn giờ' },
              { value: 'draft', label: 'Bản nháp' },
            ]}
          />
          <ResultInfo
            total={list.data?.total}
            unit="bài viết"
            onClear={
              filtered
                ? () => {
                    setSearch('');
                    setCategory('');
                    setVisibility('');
                    setPage(1);
                  }
                : undefined
            }
          />
        </div>
        {list.error ? (
          <ErrorBox message={list.error} onRetry={list.reload} />
        ) : !list.data ? (
          <Loading />
        ) : list.data.items.length === 0 ? (
          <Empty title={filtered ? 'Không có bài phù hợp' : 'Chưa có bài viết nào'} icon={<Newspaper size={36} strokeWidth={1.4} />} />
        ) : (
          <>
            <div className="a-table-wrap">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Bài viết</th>
                    <th>Chuyên mục</th>
                    <th>Ngày đăng</th>
                    <th>Trạng thái</th>
                    <th className="actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((n) => (
                    <tr key={n.id} className="clickable" onClick={() => navigate(`${ADMIN_BASE}/tin-tuc/${n.id}`)}>
                      <td>
                        <div className="a-cell-main">
                          <img className="a-thumb lg" src={n.image_url ?? NEWS_FEATURED_IMAGE} alt="" loading="lazy" />
                          <div style={{ maxWidth: 640 }}>
                            <b className="a-clamp">{n.title}</b>
                            <small>
                              {n.is_featured && 'Nổi bật · '}
                              {n.content.length} đoạn
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>{NEWS_CATEGORY_LABEL[n.category]}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(n.published_at)}</td>
                      <td>{state(n)}</td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <div className="a-row-actions">
                          <Link className="a-btn a-btn--secondary a-btn--sm" to={`${ADMIN_BASE}/tin-tuc/${n.id}`}>
                            <Pencil size={14} /> Sửa
                          </Link>
                          <a className="a-icon-btn" href={`/tin-tuc/${n.id}`} target="_blank" rel="noreferrer" title="Xem trên website" aria-label="Xem trên website">
                            <ExternalLink size={15} />
                          </a>
                          <button type="button" className="a-icon-btn danger" onClick={() => remove(n)} title="Xoá bài viết" aria-label="Xoá bài viết">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={list.data.page} totalPages={list.data.totalPages} total={list.data.total} pageSize={list.data.pageSize} onChange={setPage} onPageSize={setPageSize} unit="bài viết" />
          </>
        )}
      </div>
    </>
  );
}
