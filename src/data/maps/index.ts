import type { RegionMap } from './types';

// Nền bản đồ thật theo tỉnh/thành — tải động (lazy) để mỗi trang chi tiết dự án chỉ tải vùng
// của chính nó, không làm nặng bundle chính.
export const REGION_LOADERS: Record<string, () => Promise<{ default: RegionMap }>> = {
  'TP.HCM': () => import('./hcm'),
  'Bình Dương': () => import('./binh-duong'),
  'Đồng Nai': () => import('./dong-nai'),
  'Long An': () => import('./long-an'),
  'Đà Nẵng': () => import('./da-nang'),
  'Hà Nội': () => import('./ha-noi'),
};
