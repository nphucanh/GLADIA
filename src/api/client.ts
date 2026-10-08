import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export { isSupabaseConfigured };

export type ApiErrorCode =
  | 'not_configured' // chưa điền VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
  | 'validation' // dữ liệu gửi lên không hợp lệ (kiểm tra ở trình duyệt hoặc ràng buộc CHECK của database)
  | 'unauthorized' // chưa đăng nhập / không phải admin / bị RLS chặn
  | 'not_found'
  | 'network'
  | 'unknown';

/** Lỗi thống nhất cho mọi hàm API — `message` là tiếng Việt, hiển thị được cho người dùng. */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: ApiErrorCode = 'unknown',
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Client Supabase, hoặc ném ApiError 'not_configured'. */
export function db(): SupabaseClient {
  if (!supabase) throw new ApiError('Hệ thống chưa được kết nối cơ sở dữ liệu.', 'not_configured');
  return supabase;
}

/** Đổi lỗi PostgREST / Storage sang ApiError với thông báo dễ hiểu. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  const e = err as Partial<PostgrestError> & { message?: string; statusCode?: string | number };
  const msg = e?.message ?? String(err);
  // Mã lỗi Postgres: 23514 check_violation, 23505 unique_violation, 23503 foreign_key_violation, 42501 RLS
  if (e?.code === '23514' || e?.code === '22P02') return new ApiError('Dữ liệu không hợp lệ, vui lòng kiểm tra lại.', 'validation', err);
  if (e?.code === '23505') return new ApiError('Dữ liệu bị trùng (mã / đường dẫn đã tồn tại).', 'validation', err);
  if (e?.code === '23503') return new ApiError('Dữ liệu liên quan không tồn tại hoặc đang được sử dụng.', 'validation', err);
  if (e?.code === '42501' || e?.code === 'PGRST301' || /row-level security|jwt|not authorized|unauthorized/i.test(msg))
    return new ApiError('Bạn không có quyền thực hiện thao tác này.', 'unauthorized', err);
  if (e?.code === 'PGRST116') return new ApiError('Không tìm thấy dữ liệu.', 'not_found', err);
  // PGRST202 / 42883: chưa có hàm · PGRST205 / 42P01: chưa có bảng · 42703 / PGRST204: chưa có cột → database chưa chạy bản SQL mới nhất
  if (e?.code === 'PGRST202' || e?.code === 'PGRST205' || e?.code === '42883' || e?.code === '42P01' || e?.code === '42703' || e?.code === 'PGRST204')
    return new ApiError('Cơ sở dữ liệu chưa được cập nhật bản mới (thiếu bảng hoặc hàm). Hãy chạy file SQL mới trong thư mục supabase/ ở Supabase › SQL Editor.', 'not_configured', err);
  if (/failed to fetch|network|timeout/i.test(msg)) return new ApiError('Không kết nối được máy chủ, vui lòng thử lại.', 'network', err);
  return new ApiError(msg || 'Đã có lỗi xảy ra, vui lòng thử lại.', 'unknown', err);
}

/** Lấy `data` từ kết quả Supabase, ném ApiError nếu có lỗi. */
export function unwrap<T>(res: { data: unknown; error: unknown }): T {
  if (res.error) throw toApiError(res.error);
  return res.data as T;
}

/**
 * Xoá 1 dòng theo id. RLS chặn thì Supabase không báo lỗi mà chỉ xoá 0 dòng → kiểm tra số dòng đã xoá, để giao diện
 * không báo "Đã xoá" khi thực ra chưa xoá gì.
 */
export async function deleteById(table: string, id: number, what: string) {
  const deleted = unwrap<{ id: number }[]>(await db().from(table).delete().eq('id', id).select('id'));
  if (deleted.length === 0)
    throw new ApiError(`Không xoá được ${what}: tài khoản không có quyền quản trị hoặc ${what} không còn tồn tại.`, 'unauthorized');
}

export type DataSource = 'supabase' | 'mock';

export interface Sourced<T> {
  data: T;
  source: DataSource; // 'mock' = đang dùng dữ liệu mẫu (chưa cấu hình Supabase hoặc lỗi khi tải)
}

/**
 * Đọc dữ liệu công khai; chưa cấu hình Supabase hoặc lỗi (vd. chưa chạy schema.sql) → dữ liệu mẫu,
 * để giao diện luôn hiển thị được.
 */
export async function readOrMock<T>(label: string, read: (client: SupabaseClient) => Promise<T>, mock: () => T): Promise<Sourced<T>> {
  if (!supabase || unreachable) return { data: mock(), source: 'mock' };
  let timer: ReturnType<typeof setTimeout> | undefined;
  // supabase-js tự thử lại nhiều lần khi lỗi mạng → giới hạn thời gian chờ để trang không trống quá lâu
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ApiError('Hết thời gian chờ máy chủ.', 'network', TIMEOUT)), READ_TIMEOUT_MS);
  });
  try {
    return { data: await Promise.race([read(supabase), timeout]), source: 'supabase' };
  } catch (err) {
    console.warn(`[api] Không tải được ${label} từ Supabase, dùng dữ liệu mẫu:`, err);
    // Mất mạng hẳn (không gửi được yêu cầu) → các lần đọc sau trong phiên dùng dữ liệu mẫu ngay, không chờ lại.
    // Chỉ chậm (hết thời gian chờ, vd. database vừa khởi động) → lần sau vẫn thử lại Supabase.
    const e = toApiError(err);
    if (e.code === 'network' && e.details !== TIMEOUT) unreachable = true;
    return { data: mock(), source: 'mock' };
  } finally {
    clearTimeout(timer);
  }
}

const READ_TIMEOUT_MS = 8000;
const TIMEOUT = Symbol('timeout');
let unreachable = false;

// ---------- Phân trang ----------

export interface PageQuery {
  page?: number; // bắt đầu từ 1
  pageSize?: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Khoảng bản ghi [from, to] cho .range() của Supabase. */
export function pageRange({ page = 1, pageSize = 20 }: PageQuery) {
  const p = Math.max(1, Math.floor(page));
  const size = Math.min(100, Math.max(1, Math.floor(pageSize)));
  return { page: p, pageSize: size, from: (p - 1) * size, to: p * size - 1 };
}

export function toPage<T>(items: T[], total: number | null, page: number, pageSize: number): Page<T> {
  const t = total ?? items.length;
  return { items, total: t, page, pageSize, totalPages: Math.max(1, Math.ceil(t / pageSize)) };
}

/** Chuỗi tìm kiếm an toàn cho bộ lọc .or()/.ilike() của PostgREST (bỏ ký tự cú pháp). */
export function searchTerm(q?: string) {
  const s = (q ?? '').replace(/[%_,()*\\]/g, ' ').trim();
  return s ? `%${s}%` : null;
}
