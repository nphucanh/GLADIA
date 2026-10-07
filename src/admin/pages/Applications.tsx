import { useEffect, useState } from 'react';
import { Download, ExternalLink, FileUser, Mail, Phone, Trash2 } from 'lucide-react';
import { admin } from '../../api/admin';
import type { ApplicationStatus, JobApplicationRow } from '../../api/rows';
import { useAdmin } from '../AdminApp';
import { APPLICATION_STATUS } from '../meta';
import { Badge, Empty, ErrorBox, Field, fmtAgo, fmtDateTime, Loading, PageHeader, Pager, usePaging, ResultInfo, SearchBox, Seg, Sheet, useAction, useAsync, useDebounced, useFeedback } from '../ui';

const STATUSES = Object.keys(APPLICATION_STATUS) as ApplicationStatus[];

export default function Applications() {
  const { stats, refreshStats } = useAdmin();
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [jobId, setJobId] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const { page, setPage, pageSize, setPageSize } = usePaging('applications');
  const [open, setOpen] = useState<JobApplicationRow | null>(null);
  const q = useDebounced(search);
  const jobs = useAsync(() => admin.jobs.listJobs(), []);
  const list = useAsync(
    () => admin.inbox.listJobApplications({ status: status || undefined, jobId: jobId || undefined, search: q, page, pageSize }),
    [status, jobId, q, page, pageSize],
  );

  return (
    <>
      <PageHeader title="Hồ sơ ứng tuyển" subtitle="Gửi từ form Ứng tuyển trên trang Tuyển dụng." />
      <div className="a-card">
        <div className="a-toolbar">
          <Seg<ApplicationStatus | ''>
            label="Lọc theo trạng thái"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Tất cả' },
              ...STATUSES.map((s) => ({ value: s, label: APPLICATION_STATUS[s].label, count: s === 'new' ? stats?.newApplications : undefined })),
            ]}
          />
        </div>
        <div className="a-toolbar">
          <SearchBox
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Tìm tên, SĐT, email, vị trí…"
          />
          <select
            className="a-input"
            style={{ maxWidth: 340 }}
            value={jobId}
            onChange={(e) => {
              setJobId(e.target.value ? Number(e.target.value) : '');
              setPage(1);
            }}
            aria-label="Lọc theo vị trí"
          >
            <option value="">Mọi vị trí</option>
            {(jobs.data ?? []).map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          <ResultInfo total={list.data?.total} unit="hồ sơ" />
        </div>
        {list.error ? (
          <ErrorBox message={list.error} onRetry={list.reload} />
        ) : !list.data ? (
          <Loading />
        ) : list.data.items.length === 0 ? (
          <Empty title="Không có hồ sơ phù hợp" icon={<FileUser size={36} strokeWidth={1.4} />} />
        ) : (
          <>
            <div className="a-table-wrap">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Ứng viên</th>
                    <th>Vị trí</th>
                    <th>CV</th>
                    <th>Trạng thái</th>
                    <th>Nộp lúc</th>
                    <th className="actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((a) => (
                    <tr key={a.id} className={`clickable${a.status === 'new' ? ' a-unread' : ''}`} onClick={() => setOpen(a)}>
                      <td>
                        <b>{a.full_name}</b>
                        <span className="a-sub">
                          {a.phone} · {a.email}
                        </span>
                      </td>
                      <td>{a.position}</td>
                      <td>{a.cv_path ? <Badge tone="accent" plain>File CV</Badge> : a.cv_url ? <Badge plain>Link</Badge> : <span className="a-sub">—</span>}</td>
                      <td>
                        <Badge tone={APPLICATION_STATUS[a.status].tone}>{APPLICATION_STATUS[a.status].label}</Badge>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {fmtAgo(a.created_at)}
                        <span className="a-sub">{fmtDateTime(a.created_at)}</span>
                      </td>
                      <td className="actions">
                        <div className="a-row-actions">
                          <button type="button" className="a-btn a-btn--secondary a-btn--sm">
                            Xem hồ sơ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={list.data.page} totalPages={list.data.totalPages} total={list.data.total} pageSize={list.data.pageSize} onChange={setPage} onPageSize={setPageSize} unit="hồ sơ" />
          </>
        )}
      </div>
      {open && (
        <ApplicationSheet
          row={open}
          onClose={() => setOpen(null)}
          onUpdated={(r) => {
            list.setData((d) => d && { ...d, items: d.items.map((x) => (x.id === r.id ? r : x)) });
            setOpen(r);
            refreshStats();
          }}
          onDeleted={() => {
            setOpen(null);
            list.reload();
            refreshStats();
          }}
        />
      )}
    </>
  );
}

