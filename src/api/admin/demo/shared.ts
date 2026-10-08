// Tiện ích dùng chung cho chế độ xem thử của trang quản trị.
import type { Page } from '../../client';
import { ApiError, pageRange, toPage } from '../../client';
import { demoDb, nextDemoId, nowIso, saveDemoDb } from '../../demoStore';

// ---------- Kho dữ liệu (dùng chung với website) ----------

export const D = demoDb;
export const now = nowIso;
export const nextId = nextDemoId;
export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
export const delay = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120)); // giả lập độ trễ mạng
/** Lưu kho rồi trả kết quả — dùng cho mọi thao tác ghi. */
export const commit = <T>(v: T) => {
  saveDemoDb();
  return delay(v);
};

// ---------- Tiện ích truy vấn ----------

export const like = (q: string | undefined, ...fields: (string | null)[]) => {
  const s = (q ?? '').trim().toLowerCase();
  return !s || fields.some((f) => (f ?? '').toLowerCase().includes(s));
};

export function paginate<T>(rows: T[], f: { page?: number; pageSize?: number }): Page<T> {
  const { page, pageSize, from, to } = pageRange(f);
  return toPage(clone(rows.slice(from, to + 1)), rows.length, page, pageSize);
}

export function find<T extends { id: number }>(rows: T[], id: number, what: string): T {
  const r = rows.find((x) => x.id === id);
  if (!r) throw new ApiError(`Không tìm thấy ${what}.`, 'not_found');
  return r;
}

export const byOrder = <T extends { sort_order: number; id: number }>(a: T, b: T) => a.sort_order - b.sort_order || a.id - b.id;
