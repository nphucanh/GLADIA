// Liên hệ — dùng ở: trang Liên hệ (form yêu cầu tư vấn).
// Bảng: contact_submissions (chỉ gửi, khách không đọc lại được). Trigger tăng projects.interest_count.
import type { ContactPayload } from '../../types';
import { db, isSupabaseConfigured, toApiError, unwrap } from '../client';
import { clean, ensure, isValidEmail, isValidName, isValidPhone } from '../validate';
import { demoDb, nextDemoId, nowIso, saveDemoDb } from '../demoStore';
import type { SubmitResult } from './shared';

/** Gửi yêu cầu tư vấn (form Liên hệ). Gửi kèm tên dự án → tăng lượt quan tâm của dự án đó. */
export async function submitContact(payload: ContactPayload): Promise<SubmitResult> {
  ensure([
    [isValidName(payload.full_name), 'Vui lòng nhập họ tên (2–120 ký tự).'],
    [isValidPhone(payload.phone), 'Số điện thoại không hợp lệ (9–11 chữ số).'],
    [isValidEmail(payload.email), 'Email không hợp lệ.'],
    [payload.topic.trim().length > 0 && payload.topic.length <= 200, 'Vui lòng chọn chủ đề.'],
    [(payload.message ?? '').length <= 5000, 'Nội dung tối đa 5000 ký tự.'],
  ]);
  if (!isSupabaseConfigured) {
    const d = demoDb();
    const project = clean(payload.project_interest);
    d.contacts.push({
      id: nextDemoId(),
      full_name: payload.full_name.trim(),
      phone: payload.phone.replace(/\s/g, ''),
      email: payload.email.trim(),
      project_interest: project,
      topic: payload.topic.trim(),
      message: clean(payload.message),
      status: 'new',
      admin_note: null,
      handled_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    // như trigger trên database: tăng lượt quan tâm của dự án được chọn
    d.projects.forEach((p) => {
      if (p.name === project) p.interest_count += 1;
    });
    saveDemoDb();
    return { stored: false };
  }
  try {
    unwrap(
      await db()
        .from('contact_submissions')
        .insert({
          full_name: payload.full_name.trim(),
          phone: payload.phone.replace(/\s/g, ''),
          email: payload.email.trim(),
          project_interest: clean(payload.project_interest),
          topic: payload.topic.trim(),
          message: clean(payload.message),
        }),
    );
    return { stored: true };
  } catch (err) {
    throw toApiError(err);
  }
}
