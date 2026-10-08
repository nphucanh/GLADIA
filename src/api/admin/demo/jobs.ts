// Xem thử › Tuyển dụng.
import type { JobRow } from '../../rows';
import type * as JobsApi from '../jobs';
import { validateJob } from '../jobs';
import { byOrder, clone, commit, D, delay, find, nextId, now } from './shared';

export const jobsApi: typeof JobsApi = {
  validateJob,
  async listJobs() {
    return delay(clone([...D().jobs].sort(byOrder)));
  },
  async createJob(input) {
    validateJob(input, true);
    const row: JobRow = {
      employment_type: 'Toàn thời gian',
      icon: 'building',
      is_open: true,
      sort_order: Math.max(-1, ...D().jobs.map((j) => j.sort_order)) + 1,
      ...input,
      id: nextId(),
      created_at: now(),
      updated_at: now(),
    };
    D().jobs.push(row);
    return commit(clone(row));
  },
  async updateJob(id, patch) {
    validateJob(patch, false);
    const j = find(D().jobs, id, 'vị trí');
    Object.assign(j, patch, { updated_at: now() });
    return commit(clone(j));
  },
  async deleteJob(id) {
    find(D().jobs, id, 'vị trí');
    D().jobs.splice(D().jobs.findIndex((j) => j.id === id), 1);
    D().applications.forEach((a) => {
      if (a.job_id === id) a.job_id = null;
    });
    await commit(null);
  },
  async reorderJobs(ids) {
    ids.forEach((id, i) => {
      const j = D().jobs.find((x) => x.id === id);
      if (j) j.sort_order = i;
    });
    await commit(null);
  },
};
