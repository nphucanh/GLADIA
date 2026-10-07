import { useEffect, useState } from 'react';
import { isSupabaseConfigured, type DataSource, type Sourced } from '../api/client';
import {
  fallbackFloorPlanSet,
  fallbackJobs,
  fallbackNews,
  fallbackProjects,
  getFloorPlanSet,
  listJobs,
  listNews,
  listProjects,
} from '../api/public';
import type { FloorPlanSet } from '../data/projectDetails';
import type { NewsItem } from '../data/mockNews';
import type { Job, Project } from '../types';

export interface ApiState<T> {
  data: T;
  loading: boolean;
  source: DataSource; // 'mock' = dữ liệu mẫu / chế độ xem thử
}

/**
 * Dữ liệu đọc dùng chung toàn web (vd. tin tức ở Trang chủ, Tin tức, Chi tiết tin):
 * - hiện ngay bản đã tải gần nhất (không nháy trang trống khi chuyển trang),
 * - đồng thời tải lại mỗi khi component dùng nó được mở / `refreshKey` đổi → nội dung vừa sửa ở trang quản trị
 *   hiện ra khi khách chuyển trang, không cần tải lại cả web,
 * - chưa cấu hình Supabase → đọc ngay kho xem thử (không chờ).
 */
function sharedResource<T>(load: () => Promise<Sourced<T>>, fallback: () => T, empty: T) {
  let cache: Sourced<T> | null = null;
  let pending: Promise<Sourced<T>> | null = null;
  const refresh = () =>
    (pending ??= load()
      .then((r) => (cache = r))
      .finally(() => {
        pending = null;
      }));

  return function useResource(refreshKey?: unknown): ApiState<T> {
    const [state, setState] = useState<Sourced<T> | null>(() => {
      if (!cache && !isSupabaseConfigured) cache = { data: fallback(), source: 'mock' };
      return cache;
    });
    useEffect(() => {
      let alive = true;
      if (!isSupabaseConfigured) {
        // Kho xem thử đọc đồng bộ — lấy bản mới nhất (có thể vừa được sửa ở trang quản trị / tab khác)
        cache = { data: fallback(), source: 'mock' };
        setState(cache);
      } else refresh().then((r) => alive && setState(r));
      return () => {
        alive = false;
      };
    }, [refreshKey]);
    return state ? { ...state, loading: false } : { data: empty, loading: true, source: 'supabase' };
  };
}

/** Tất cả dự án đã xuất bản. */
export const useProjectList = sharedResource<Project[]>(listProjects, fallbackProjects, []);
/** Tất cả tin đã đăng, mới nhất trước. */
export const useNewsList = sharedResource<NewsItem[]>(() => listNews(), fallbackNews, []);
/** Các vị trí đang tuyển. */
export const useJobs = sharedResource<Job[]>(listJobs, fallbackJobs, []);

/** Bộ mặt bằng của dự án (null khi đang tải từ Supabase). */
export function useFloorPlanSet(project: Project | undefined): FloorPlanSet | null {
  const [set, setSet] = useState<FloorPlanSet | null>(() =>
    project && !isSupabaseConfigured ? fallbackFloorPlanSet(project) : null,
  );
  useEffect(() => {
    if (!project) return;
    if (!isSupabaseConfigured) {
      setSet(fallbackFloorPlanSet(project));
      return;
    }
    let alive = true;
    setSet(null);
    getFloorPlanSet(project).then((r) => alive && setSet(r.data));
    return () => {
      alive = false;
    };
  }, [project]);
  return set;
}
