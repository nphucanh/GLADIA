import { useEffect, useState } from 'react';
import { Mail, MessageSquareText, Phone, Trash2 } from 'lucide-react';
import { admin } from '../../api/admin';
import type { ContactStatus, ContactSubmissionRow } from '../../api/rows';
import { useAdmin } from '../AdminApp';
import { CONTACT_STATUS } from '../meta';
import { Badge, Empty, ErrorBox, Field, fmtAgo, fmtDateTime, Loading, PageHeader, Pager, usePaging, ResultInfo, SearchBox, Seg, Sheet, useAction, useAsync, useDebounced, useFeedback } from '../ui';

const STATUSES = Object.keys(CONTACT_STATUS) as ContactStatus[];

export default function Contacts() {
  const { stats, refreshStats } = useAdmin();
  const [status, setStatus] = useState<ContactStatus | ''>('new');
  const [search, setSearch] = useState('');
  const { page, setPage, pageSize, setPageSize } = usePaging('contacts');
  const [open, setOpen] = useState<ContactSubmissionRow | null>(null);
  const q = useDebounced(search);
  const list = useAsync(() => admin.contacts.listContactSubmissions({ status: status || undefined, search: q, page, pageSize }), [status, q, page, pageSize]);

  const updated = (row: ContactSubmissionRow) => {
    list.setData((d) => d && { ...d, items: d.items.map((x) => (x.id === row.id ? row : x)) });
    setOpen(row);
    refreshStats();
  };

  return (
    <>
      <PageHeader title="Yêu cầu tư vấn" subtitle="Gửi từ form Liên hệ trên website. Bấm vào một yêu cầu để xem chi tiết và cập nhật trạng thái." />
      <div className="a-card">
        <div className="a-toolbar">
          <Seg<ContactStatus | ''>
            label="Lọc theo trạng thái"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Tất cả' },
              ...STATUSES.map((s) => ({ value: s, label: CONTACT_STATUS[s].label, count: s === 'new' ? stats?.newContacts : undefined })),
            ]}
          />
          <SearchBox
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Tìm tên, SĐT, email…"
          />
          <ResultInfo total={list.data?.total} unit="yêu cầu" />
        </div>
        {list.error ? (
          <ErrorBox message={list.error} onRetry={list.reload} />
        ) : !list.data ? (
          <Loading />
        ) : list.data.items.length === 0 ? (
          <Empty title={status === 'new' && !q ? 'Không còn yêu cầu mới' : 'Không có yêu cầu phù hợp'} icon={<MessageSquareText size={36} strokeWidth={1.4} />}>
            {status === 'new' && !q && 'Mọi yêu cầu đã được xử lý.'}
          </Empty>
        ) : (
          <>
            <div className="a-table-wrap">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Dự án / chủ đề</th>
                    <th>Trạng thái</th>
                    <th>Gửi lúc</th>
                    <th className="actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((c) => (
                    <tr key={c.id} className={`clickable${c.status === 'new' ? ' a-unread' : ''}`} onClick={() => setOpen(c)}>
                      <td>
                        <b>{c.full_name}</b>
                        <span className="a-sub">
                          {c.phone} · {c.email}
                        </span>
                      </td>
                      <td>
                        {c.project_interest ?? <span className="a-sub" style={{ display: 'inline' }}>Không chọn dự án</span>}
                        <span className="a-sub">{c.topic}</span>
                      </td>
                      <td>
                        <Badge tone={CONTACT_STATUS[c.status].tone}>{CONTACT_STATUS[c.status].label}</Badge>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {fmtAgo(c.created_at)}
                        <span className="a-sub">{fmtDateTime(c.created_at)}</span>
                      </td>
                      <td className="actions">
                        <div className="a-row-actions">
                          <button type="button" className="a-btn a-btn--secondary a-btn--sm">
                            Xem & xử lý
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={list.data.page} totalPages={list.data.totalPages} total={list.data.total} pageSize={list.data.pageSize} onChange={setPage} onPageSize={setPageSize} unit="yêu cầu" />
          </>
        )}
      </div>
      {open && (
        <ContactSheet
          row={open}
          onClose={() => setOpen(null)}
          onUpdated={updated}
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

function ContactSheet({
  row,
  onClose,
  onUpdated,
  onDeleted,
}: {
  row: ContactSubmissionRow;
  onClose: () => void;
  onUpdated: (r: ContactSubmissionRow) => void;
  onDeleted: () => void;
}) {
  const [note, setNote] = useState(row.admin_note ?? '');
  const { run, runOk, busy } = useAction();
  const { confirm } = useFeedback();
  useEffect(() => setNote(row.admin_note ?? ''), [row.id, row.admin_note]);

  async function setStatus(status: ContactStatus) {
    const r = await run(() => admin.contacts.updateContactSubmission(row.id, { status }), `Đã chuyển sang "${CONTACT_STATUS[status].label}"`);
    if (r) onUpdated(r);
  }
  async function saveNote() {
    const r = await run(() => admin.contacts.updateContactSubmission(row.id, { admin_note: note.trim() || null }), 'Đã lưu ghi chú');
    if (r) onUpdated(r);
  }
  async function remove() {
    const ok = await confirm({ title: 'Xoá yêu cầu này?', message: 'Thông tin khách hàng sẽ bị xoá vĩnh viễn.', confirmLabel: 'Xoá', danger: true });
    if (ok && (await runOk(() => admin.contacts.deleteContactSubmission(row.id), 'Đã xoá yêu cầu'))) onDeleted();
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={row.full_name}
      subtitle={`Gửi lúc ${fmtDateTime(row.created_at)}`}
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
              <Phone size={14} /> Gọi {row.phone}
            </a>
          </div>
        </>
      }
    >
      <Field label="Trạng thái">
        <div className="a-tabs">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`a-tab${row.status === s ? ' active' : ''}`}
              disabled={busy || row.status === s}
              onClick={() => setStatus(s)}
            >
              {CONTACT_STATUS[s].label}
            </button>
          ))}
        </div>
        {row.handled_at && <span className="a-hint">Xử lý xong lúc {fmtDateTime(row.handled_at)}</span>}
      </Field>
      <dl className="a-dl">
        <dt>Điện thoại</dt>
        <dd>
          <a href={`tel:${row.phone}`}>{row.phone}</a>
        </dd>
        <dt>Email</dt>
        <dd>
          <a href={`mailto:${row.email}`}>{row.email}</a>
        </dd>
        <dt>Dự án quan tâm</dt>
        <dd>{row.project_interest ?? '—'}</dd>
        <dt>Chủ đề</dt>
        <dd>{row.topic}</dd>
      </dl>
      <Field label="Lời nhắn của khách">
        {row.message ? <p className="a-quote">{row.message}</p> : <span className="a-hint">Không có lời nhắn.</span>}
      </Field>
      <Field label="Ghi chú nội bộ" hint="Chỉ quản trị viên thấy.">
        <textarea className="a-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="vd. Đã gọi, hẹn xem nhà mẫu thứ 7…" />
        {note !== (row.admin_note ?? '') && (
          <button type="button" className="a-btn a-btn--secondary a-btn--sm" style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={saveNote}>
            Lưu ghi chú
          </button>
        )}
      </Field>
    </Sheet>
  );
}
