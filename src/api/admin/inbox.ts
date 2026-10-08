// Số liệu hộp thư cho Tổng quan và thanh bên (số yêu cầu / hồ sơ mới). Chỉ admin.
// Thao tác trên từng yêu cầu / hồ sơ: xem contacts.ts và applications.ts.
import { db, toApiError } from '../client';

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
