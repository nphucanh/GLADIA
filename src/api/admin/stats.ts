// Thống kê lượt quan tâm: lượt xem từng dự án / bài viết (ghi bởi track_view khi khách mở trang chi tiết)
// + yêu cầu tư vấn theo dự án. Đọc qua các hàm admin_*_stats trong supabase/schema.sql (mục 10). Chỉ admin.
import type { BuildingType } from '../../types';
import { db, unwrap } from '../client';

export type StatsKind = 'project' | 'news';

/** Số liệu một ngày (ngày theo giờ Việt Nam, dạng YYYY-MM-DD). */
export interface DailyStat {
  day: string;
  projectViews: number;
  newsViews: number;
  leads: number; // yêu cầu tư vấn (không tính spam)
  applications: number; // hồ sơ ứng tuyển
}

/** Số liệu của MỘT dự án / bài viết. "Kỳ này" = `days` ngày gần nhất, "kỳ trước" = `days` ngày liền trước đó. */
export interface ItemStat {
  kind: StatsKind;
  id: number;
  title: string;
  imageUrl: string | null;
  label: string; // dự án: tỉnh / thành (không hiển thị) · bài viết: mã chuyên mục
  buildingType: BuildingType | null;
  isPublished: boolean;
  views: number;
  prevViews: number;
  totalViews: number; // từ trước tới nay
  leads: number; // chỉ dự án
  prevLeads: number;
  totalLeads: number;
}

export interface InterestStats {
  days: number;
  /** 2 × days ngày, cũ → mới: nửa đầu là kỳ trước, nửa sau là kỳ này. */
  daily: DailyStat[];
  projects: ItemStat[];
  news: ItemStat[];
}

export interface ItemDaily {
  day: string;
  views: number;
  leads: number;
}

const n = (v: unknown) => Number(v ?? 0) || 0;
const day = (v: unknown) => String(v).slice(0, 10);

interface ItemStatRow {
  kind: StatsKind;
  item_id: number;
  title: string;
  image_url: string | null;
  label: string | null;
  building_type: BuildingType | null;
  is_published: boolean;
  views: number;
  prev_views: number;
  total_views: number;
  leads: number;
  prev_leads: number;
  total_leads: number;
}

function toItemStat(r: ItemStatRow): ItemStat {
  return {
    kind: r.kind,
    id: n(r.item_id),
    title: r.title,
    imageUrl: r.image_url,
    label: r.label ?? '',
    buildingType: r.building_type,
    isPublished: r.is_published,
    views: n(r.views),
    prevViews: n(r.prev_views),
    totalViews: n(r.total_views),
    leads: n(r.leads),
    prevLeads: n(r.prev_leads),
    totalLeads: n(r.total_leads),
  };
}

/** Toàn bộ số liệu cho Tổng quan và trang Thống kê. */
export async function getInterestStats(days = 30): Promise<InterestStats> {
  const [daily, items] = await Promise.all([
    db().rpc('admin_daily_stats', { p_days: days }),
    db().rpc('admin_item_stats', { p_days: days }),
  ]);
  const rows = unwrap<ItemStatRow[]>(items).map(toItemStat);
  return {
    days,
    daily: unwrap<Record<string, unknown>[]>(daily).map((r) => ({
      day: day(r.day),
      projectViews: n(r.project_views),
      newsViews: n(r.news_views),
      leads: n(r.leads),
      applications: n(r.applications),
    })),
    projects: rows.filter((r) => r.kind === 'project'),
    news: rows.filter((r) => r.kind === 'news'),
  };
}

/** Lượt xem từng ngày của một dự án / bài viết (`days` ngày gần nhất, cũ → mới). */
export async function getItemDaily(kind: StatsKind, id: number, days = 30): Promise<ItemDaily[]> {
  const res = await db().rpc('admin_item_daily', { p_kind: kind, p_id: id, p_days: days });
  return unwrap<Record<string, unknown>[]>(res).map((r) => ({ day: day(r.day), views: n(r.views), leads: n(r.leads) }));
}
