// Điểm vào của lớp API (Supabase). Xem docs/API.md.
//   import { listProjects, submitContact } from '../api';      — API công khai cho các trang
//   import { admin } from '../api'; admin.news.createNews(...)  — API quản trị (cần đăng nhập admin)
export * from './public';
export { ApiError, isSupabaseConfigured, type ApiErrorCode, type DataSource, type Page, type PageQuery, type Sourced } from './client';
export * from './validate';
export type * from './rows';
export { admin, isAdminDemo } from './admin';
