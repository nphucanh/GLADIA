// API quản trị. Có cấu hình Supabase → gọi Supabase thật; chưa cấu hình → chế độ xem thử (demo.ts,
// dữ liệu mẫu trong bộ nhớ) để xem và thử được trang quản trị ngay.
import { isSupabaseConfigured } from '../client';
import * as auth from './auth';
import * as projects from './projects';
import * as floorPlans from './floorPlans';
import * as news from './news';
import * as jobs from './jobs';
import * as inbox from './inbox';
import * as media from './media';
import { demoAdmin } from './demo';

const live = { auth, projects, floorPlans, news, jobs, inbox, media };
export type AdminApi = typeof live;

/** true = trang quản trị đang chạy chế độ xem thử (dữ liệu không được lưu). */
export const isAdminDemo = !isSupabaseConfigured;
export const admin: AdminApi = isAdminDemo ? demoAdmin : live;

export type { ProjectInput, ProjectFilter, GalleryInput } from './projects';
export type { FloorPlanInput, FloorPlanScope, FloorPlanSetInput } from './floorPlans';
export type { NewsInput, NewsFilter } from './news';
export type { JobInput } from './jobs';
export type { ContactFilter, ApplicationFilter, InboxStats } from './inbox';
export type { MediaFolder, UploadedMedia } from './media';
