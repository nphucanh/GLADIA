// Xem thử › Hồ sơ ứng tuyển.
import type * as ApplicationsApi from '../applications';
import { clone, commit, D, delay, find, like, now, paginate } from './shared';

export const applicationsApi: typeof ApplicationsApi = {
  async listJobApplications(f = {}) {
    const rows = D().applications
      .filter((a) => like(f.search, a.full_name, a.phone, a.email, a.position))
      .filter((a) => !f.status || a.status === f.status)
      .filter((a) => !f.jobId || a.job_id === f.jobId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return delay(paginate(rows, f));
  },
  async updateJobApplication(id, patch) {
    const a = find(D().applications, id, 'hồ sơ');
    Object.assign(a, patch, { updated_at: now() });
    return commit(clone(a));
  },
  async deleteJobApplication(id) {
    find(D().applications, id, 'hồ sơ');
    D().applications.splice(D().applications.findIndex((a) => a.id === id), 1);
    await commit(null);
  },
  async getCvDownloadUrl(cvPath) {
    const text = `Chế độ xem thử — đây là file thay thế cho "${cvPath}".\nKhi kết nối Supabase, nút này tải file CV thật của ứng viên.`;
    return URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  },
};
