// Chế độ xem thử của trang quản trị — dùng khi CHƯA cấu hình Supabase (.env).
// Cài đặt đúng giao diện của API quản trị thật (cùng tên hàm, tham số, kiểu trả về, cùng quy tắc kiểm tra),
// mỗi file ứng với một file API thật cùng tên ở thư mục cha. Dữ liệu nằm trong kho xem thử dùng chung với website
// (demoStore.ts, lưu trong localStorage của trình duyệt).
import { auth } from './auth';
import { projectsApi } from './projects';
import { floorPlansApi } from './floorPlans';
import { newsApi } from './news';
import { jobsApi } from './jobs';
import { contactsApi } from './contacts';
import { applicationsApi } from './applications';
import { inboxApi } from './inbox';
import { mediaApi } from './media';
import { statsApi } from './stats';
import { accountApi } from './account';
import { usersApi } from './users';

export const demoAdmin = {
  auth,
  projects: projectsApi,
  floorPlans: floorPlansApi,
  news: newsApi,
  jobs: jobsApi,
  contacts: contactsApi,
  applications: applicationsApi,
  inbox: inboxApi,
  media: mediaApi,
  stats: statsApi,
  account: accountApi,
  users: usersApi,
};
