import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** true chỉ khi cả 2 biến môi trường đã được điền hợp lệ */
export const isSupabaseConfigured = Boolean(
  url && anonKey && url.startsWith('http') && anonKey.length > 20,
);

/**
 * null khi chưa cấu hình Supabase — toàn bộ app sẽ tự rơi về dữ liệu mẫu (mockProjects)
 * và các form sẽ báo rõ cho người dùng thay vì gọi API lỗi.
 */
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
