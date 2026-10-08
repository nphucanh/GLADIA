// Tiện ích dùng chung cho API công khai.
import type { NewsItem } from '../../data/mockNews';
import { isSupabaseConfigured } from '../client';

/** Chưa cấu hình Supabase → chế độ xem thử: đọc / ghi kho xem thử dùng chung với trang quản trị (demoStore.ts). */
export const isDemo = !isSupabaseConfigured;

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const byOrder = <T extends { sort_order: number; id: number }>(a: T, b: T) => a.sort_order - b.sort_order || a.id - b.id;
export const byDateDesc = (a: NewsItem, b: NewsItem) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id);

export interface SubmitResult {
  stored: boolean; // false = chưa cấu hình Supabase (bản demo) — dữ liệu không được lưu
}
