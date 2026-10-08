// Xem thử › Tổng quan, Thống kê: lượt xem mẫu (demoStore) + yêu cầu tư vấn / hồ sơ trong kho xem thử.
import { demoViewsOn, shiftDay, vnDay } from '../../demoStore';
import type * as StatsApi from '../stats';
import { D, delay } from './shared';

/** Ngày (giờ Việt Nam) của một mốc thời gian ISO. */
const vnDayOf = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
const clampDays = (days: number) => Math.min(366, Math.max(1, Math.floor(days) || 1));

function demoLeads() {
  return D().contacts.filter((c) => c.status !== 'spam').map((c) => ({ day: vnDayOf(c.created_at), project: c.project_interest }));
}

export const statsApi: typeof StatsApi = {
  async getInterestStats(days = 30) {
    days = clampDays(days);
    const today = vnDay();
    const cur = shiftDay(today, -(days - 1));
    const prev = shiftDay(today, -(2 * days - 1));
    const leads = demoLeads();
    const apps = D().applications.map((a) => vnDayOf(a.created_at));
    const span = Array.from({ length: 2 * days }, (_, i) => shiftDay(prev, i));

    const daily = span.map((day) => ({
      day,
      projectViews: D().projects.reduce((s, p) => s + demoViewsOn('project', p.id, day), 0),
      newsViews: D().news.reduce((s, n) => s + demoViewsOn('news', n.id, day), 0),
      leads: leads.filter((l) => l.day === day).length,
      applications: apps.filter((d) => d === day).length,
    }));

    const sum = (kind: StatsApi.StatsKind, id: number, from: string, to: string) => {
      let total = 0;
      for (let d = from; d <= to; d = shiftDay(d, 1)) total += demoViewsOn(kind, id, d);
      return total;
    };
    const allTime = (kind: StatsApi.StatsKind, id: number) => sum(kind, id, shiftDay(today, -400), today);
    const inRange = (day: string, from: string, to: string) => day >= from && day <= to;
    const prevEnd = shiftDay(cur, -1);

    const projects = D().projects.map<StatsApi.ItemStat>((p) => {
      const mine = leads.filter((l) => l.project === p.name);
      return {
        kind: 'project',
        id: p.id,
        title: p.name,
        imageUrl: p.cover_image_url,
        label: p.location,
        buildingType: p.building_type,
        isPublished: p.is_published,
        views: sum('project', p.id, cur, today),
        prevViews: sum('project', p.id, prev, prevEnd),
        totalViews: allTime('project', p.id),
        leads: mine.filter((l) => inRange(l.day, cur, today)).length,
        prevLeads: mine.filter((l) => inRange(l.day, prev, prevEnd)).length,
        totalLeads: mine.length,
      };
    });
    const news = D().news.map<StatsApi.ItemStat>((n) => ({
      kind: 'news',
      id: n.id,
      title: n.title,
      imageUrl: n.image_url,
      label: n.category,
      buildingType: null,
      isPublished: n.is_published && n.published_at <= today,
      views: sum('news', n.id, cur, today),
      prevViews: sum('news', n.id, prev, prevEnd),
      totalViews: allTime('news', n.id),
      leads: 0,
      prevLeads: 0,
      totalLeads: 0,
    }));
    return delay({ days, daily, projects, news });
  },
  async getItemDaily(kind, id, days = 30) {
    days = clampDays(days);
    const start = vnDay(-(days - 1));
    const name = kind === 'project' ? D().projects.find((p) => p.id === id)?.name : undefined;
    const leads = name ? demoLeads().filter((l) => l.project === name) : [];
    return delay(
      Array.from({ length: days }, (_, i) => {
        const day = shiftDay(start, i);
        return { day, views: demoViewsOn(kind, id, day), leads: leads.filter((l) => l.day === day).length };
      }),
    );
  },
};
