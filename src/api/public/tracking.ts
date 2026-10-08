// Thống kê lượt xem — dùng ở: Chi tiết dự án, Chi tiết tin. Số liệu hiện ở trang quản trị › Thống kê.
// Hàm database: track_view (ghi vào bảng content_views).
import { db } from '../client';
import { addDemoView, vnDay } from '../demoStore';
import { isDemo } from './shared';

const VIEWED_KEY = 'terra-viewed';

/**
 * Ghi nhận 1 lượt xem trang chi tiết dự án / bài viết (cho trang Thống kê của quản trị).
 * Mỗi trình duyệt chỉ tính 1 lượt / mục / ngày, để tải lại trang không làm tăng số. Không bao giờ báo lỗi ra giao diện.
 */
export function trackView(kind: 'project' | 'news', id: number) {
  if (!Number.isFinite(id) || id <= 0) return;
  const key = `${kind}:${id}`;
  const today = vnDay();
  let seen: Record<string, string> = {};
  try {
    seen = JSON.parse(localStorage.getItem(VIEWED_KEY) ?? '{}') ?? {};
    if (seen[key] === today) return;
    for (const k of Object.keys(seen)) if (seen[k] !== today) delete seen[k];
    seen[key] = today;
    localStorage.setItem(VIEWED_KEY, JSON.stringify(seen));
  } catch {
    /* trình duyệt chặn lưu trữ → vẫn ghi nhận */
  }
  if (isDemo) {
    try {
      addDemoView(kind, id);
    } catch {
      /* bỏ qua */
    }
    return;
  }
  void Promise.resolve(db().rpc('track_view', { p_kind: kind, p_id: id })).catch(() => undefined);
}