function ApplicationSheet({
  row,
  onClose,
  onUpdated,
  onDeleted,
}: {
  row: JobApplicationRow;
  onClose: () => void;
  onUpdated: (r: JobApplicationRow) => void;
  onDeleted: () => void;
}) {
  const [note, setNote] = useState(row.admin_note ?? '');
  const { run, busy } = useAction();
  const { confirm } = useFeedback();
  useEffect(() => setNote(row.admin_note ?? ''), [row.id, row.admin_note]);

  async function setStatus(status: ApplicationStatus) {
    const r = await run(() => admin.inbox.updateJobApplication(row.id, { status }), `Đã chuyển sang "${APPLICATION_STATUS[status].label}"`);
    if (r) onUpdated(r);
  }
  async function saveNote() {
    const r = await run(() => admin.inbox.updateJobApplication(row.id, { admin_note: note.trim() || null }), 'Đã lưu ghi chú');
    if (r) onUpdated(r);
  }
  async function downloadCv() {
    if (!row.cv_path) return;
    const url = await run(() => admin.inbox.getCvDownloadUrl(row.cv_path!));
    if (url) window.open(url, '_blank', 'noopener');
  }
  async function remove() {
    const ok = await confirm({ title: 'Xoá hồ sơ này?', message: 'Hồ sơ và file CV đính kèm sẽ bị xoá vĩnh viễn.', confirmLabel: 'Xoá hồ sơ', danger: true });
    if (ok && (await run(() => admin.inbox.deleteJobApplication(row.id), 'Đã xoá hồ sơ')) !== undefined) onDeleted();
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={row.full_name}
      subtitle={`${row.position} · nộp lúc ${fmtDateTime(row.created_at)}`}
      footer={
        <>
          <button type="button" className="a-btn a-btn--danger a-btn--sm" disabled={busy} onClick={remove}>
            <Trash2 size={14} /> Xoá
          </button>
          <div className="a-actions">
            <a className="a-btn a-btn--secondary a-btn--sm" href={`mailto:${row.email}`}>
              <Mail size={14} /> Email
            </a>
            <a className="a-btn a-btn--primary a-btn--sm" href={`tel:${row.phone}`}>
              <Phone size={14} /> Gọi
            </a>
          </div>
        </>
      }
    >
      <Field label="Trạng thái">
        <div className="a-tabs">
          {STATUSES.map((s) => (
            <button key={s} type="button" className={`a-tab${row.status === s ? ' active' : ''}`} disabled={busy || row.status === s} onClick={() => setStatus(s)}>
              {APPLICATION_STATUS[s].label}
            </button>
          ))}
        </div>
      </Field>
      <dl className="a-dl">
        <dt>Vị trí</dt>
        <dd>
          {row.position}
          {row.job_id === null && <span className="a-sub">Tin tuyển dụng đã bị xoá hoặc ứng tuyển tự do</span>}
        </dd>
        <dt>Điện thoại</dt>
        <dd>
          <a href={`tel:${row.phone}`}>{row.phone}</a>
        </dd>
        <dt>Email</dt>
        <dd>
          <a href={`mailto:${row.email}`}>{row.email}</a>
        </dd>
      </dl>
      <Field label="CV / Portfolio">
        <div className="a-actions">
          {row.cv_path && (
            <button type="button" className="a-btn a-btn--secondary a-btn--sm" disabled={busy} onClick={downloadCv}>
              <Download size={14} /> Tải file CV
            </button>
          )}
          {row.cv_url && (
            <a className="a-btn a-btn--secondary a-btn--sm" href={row.cv_url} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Mở link
            </a>
          )}
          {!row.cv_path && !row.cv_url && <span className="a-hint">Ứng viên không gửi CV.</span>}
        </div>
        {row.cv_path && <span className="a-hint">Link tải có hiệu lực 10 phút.</span>}
      </Field>
      <Field label="Lời nhắn của ứng viên">
        {row.message ? <p className="a-quote">{row.message}</p> : <span className="a-hint">Không có lời nhắn.</span>}
      </Field>
      <Field label="Ghi chú nội bộ" hint="Chỉ quản trị viên thấy.">
        <textarea className="a-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="vd. Hẹn phỏng vấn 9h thứ 3…" />
        {note !== (row.admin_note ?? '') && (
          <button type="button" className="a-btn a-btn--secondary a-btn--sm" style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={saveNote}>
            Lưu ghi chú
          </button>
        )}
      </Field>
    </Sheet>
  );
}
