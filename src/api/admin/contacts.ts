// Trang quản trị › Yêu cầu tư vấn (/quan-tri/lien-he). Chỉ admin (RLS chặn mọi người khác).
// Bảng: contact_submissions.
import { db, deleteById, pageRange, searchTerm, toPage, unwrap, type Page, type PageQuery } from '../client';
import type { ContactStatus, ContactSubmissionRow } from '../rows';

export interface ContactFilter extends PageQuery {
  status?: ContactStatus;
  search?: string; // theo tên / SĐT / email
  project?: string; // tên dự án quan tâm
  from?: string; // ISO date — gửi từ ngày
  to?: string; // ISO date — gửi đến hết ngày
}

export async function listContactSubmissions(f: ContactFilter = {}): Promise<Page<ContactSubmissionRow>> {
  const { page, pageSize, from, to } = pageRange(f);
  let q = db()
    .from('contact_submissions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  const s = searchTerm(f.search);
  if (s) q = q.or(`full_name.ilike.${s},phone.ilike.${s},email.ilike.${s}`);
  if (f.status) q = q.eq('status', f.status);
  if (f.project) q = q.eq('project_interest', f.project);
  if (f.from) q = q.gte('created_at', f.from);
  if (f.to) q = q.lt('created_at', nextDay(f.to));
  const res = await q;
  return toPage(unwrap<ContactSubmissionRow[]>(res), res.count, page, pageSize);
}

/** Đổi trạng thái / ghi chú; chuyển sang "done" thì ghi lại thời điểm xử lý. */
export async function updateContactSubmission(id: number, patch: { status?: ContactStatus; admin_note?: string | null }) {
  const row: Record<string, unknown> = { ...patch };
  if (patch.status === 'done') row.handled_at = new Date().toISOString();
  else if (patch.status) row.handled_at = null;
  return unwrap<ContactSubmissionRow>(await db().from('contact_submissions').update(row).eq('id', id).select().single());
}

export async function deleteContactSubmission(id: number) {
  await deleteById('contact_submissions', id, 'yêu cầu');
}

function nextDay(isoDate: string) {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}
