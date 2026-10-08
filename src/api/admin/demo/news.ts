// Xem thử › Tin tức.
import type { NewsCategory } from '../../../data/mockNews';
import type { NewsRow } from '../../rows';
import type * as NewsApi from '../news';
import { tidyNews, validateNews, type NewsFilter } from '../news';
import { clone, commit, D, delay, find, like, nextId, now, paginate } from './shared';

export const newsApi: typeof NewsApi = {
  validateNews,
  tidyNews,
  async listNews(f: NewsFilter = {}) {
    const rows = D().news
      .filter((n) => like(f.search, n.title))
      .filter((n) => !f.category || n.category === f.category)
      .filter((n) => f.published === undefined || n.is_published === f.published)
      .sort((a, b) => b.published_at.localeCompare(a.published_at) || b.id - a.id);
    return delay(paginate(rows, f));
  },
  async getNews(id) {
    return delay(clone(find(D().news, id, 'bài viết')));
  },
  async createNews(input) {
    validateNews(input, true);
    const t = tidyNews(input);
    const row: NewsRow = {
      image_url: null,
      published_at: now().slice(0, 10),
      is_featured: false,
      is_published: true,
      ...t,
      category: t.category as NewsCategory,
      title: (t.title ?? '').trim(),
      content: t.content ?? [],
      id: nextId(),
      created_at: now(),
      updated_at: now(),
    };
    D().news.push(row);
    return commit(clone(row));
  },
  async updateNews(id, patch) {
    validateNews(patch, false);
    const n = find(D().news, id, 'bài viết');
    Object.assign(n, tidyNews(patch), { updated_at: now() });
    return commit(clone(n));
  },
  async deleteNews(id) {
    find(D().news, id, 'bài viết');
    D().news.splice(D().news.findIndex((n) => n.id === id), 1);
    await commit(null);
  },
};
