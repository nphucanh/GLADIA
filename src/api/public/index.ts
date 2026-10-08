// API công khai cho các trang của website (không cần đăng nhập) — chia theo trang. Xem docs/API.md › "API theo từng trang".
//   projects.ts  Trang chủ, Dự án, Chi tiết dự án, Liên hệ
//   news.ts      Trang chủ, Tin tức, Chi tiết tin
//   careers.ts   Tuyển dụng
//   contact.ts   Liên hệ
//   tracking.ts  Chi tiết dự án, Chi tiết tin (đếm lượt xem)
export * from './projects';
export * from './news';
export * from './careers';
export * from './contact';
export * from './tracking';
export type { SubmitResult } from './shared';
export { ApiError } from '../client';
