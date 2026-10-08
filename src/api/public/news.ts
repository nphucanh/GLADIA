// Tin tức — dùng ở: Trang chủ, Tin tức, Chi tiết tin.
// Bảng: news. Chỉ bài đã đăng và đã tới ngày đăng (giống RLS trên database).
import type { NewsCategory, NewsItem } from '../../data/mockNews';
import { mockNews } from '../../data/mockNews';
import { readOrMock, unwrap, type Sourced } from '../client';
import { toNewsItem, type NewsRow } from '../rows';
import { demoDb } from '../demoStore';
import { byDateDesc, isDemo, todayIso } from './shared';

// ---------- Dữ liệu dự phòng ----------

export function fallbackNews(): NewsItem[] {
  if (!isDemo) return [...mockNews].sort(byDateDesc);
  const today = todayIso();
  return demoDb()
    .news.filter((n) => n.is_published && n.published_at <= today)
    .map(toNewsItem)
    .sort(byDateDesc);
}

// ---------- API ----------

/** Bài viết đã đăng, mới nhất trước; lọc theo chuyên mục nếu có. */
export function listNews(category?: NewsCategory): Promise<Sourced<NewsItem[]>> {
  return readOrMock(
    'tin tức',
    async (c) => {
      let q = c.from('news').select('*').order('published_at', { ascending: false }).order('id', { ascending: false });
      if (category) q = q.eq('category', category);
      return unwrap<NewsRow[]>(await q).map(toNewsItem);
    },
    () => fallbackNews().filter((n) => !category || n.category === category),
  );
}

/** Một bài viết theo id; null nếu không có / chưa đăng. */
export function getNews(id: number): Promise<Sourced<NewsItem | null>> {
  return readOrMock(
    `bài viết #${id}`,
    async (c) => {
      const row = unwrap<NewsRow | null>(await c.from('news').select('*').eq('id', id).maybeSingle());
      return row ? toNewsItem(row) : null;
    },
    () => fallbackNews().find((n) => n.id === id) ?? null,
  );
}
