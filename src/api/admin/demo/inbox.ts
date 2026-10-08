// Xem thử › số liệu hộp thư (Tổng quan, thanh bên).
import type * as InboxApi from '../inbox';
import { D, delay } from './shared';

export const inboxApi: typeof InboxApi = {
  async getInboxStats() {
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    return delay({
      newContacts: D().contacts.filter((c) => c.status === 'new').length,
      newApplications: D().applications.filter((a) => a.status === 'new').length,
      contactsLast7Days: D().contacts.filter((c) => c.created_at >= since).length,
      applicationsLast7Days: D().applications.filter((a) => a.created_at >= since).length,
    });
  },
};
