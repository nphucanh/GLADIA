import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react';
import { admin } from '../../api/admin';
import type { ProjectRow } from '../../api/rows';
import type { ProjectStatus, ProjectType } from '../../types';
import { PROJECT_IMAGE_BY_BUILDING } from '../../data/images';
import { ADMIN_BASE } from '../AdminApp';
import { PROJECT_STATUSES, PROJECT_STATUS_TONE, PROJECT_TYPES } from '../meta';
import { Badge, Empty, ErrorBox, Loading, PageHeader, Pager, usePaging, ResultInfo, SearchBox, Select, Switch, useAction, useAsync, useDebounced, useFeedback } from '../ui';

export default function Projects() {
  const navigate = useNavigate();
  const { confirm } = useFeedback();
  const { run, runOk } = useAction();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<ProjectType | ''>('');
  const [status, setStatus] = useState<ProjectStatus | ''>('');
  const { page, setPage, pageSize, setPageSize } = usePaging('projects');
  const q = useDebounced(search);
  const list = useAsync(
    () => admin.projects.listProjects({ search: q, type: type || undefined, status: status || undefined, page, pageSize }),
    [q, type, status, page, pageSize],
  );

  async function togglePublished(p: ProjectRow, v: boolean) {
    const r = await run(() => admin.projects.updateProject(p.id, { is_published: v }), v ? `Đã hiển thị "${p.name}"` : `Đã ẩn "${p.name}"`);
    if (r) list.setData((d) => d && { ...d, items: d.items.map((x) => (x.id === p.id ? r : x)) });
  }

  async function remove(p: ProjectRow) {
    const ok = await confirm({
      title: `Xoá dự án "${p.name}"?`,
      message: 'Ảnh không gian sống và mặt bằng riêng của dự án cũng bị xoá. Không thể hoàn tác.',
      confirmLabel: 'Xoá dự án',
      danger: true,
    });
    if (ok && (await runOk(() => admin.projects.deleteProject(p.id), 'Đã xoá dự án'))) list.reload();
  }

  const filtered = Boolean(q || type || status);

  return (
    <>
      <PageHeader
        title="Dự án"
        actions={
          <Link to={`${ADMIN_BASE}/du-an/moi`} className="a-btn a-btn--primary">
            <Plus size={16} /> Thêm dự án
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
            placeholder="Tìm theo tên hoặc vị trí…"
          />
          <Select<ProjectType | ''>
            value={type}
            onChange={(v) => {
              setType(v);
              setPage(1);
            }}
            aria-label="Lọc theo loại hình"
            options={[{ value: '', label: 'Mọi loại hình' }, ...PROJECT_TYPES.map((t) => ({ value: t, label: t }))]}
          />
          <Select<ProjectStatus | ''>
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            aria-label="Lọc theo trạng thái"
            options={[{ value: '', label: 'Mọi trạng thái' }, ...PROJECT_STATUSES.map((s) => ({ value: s, label: s }))]}
          />
          <ResultInfo
            total={list.data?.total}
            unit="dự án"
            onClear={
              filtered
                ? () => {
                    setSearch('');
                    setType('');
                    setStatus('');
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
          <Empty title={filtered ? 'Không có dự án phù hợp' : 'Chưa có dự án nào'} icon={<FolderKanban size={36} strokeWidth={1.4} />}>
            {filtered ? 'Thử bỏ bớt bộ lọc.' : 'Bấm "Thêm dự án" để tạo dự án đầu tiên.'}
          </Empty>
        ) : (
          <>
            <div className="a-table-wrap">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Dự án</th>
                    <th>Loại hình</th>
                    <th>Trạng thái</th>
                    <th className="num">Giá từ</th>
                    <th className="num">Quan tâm</th>
                    <th>Hiển thị</th>
                    <th className="actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((p) => (
                    <tr key={p.id} className="clickable" onClick={() => navigate(`${ADMIN_BASE}/du-an/${p.id}`)}>
                      <td>
                        <div className="a-cell-main">
                          <img className="a-thumb lg" src={p.cover_image_url ?? PROJECT_IMAGE_BY_BUILDING[p.building_type]} alt="" />
                          <div>
                            <b>{p.name}</b>
                            <small>{p.location}</small>
                          </div>
                        </div>
                      </td>
                      <td>{p.type}</td>
                      <td>
                        <Badge tone={PROJECT_STATUS_TONE[p.status]}>{p.status}</Badge>
                      </td>
                      <td className="num">{Number(p.price).toLocaleString('vi-VN')} tỷ</td>
                      <td className="num">{p.interest_count.toLocaleString('vi-VN')}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={p.is_published}
                          onChange={(v) => togglePublished(p, v)}
                          label={<span className="a-switch-label">{p.is_published ? 'Hiển thị' : 'Đang ẩn'}</span>}
                        />
                      </td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <div className="a-row-actions">
                          <Link className="a-btn a-btn--secondary a-btn--sm" to={`${ADMIN_BASE}/du-an/${p.id}`}>
                            <Pencil size={14} /> Sửa
                          </Link>
                          <a className="a-icon-btn" href={`/du-an/${p.id}`} target="_blank" rel="noreferrer" title="Xem trên website" aria-label={`Xem ${p.name} trên website`}>
                            <ExternalLink size={15} />
                          </a>
                          <button type="button" className="a-icon-btn danger" onClick={() => remove(p)} title="Xoá dự án" aria-label={`Xoá ${p.name}`}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={list.data.page} totalPages={list.data.totalPages} total={list.data.total} pageSize={list.data.pageSize} onChange={setPage} onPageSize={setPageSize} unit="dự án" />
          </>
        )}
      </div>
    </>
  );
}
