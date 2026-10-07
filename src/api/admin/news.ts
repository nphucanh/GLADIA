// Quản trị tin tức. Chỉ admin.
import type { NewsCategory } from '../../data/mockNews';
import { db, pageRange, searchTerm, toPage, unwrap, type Page, type PageQuery } from '../client';
import { ensure } from '../validate';
import type { NewsRow } from '../rows';

const CATEGORIES: NewsCategory[] = ['du-an', 'cong-ty', 'thien-nguyen'];

export interface NewsInput {
  category: NewsCategory;
  title: string;
  content: string[]; // mỗi phần tử là một đoạn văn
  image_url?: string | null;
  published_at?: string; // yyyy-mm-dd; ngày trong tương lai = hẹn giờ đăng
  is_featured?: boolean;
  is_published?: boolean;
}

export function validateNews(n: Partial<NewsInput>, creating: boolean) {
  ensure([
    [(!creating && n.category === undefined) || CATEGORIES.includes(n.category as NewsCategory), 'Chuyên mục không hợp lệ.'],
    [(!creating && n.title === undefined) || (n.title ?? '').trim().length >= 5, 'Tiêu đề tối thiểu 5 ký tự.'],
    [n.content === undefined || n.content.some((p) => p.trim().length > 0), 'Bài viết cần ít nhất một đoạn nội dung.'],
    [n.published_at === undefined || /^\d{4}-\d{2}-\d{2}$/.test(n.published_at), 'Ngày đăng phải có dạng yyyy-mm-dd.'],
  ]);
}

/** Bỏ đoạn trống, cắt khoảng trắng. */
export const tidyNews = (n: Partial<NewsInput>) =>
  n.content ? { ...n, content: n.content.map((p) => p.trim()).filter(Boolean) } : n;

export interface NewsFilter extends PageQuery {
  search?: string;
  category?: NewsCategory;
  published?: boolean;
}

/** Danh sách bài (kể cả nháp / hẹn giờ), mới nhất trước. */
export async function listNews(f: NewsFilter = {}): Promise<Page<NewsRow>> {
  const { page, pageSize, from, to } = pageRange(f);
  let q = db()
    .from('news')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to);
  const s = searchTerm(f.search);
  if (s) q = q.ilike('title', s);
  if (f.category) q = q.eq('category', f.category);
  if (f.published !== undefined) q = q.eq('is_published', f.published);
  const res = await q;
  return toPage(unwrap<NewsRow[]>(res), res.count, page, pageSize);
}

export async function getNews(id: number): Promise<NewsRow> {
  return unwrap<NewsRow>(await db().from('news').select('*').eq('id', id).single());
}

export async function createNews(input: NewsInput): Promise<NewsRow> {
  validateNews(input, true);
  return unwrap<NewsRow>(await db().from('news').insert(tidyNews(input)).select().single());
}

export async function updateNews(id: number, patch: Partial<NewsInput>): Promise<NewsRow> {
  validateNews(patch, false);
  return unwrap<NewsRow>(await db().from('news').update(tidyNews(patch)).eq('id', id).select().single());
}

export async function deleteNews(id: number) {
  unwrap(await db().from('news').delete().eq('id', id));
}
