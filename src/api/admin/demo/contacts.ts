// Xem thử › Yêu cầu tư vấn.
import type * as ContactsApi from '../contacts';
import { clone, commit, D, delay, find, like, now, paginate } from './shared';

export const contactsApi: typeof ContactsApi = {
  async listContactSubmissions(f = {}) {
    const rows = D().contacts
      .filter((c) => like(f.search, c.full_name, c.phone, c.email))
      .filter((c) => !f.status || c.status === f.status)
      .filter((c) => !f.project || c.project_interest === f.project)
      .filter((c) => !f.from || c.created_at >= f.from)
      .filter((c) => !f.to || c.created_at.slice(0, 10) <= f.to.slice(0, 10))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return delay(paginate(rows, f));
  },
  async updateContactSubmission(id, patch) {
    const c = find(D().contacts, id, 'yêu cầu');
    Object.assign(c, patch, { updated_at: now() });
    if (patch.status === 'done') c.handled_at = now();
    else if (patch.status) c.handled_at = null;
    return commit(clone(c));
  },
  async deleteContactSubmission(id) {
    find(D().contacts, id, 'yêu cầu');
    D().contacts.splice(D().contacts.findIndex((c) => c.id === id), 1);
    await commit(null);
  },
};
