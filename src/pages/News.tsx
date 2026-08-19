import { useMemo, useState } from 'react';
import NewsCard from '../components/NewsCard';
import Reveal from '../components/Reveal';
import { mockNews, NEWS_CATEGORIES, NewsCategory } from '../data/mockNews';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../styles/news.css';

// Trang 1 luôn có 2 card lớn (mới nhất) + 9 card lưới (3 hàng x 3 cột, không hở ô);
// các trang sau hiển thị đúng 9 card lưới mỗi trang (cũng luôn đầy hàng).
const FEATURED_COUNT = 2;
const GRID_PAGE_SIZE = 9;
const FIRST_PAGE_SIZE = FEATURED_COUNT + GRID_PAGE_SIZE;

export default function News() {
  const [active, setActive] = useState<NewsCategory>(NEWS_CATEGORIES[0].id);
  const [page, setPage] = useState(1);
  const [pageTransitioning, setPageTransitioning] = useState(false);

  const activeLabel = NEWS_CATEGORIES.find((c) => c.id === active)?.label ?? 'Tin tức';
  useDocumentTitle(`${activeLabel} — Terra Việt`);

  const sorted = useMemo(
    () =>
      mockNews
        .filter((n) => n.category === active)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [active],
  );

  const totalPages = Math.max(
    1,
    1 + Math.ceil(Math.max(0, sorted.length - FIRST_PAGE_SIZE) / GRID_PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);
  const isFirstPage = safePage === 1;

  const pageItems = useMemo(() => {
    if (isFirstPage) return sorted.slice(0, FIRST_PAGE_SIZE);
    const start = FIRST_PAGE_SIZE + (safePage - 2) * GRID_PAGE_SIZE;
    return sorted.slice(start, start + GRID_PAGE_SIZE);
  }, [sorted, safePage, isFirstPage]);

  const featured = isFirstPage ? pageItems[0] : undefined;
  const promo = isFirstPage ? pageItems[1] : undefined;
  const gridItems = isFirstPage ? pageItems.slice(FEATURED_COUNT) : pageItems;

  function handleTabChange(id: NewsCategory) {
    setActive(id);
    setPage(1);
  }

  function goToPage(p: number) {
    if (p === safePage || pageTransitioning) return;
    setPageTransitioning(true);
    window.setTimeout(() => {
      setPage(p);
      setPageTransitioning(false);
    }, 200);
  }

  return (
    <main className="news-page-bg">
      <section className="wrap news-page-head">
        <h1>Tin tức</h1>
      </section>

      <section className="wrap news-list-wrap">
        <div className="news-tabs" role="tablist" aria-label="Danh mục tin tức">
          {NEWS_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active === cat.id}
              className={`news-tab${active === cat.id ? ' active' : ''}`}
              onClick={() => handleTabChange(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {sorted.length === 0 ? (
          <p className="news-empty">Chưa có tin trong danh mục này.</p>
        ) : (
          <>
            <div className={`page-fade${pageTransitioning ? ' is-leaving' : ''}`}>
              {(featured || promo) && (
                <div className="news-top-row">
                  {featured && (
                    <Reveal>
                      <NewsCard item={featured} variant="featured" pillDate ribbon panel />
                    </Reveal>
                  )}
                  {promo && (
                    <Reveal delay={80}>
                      <NewsCard item={promo} variant="promo" pillDate ribbon panel />
                    </Reveal>
                  )}
                </div>
              )}
              {gridItems.length > 0 && (
                <div className="news-grid-sm news-grid-list">
                  {gridItems.map((n, i) => (
                    <Reveal key={n.id} delay={(i % 6) * 60}>
                      <NewsCard item={n} pillDate ribbon panel />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <nav className="news-pagination" aria-label="Phân trang tin tức">
                <button
                  type="button"
                  className="news-page-btn news-page-nav"
                  disabled={safePage === 1}
                  onClick={() => goToPage(safePage - 1)}
                  aria-label="Trang trước"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`news-page-btn${p === safePage ? ' active' : ''}`}
                    aria-current={p === safePage ? 'page' : undefined}
                    onClick={() => goToPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="news-page-btn news-page-nav"
                  disabled={safePage === totalPages}
                  onClick={() => goToPage(safePage + 1)}
                  aria-label="Trang sau"
                >
                  ›
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
