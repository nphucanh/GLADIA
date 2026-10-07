// Hộp thư quản trị: yêu cầu tư vấn (form Liên hệ) và hồ sơ ứng tuyển (kèm tải CV). Chỉ admin.
import { db, pageRange, searchTerm, toApiError, toPage, unwrap, type Page, type PageQuery } from '../client';
import type { ApplicationStatus, ContactStatus, ContactSubmissionRow, JobApplicationRow } from '../rows';

// ---------- Yêu cầu tư vấn ----------

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
  unwrap(await db().from('contact_submissions').delete().eq('id', id));
}

// ---------- Hồ sơ ứng tuyển ----------

export interface ApplicationFilter extends PageQuery {
  status?: ApplicationStatus;
  jobId?: number;
  search?: string; // theo tên / SĐT / email / vị trí
}

export async function listJobApplications(f: ApplicationFilter = {}): Promise<Page<JobApplicationRow>> {
  const { page, pageSize, from, to } = pageRange(f);
  let q = db()
    .from('job_applications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  const s = searchTerm(f.search);
  if (s) q = q.or(`full_name.ilike.${s},phone.ilike.${s},email.ilike.${s},position.ilike.${s}`);
  if (f.status) q = q.eq('status', f.status);
  if (f.jobId) q = q.eq('job_id', f.jobId);
  const res = await q;
  return toPage(unwrap<JobApplicationRow[]>(res), res.count, page, pageSize);
}

export async function updateJobApplication(id: number, patch: { status?: ApplicationStatus; admin_note?: string | null }) {
  return unwrap<JobApplicationRow>(await db().from('job_applications').update(patch).eq('id', id).select().single());
}

/** Xoá hồ sơ kèm file CV trong kho. */
export async function deleteJobApplication(id: number) {
  const row = unwrap<Pick<JobApplicationRow, 'cv_path'>>(
    await db().from('job_applications').select('cv_path').eq('id', id).single(),
  );
  if (row.cv_path) {
    const { error } = await db().storage.from('cv').remove([row.cv_path]);
    if (error) throw toApiError(error);
  }
  unwrap(await db().from('job_applications').delete().eq('id', id));
}

/** Link tải CV có hạn (mặc định 10 phút) — kho "cv" riêng tư nên không có link cố định. */
export async function getCvDownloadUrl(cvPath: string, expiresInSeconds = 600) {
  const { data, error } = await db().storage.from('cv').createSignedUrl(cvPath, expiresInSeconds, { download: true });
  if (error) throw toApiError(error);
  return data.signedUrl;
}

// ---------- Tổng quan ----------

export interface InboxStats {
  newContacts: number;
  newApplications: number;
  contactsLast7Days: number;
  applicationsLast7Days: number;
}

/** Số liệu cho bảng điều khiển: số yêu cầu / hồ sơ mới chưa xử lý và trong 7 ngày qua. */
export async function getInboxStats(): Promise<InboxStats> {
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const count = async (table: string, build: (q: any) => any) => {
    const res = await build(db().from(table).select('id', { count: 'exact', head: true }));
    if (res.error) throw toApiError(res.error);
    return (res.count as number | null) ?? 0;
  };
  const [newContacts, newApplications, contactsLast7Days, applicationsLast7Days] = await Promise.all([
    count('contact_submissions', (q) => q.eq('status', 'new')),
    count('job_applications', (q) => q.eq('status', 'new')),
    count('contact_submissions', (q) => q.gte('created_at', since)),
    count('job_applications', (q) => q.gte('created_at', since)),
  ]);
  return { newContacts, newApplications, contactsLast7Days, applicationsLast7Days };
}

function nextDay(isoDate: string) {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}
