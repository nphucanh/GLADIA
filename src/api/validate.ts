import { ApiError } from './client';

// Quy tắc kiểm tra dùng chung cho form (Contact, Careers) và API — khớp ràng buộc CHECK trong supabase/schema.sql.

export const isValidName = (v: string) => v.trim().length >= 2 && v.trim().length <= 120;
export const isValidPhone = (v: string) => /^[0-9]{9,11}$/.test(v.replace(/\s/g, ''));
export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) && v.trim().length <= 200;
export const isValidUrl = (v: string) => /^https?:\/\/\S+$/i.test(v.trim()) && v.trim().length <= 500;

export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const CV_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;
export const MEDIA_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/** Ném ApiError 'validation' với thông báo đầu tiên không thoả. */
export function ensure(checks: [boolean, string][]) {
  const failed = checks.find(([ok]) => !ok);
  if (failed) throw new ApiError(failed[1], 'validation');
}

/** Bỏ khoảng trắng; chuỗi rỗng → null. */
export const clean = (v?: string | null) => {
  const s = (v ?? '').trim();
  return s ? s : null;
};

/** Tên file an toàn cho đường dẫn kho file: bỏ dấu tiếng Việt, chỉ giữ [A-Za-z0-9._-]. */
export function safeFileName(name: string) {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return (base || 'file').slice(-80);
}

export function uniqueName(name: string) {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${id}-${safeFileName(name)}`;
}
