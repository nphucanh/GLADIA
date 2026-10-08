// Xem thử › Người quản trị: cùng quy tắc với các hàm admin_*_user trên database
// (không tự đổi chính mình, luôn còn ít nhất 1 owner đang hoạt động).
import { ApiError } from '../../client';
import { DEMO_SELF_ID, demoAdmins, nowIso } from '../../demoStore';
import type * as UsersApi from '../users';
import { validateNewAdmin } from '../users';
import { currentDemoEmail } from './auth';
import { clone, commit, delay } from './shared';

const list = () => demoAdmins(currentDemoEmail());

function guard(userId: string) {
  if (userId === DEMO_SELF_ID) throw new ApiError('Không thể tự đổi vai trò, khoá hay gỡ quyền của chính mình.', 'validation');
  const u = list().find((a) => a.user_id === userId);
  if (!u) throw new ApiError('Không tìm thấy tài khoản.', 'not_found');
  return u;
}

const hasOwner = () => list().some((a) => a.role === 'owner' && a.is_active);

export const usersApi: typeof UsersApi = {
  validateNewAdmin,
  async canCreateAccounts() {
    return true; // xem thử: luôn "tạo" được (không có tài khoản đăng nhập thật)
  },
  async listUsers() {
    return delay(clone([...list()].sort((a, b) => Number(b.role === 'owner') - Number(a.role === 'owner') || a.created_at.localeCompare(b.created_at))));
  },
  async addUser(u) {
    validateNewAdmin(u);
    const email = u.email.trim().toLowerCase();
    const existing = list().find((a) => a.email.toLowerCase() === email);
    if (existing) {
      if (u.password !== undefined) throw new ApiError('Email này đã có tài khoản — dùng "Cấp quyền cho tài khoản có sẵn".', 'validation');
      Object.assign(existing, { role: u.role, is_active: true, full_name: u.full_name.trim() || existing.full_name });
    } else {
      // Xem thử không có danh sách tài khoản đăng nhập thật: "cấp quyền" cũng tạo luôn người mới
      list().push({
        user_id: `demo-${Date.now()}`,
        email,
        full_name: u.full_name.trim() || null,
        phone: null,
        avatar_url: null,
        role: u.role,
        is_active: true,
        created_at: nowIso(),
        last_sign_in_at: null,
      });
    }
    await commit(null);
  },
  async setUser(userId, patch) {
    const u = guard(userId);
    const before = { role: u.role, is_active: u.is_active };
    Object.assign(u, patch);
    if (!hasOwner()) {
      Object.assign(u, before);
      throw new ApiError('Phải luôn còn ít nhất một chủ sở hữu (owner) đang hoạt động.', 'validation');
    }
    await commit(null);
  },
  async revokeUser(userId) {
    guard(userId);
    const all = list();
    const i = all.findIndex((a) => a.user_id === userId);
    const [removed] = all.splice(i, 1);
    if (!hasOwner()) {
      all.splice(i, 0, removed);
      throw new ApiError('Phải luôn còn ít nhất một chủ sở hữu (owner) đang hoạt động.', 'validation');
    }
    await commit(null);
  },
};
