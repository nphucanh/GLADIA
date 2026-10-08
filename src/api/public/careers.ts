// Tuyển dụng — dùng ở: trang Tuyển dụng (danh sách vị trí + form ứng tuyển).
// Bảng: jobs (đọc vị trí đang mở), job_applications (chỉ gửi). Kho file: cv (riêng tư).
import type { Job, JobApplicationPayload } from '../../types';
import { mockJobs } from '../../data/mockJobs';
import { db, isSupabaseConfigured, readOrMock, toApiError, unwrap, type Sourced } from '../client';
import { CV_MAX_BYTES, CV_MIME_TYPES, clean, ensure, isValidEmail, isValidName, isValidPhone, isValidUrl, uniqueName } from '../validate';
import { toJob, type JobRow } from '../rows';
import { demoDb, nextDemoId, nowIso, saveDemoDb } from '../demoStore';
import { byOrder, isDemo, type SubmitResult } from './shared';

// ---------- Dữ liệu dự phòng ----------

export function fallbackJobs(): Job[] {
  if (!isDemo) return mockJobs;
  return demoDb()
    .jobs.filter((j) => j.is_open)
    .sort(byOrder)
    .map(toJob);
}

// ---------- API ----------

/** Các vị trí đang mở, theo thứ tự hiển thị. */
export function listJobs(): Promise<Sourced<Job[]>> {
  return readOrMock(
    'vị trí tuyển dụng',
    async (c) =>
      unwrap<JobRow[]>(
        await c.from('jobs').select('*').order('sort_order', { ascending: true }).order('id', { ascending: true }),
      ).map(toJob),
    fallbackJobs,
  );
}

/**
 * Nộp hồ sơ ứng tuyển. File CV (PDF/Word ≤ 5MB) được tải lên kho riêng tư "cv" — chỉ admin xem được.
 */
export async function submitApplication(payload: JobApplicationPayload): Promise<SubmitResult> {
  const file = payload.cv_file ?? null;
  const cvUrl = clean(payload.cv_url);
  ensure([
    [isValidName(payload.full_name), 'Vui lòng nhập họ tên (2–120 ký tự).'],
    [isValidPhone(payload.phone), 'Số điện thoại không hợp lệ (9–11 chữ số).'],
    [isValidEmail(payload.email), 'Email không hợp lệ.'],
    [!cvUrl || isValidUrl(cvUrl), 'Link CV / portfolio phải bắt đầu bằng http:// hoặc https://'],
    [!file || file.size <= CV_MAX_BYTES, 'File CV tối đa 5MB.'],
    [!file || CV_MIME_TYPES.includes(file.type), 'File CV phải là PDF hoặc Word (.doc, .docx).'],
    [(payload.message ?? '').length <= 5000, 'Lời nhắn tối đa 5000 ký tự.'],
  ]);
  if (!isSupabaseConfigured) {
    demoDb().applications.push({
      id: nextDemoId(),
      job_id: payload.job_id ?? null,
      position: clean(payload.position) ?? 'Vị trí khác',
      full_name: payload.full_name.trim(),
      phone: payload.phone.replace(/\s/g, ''),
      email: payload.email.trim(),
      cv_url: cvUrl,
      cv_path: file ? `applications/${uniqueName(file.name)}` : null,
      message: clean(payload.message),
      status: 'new',
      admin_note: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    saveDemoDb();
    return { stored: false };
  }
  try {
    const client = db();
    let cvPath: string | null = null;
    if (file) {
      cvPath = `applications/${uniqueName(file.name)}`;
      const up = await client.storage.from('cv').upload(cvPath, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
    }
    unwrap(
      await client.from('job_applications').insert({
        job_id: payload.job_id ?? null,
        position: clean(payload.position) ?? 'Vị trí khác',
        full_name: payload.full_name.trim(),
        phone: payload.phone.replace(/\s/g, ''),
        email: payload.email.trim(),
        cv_url: cvUrl,
        cv_path: cvPath,
        message: clean(payload.message),
      }),
    );
    return { stored: true };
  } catch (err) {
    throw toApiError(err);
  }
}
