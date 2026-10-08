// Trang quản trị › Hồ sơ ứng tuyển (/quan-tri/ung-tuyen). Chỉ admin (RLS chặn mọi người khác).
// Bảng: job_applications. Kho file: cv (riêng tư — chỉ tải qua link có hạn).
import { db, deleteById, pageRange, searchTerm, toApiError, toPage, unwrap, type Page, type PageQuery } from '../client';
import type { ApplicationStatus, JobApplicationRow } from '../rows';

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
  await deleteById('job_applications', id, 'hồ sơ');
}

/** Link tải CV có hạn (mặc định 10 phút) — kho "cv" riêng tư nên không có link cố định. */
export async function getCvDownloadUrl(cvPath: string, expiresInSeconds = 600) {
  const { data, error } = await db().storage.from('cv').createSignedUrl(cvPath, expiresInSeconds, { download: true });
  if (error) throw toApiError(error);
  return data.signedUrl;
}
