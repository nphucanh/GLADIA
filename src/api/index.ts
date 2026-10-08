// Điểm vào API cho WEBSITE (Supabase). Xem docs/API.md › "API theo từng trang".
//   import { listProjects, submitContact } from '../api';   — hoặc import thẳng file của trang: '../api/public/contact'
// API quản trị KHÔNG export ở đây: chỉ code trong src/admin/ được import '../api/admin', để mã quản trị không bị
// đóng gói vào website (scripts/check-boundaries.mjs kiểm tra khi build).
export * from './public';
export { ApiError, isSupabaseConfigured, type ApiErrorCode, type DataSource, type Page, type PageQuery, type Sourced } from './client';
export * from './validate';
export type * from './rows';
