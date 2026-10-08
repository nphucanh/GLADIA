// Xem thử › Tài khoản của tôi.
import { ApiError } from '../../client';
import { DEMO_SELF_ID, demoAdmins } from '../../demoStore';
import { ensure } from '../../validate';
import type * as AccountApi from '../account';
import { validateProfile } from '../account';
import { currentDemoEmail } from './auth';
import { clone, commit, delay } from './shared';

const self = () => {
  const me = demoAdmins(currentDemoEmail()).find((a) => a.user_id === DEMO_SELF_ID);
  if (!me) throw new ApiError('Tài khoản này không có quyền quản trị.', 'unauthorized');
  return me;
};

export const accountApi: typeof AccountApi = {
  validateProfile,
  async getMyProfile() {
    return delay(clone(self()));
  },
  async updateMyProfile(p) {
    validateProfile(p);
    Object.assign(self(), {
      full_name: p.full_name.trim() || null,
      phone: p.phone.replace(/\s/g, '') || null,
      avatar_url: p.avatar_url || null,
    });
    await commit(null);
  },
  async changePassword(current, next) {
    ensure([
      [current.length > 0, 'Vui lòng nhập mật khẩu hiện tại.'],
      [next.length >= 8, 'Mật khẩu mới tối thiểu 8 ký tự.'],
      [next !== current, 'Mật khẩu mới phải khác mật khẩu hiện tại.'],
    ]);
    await delay(null); // xem thử: không có mật khẩu thật để đổi
  },
};
