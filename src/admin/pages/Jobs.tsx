import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Briefcase, Pencil, Plus, Trash2 } from 'lucide-react';
import { admin, type JobInput } from '../../api/admin';
import type { JobRow } from '../../api/rows';
import type { JobIcon } from '../../types';
import { JOB_ICON_LABEL, JOB_ICONS } from '../../components/JobIcon';
import { ADMIN_BASE } from '../AdminApp';
import { Badge, Empty, ErrorBox, Field, Loading, PageHeader, paginate, Pager, Sheet, Switch, useAction, useAsync, useFeedback, usePaging } from '../ui';

const ICONS = Object.keys(JOB_ICONS) as JobIcon[];

const blank = (): JobInput => ({ title: '', location: 'TP.HCM', employment_type: 'Toàn thời gian', summary: '', icon: 'building', is_open: true });

export default function Jobs() {
  const jobs = useAsync(() => admin.jobs.listJobs(), []);
  const { run } = useAction();
  const { confirm } = useFeedback();
  const [editing, setEditing] = useState<JobRow | 'new' | null>(null);
  const list = jobs.data ?? [];
  const { page, setPage, pageSize, setPageSize } = usePaging('jobs', 10);
  const view = paginate(list, page, pageSize);

  async function toggle(j: JobRow, v: boolean) {
    const r = await run(() => admin.jobs.updateJob(j.id, { is_open: v }), v ? 'Đã mở lại vị trí' : 'Đã đóng vị trí');
    if (r) jobs.setData((d) => d?.map((x) => (x.id === r.id ? r : x)));
  }

  async function move(i: number, dir: -1 | 1) {
    const ids = list.map((j) => j.id);
    [ids[i], ids[i + dir]] = [ids[i + dir], ids[i]];
    jobs.setData(() => ids.map((id, k) => ({ ...list.find((j) => j.id === id)!, sort_order: k })));
    await run(() => admin.jobs.reorderJobs(ids));
  }

  async function remove(j: JobRow) {
    const ok = await confirm({
      title: `Xoá vị trí "${j.title}"?`,
      message: 'Hồ sơ đã nộp cho vị trí này vẫn được giữ lại trong Hồ sơ ứng tuyển.',
      confirmLabel: 'Xoá vị trí',
      danger: true,
    });
    if (ok && (await run(() => admin.jobs.deleteJob(j.id), 'Đã xoá vị trí')) !== undefined) jobs.reload();
  }

  const open = list.filter((j) => j.is_open).length;

  return (
    <>
      <PageHeader
        title="Tuyển dụng"
        subtitle={jobs.data ? `${open} vị trí đang mở trên trang Tuyển dụng · thứ tự dưới đây là thứ tự hiển thị.` : undefined}
        actions={
          <>
            <Link to={`${ADMIN_BASE}/ung-tuyen`} className="a-btn a-btn--secondary">
              Xem hồ sơ ứng tuyển
            </Link>
            <button type="button" className="a-btn a-btn--primary" onClick={() => setEditing('new')}>
              <Plus size={16} /> Thêm vị trí
            </button>
          </>
        }
      />
      <div className="a-card">
        {jobs.error ? (
          <ErrorBox message={jobs.error} onRetry={jobs.reload} />
        ) : !jobs.data ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty title="Chưa có vị trí nào" icon={<Briefcase size={36} strokeWidth={1.4} />}>
            Bấm "Thêm vị trí" để đăng tin tuyển dụng đầu tiên.
          </Empty>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th style={{ width: 96 }}>Thứ tự</th>
                  <th>Vị trí</th>
                  <th>Nơi làm việc</th>
                  <th>Trạng thái</th>
                  <th className="actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {view.items.map((j, k) => {
                  const i = view.offset + k;
                  return (
                    <tr key={j.id} className="clickable" onClick={() => setEditing(j)}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="a-order">
                          <button type="button" className="a-icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Lên" title="Đưa lên trên">
                            <ArrowUp size={14} />
                          </button>
                          <button type="button" className="a-icon-btn" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Xuống" title="Đưa xuống dưới">
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="a-cell-main">
                          <span className="a-job-icon">{JOB_ICONS[j.icon]}</span>
                          <div style={{ maxWidth: 680 }}>
                            <b>{j.title}</b>
                            <small className="a-clamp">{j.summary}</small>
                          </div>
                        </div>
                      </td>
                      <td className="nowrap">
                        {j.location}
                        <span className="a-sub">{j.employment_type}</span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={j.is_open}
                          onChange={(v) => toggle(j, v)}
                          label={<span className="a-switch-label">{j.is_open ? 'Đang tuyển' : 'Đã đóng'}</span>}
                        />
                      </td>
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <div className="a-row-actions">
                          <button type="button" className="a-btn a-btn--secondary a-btn--sm" onClick={() => setEditing(j)}>
                            <Pencil size={14} /> Sửa
                          </button>
                          <button type="button" className="a-icon-btn danger" onClick={() => remove(j)} title="Xoá vị trí" aria-label={`Xoá ${j.title}`}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {list.length > 0 && (
          <Pager page={view.page} totalPages={view.totalPages} total={view.total} pageSize={pageSize} onChange={setPage} onPageSize={setPageSize} unit="vị trí" />
        )}
      </div>
      {editing && (
        <JobSheet
          job={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            jobs.reload();
          }}
        />
      )}
    </>
  );
}

function JobSheet({ job, onClose, onSaved }: { job: JobRow | null; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<JobInput>(() =>
    job
      ? { title: job.title, location: job.location, employment_type: job.employment_type, summary: job.summary, icon: job.icon, is_open: job.is_open }
      : blank(),
  );
  const [touched, setTouched] = useState(false);
  const { run, busy } = useAction();
  const set = <K extends keyof JobInput>(k: K, v: JobInput[K]) => setD((x) => ({ ...x, [k]: v }));
  const errors = {
    title: d.title.trim().length < 3 ? 'Tên vị trí tối thiểu 3 ký tự.' : null,
    location: d.location.trim() ? null : 'Vui lòng nhập nơi làm việc.',
  };

  async function save() {
    setTouched(true);
    if (errors.title || errors.location) return;
    const input = { ...d, title: d.title.trim(), location: d.location.trim(), summary: d.summary.trim() };
    const r = await run(() => (job ? admin.jobs.updateJob(job.id, input) : admin.jobs.createJob(input)), job ? 'Đã lưu vị trí' : 'Đã đăng vị trí mới');
    if (r) onSaved();
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={job ? 'Sửa vị trí' : 'Vị trí mới'}
      subtitle={job ? job.title : 'Hiện ngay trên trang Tuyển dụng khi đang mở.'}
      footer={
        <>
          {job ? <Badge tone={d.is_open ? 'ok' : 'neutral'}>{d.is_open ? 'Đang tuyển' : 'Đã đóng'}</Badge> : <span />}
          <div className="a-actions">
            <button type="button" className="a-btn a-btn--secondary" onClick={onClose}>
              Huỷ
            </button>
            <button type="button" className="a-btn a-btn--primary" disabled={busy} onClick={save}>
              {job ? 'Lưu' : 'Đăng vị trí'}
            </button>
          </div>
        </>
      }
    >
      <Field label="Tên vị trí" required error={touched ? errors.title : null} htmlFor="j-title">
        <input id="j-title" className="a-input" value={d.title} onChange={(e) => set('title', e.target.value)} autoFocus />
      </Field>
      <div className="a-grid-2">
        <Field label="Nơi làm việc" required error={touched ? errors.location : null}>
          <input className="a-input" value={d.location} onChange={(e) => set('location', e.target.value)} />
        </Field>
        <Field label="Hình thức">
          <select className="a-input" value={d.employment_type} onChange={(e) => set('employment_type', e.target.value)}>
            {['Toàn thời gian', 'Bán thời gian', 'Thực tập', 'Cộng tác viên'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Mô tả ngắn" hint="Một–hai câu hiện trên thẻ vị trí.">
        <textarea className="a-input" rows={4} value={d.summary} onChange={(e) => set('summary', e.target.value)} />
      </Field>
      <Field label="Biểu tượng">
        <div className="a-icon-pick" role="radiogroup" aria-label="Biểu tượng">
          {ICONS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={d.icon === k}
              title={JOB_ICON_LABEL[k]}
              className={d.icon === k ? 'active' : undefined}
              onClick={() => set('icon', k)}
            >
              {JOB_ICONS[k]}
            </button>
          ))}
        </div>
      </Field>
      <Switch checked={d.is_open ?? true} onChange={(v) => set('is_open', v)} label="Đang tuyển" hint="Tắt để ẩn khỏi trang Tuyển dụng mà không xoá." />
    </Sheet>
  );
}
