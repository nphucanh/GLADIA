// API quản trị — chia theo trang quản trị (xem docs/API.md › "API theo từng trang"). Chỉ code trong src/admin/ được import.
// Có cấu hình Supabase → gọi Supabase thật; chưa cấu hình → chế độ xem thử (thư mục demo/, cùng tên file).
import { isSupabaseConfigured } from '../client';
import * as auth from './auth';
import * as projects from './projects';
import * as floorPlans from './floorPlans';
import * as news from './news';
import * as jobs from './jobs';
import * as contacts from './contacts';
import * as applications from './applications';
import * as inbox from './inbox';
import * as media from './media';
import * as stats from './stats';
import * as account from './account';
import * as users from './users';
import { demoAdmin } from './demo';

const live = { auth, projects, floorPlans, news, jobs, contacts, applications, inbox, media, stats, account, users };
export type AdminApi = typeof live;

/** true = trang quản trị đang chạy chế độ xem thử (dữ liệu không được lưu). */
export const isAdminDemo = !isSupabaseConfigured;
export const admin: AdminApi = isAdminDemo ? demoAdmin : live;

export type { ProjectInput, ProjectFilter, GalleryInput } from './projects';
export type { FloorPlanInput, FloorPlanScope, FloorPlanSetInput } from './floorPlans';
export type { NewsInput, NewsFilter } from './news';
export type { JobInput } from './jobs';
export type { ContactFilter } from './contacts';
export type { ApplicationFilter } from './applications';
export type { InboxStats } from './inbox';
export type { MediaFolder, UploadedMedia } from './media';
export type { DailyStat, InterestStats, ItemDaily, ItemStat, StatsKind } from './stats';
export type { ProfileInput } from './account';
export type { NewAdminInput } from './users';
