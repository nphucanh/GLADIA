import { Link, useParams } from 'react-router-dom';
import NewsCard from '../components/NewsCard';
import Reveal from '../components/Reveal';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '../components/ui/carousel';
import { mockNews, NEWS_CATEGORIES } from '../data/mockNews';
import { fmtDate } from '../utils/format';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../styles/news.css';

const WORDS_PER_MINUTE = 200;

function estimateReadingTime(paragraphs: string[]): number {
  const words = paragraphs.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export default function NewsDetail() {
  const { id } = useParams();
  const item = mockNews.find((n) => n.id === Number(id));

  useDocumentTitle(item ? `${item.title} — Terra Việt` : 'Không tìm thấy tin — Terra Việt');

  if (!item) {
    return (
      <main className="news-page-bg">
        <section className="wrap" style={{ padding: '160px 0 120px' }}>
          <p className="news-empty">Không tìm thấy bài viết này.</p>
          <Link to="/tin-tuc" className="news-back-link">
            ← Quay lại Tin tức
          </Link>
        </section>
      </main>
    );
  }

  const categoryLabel = NEWS_CATEGORIES.find((c) => c.id === item.category)?.label ?? 'Tin tức';
  const readingTime = estimateReadingTime(item.content);

  // Bài trước/sau — theo thứ tự thời gian chung (mới nhất trước), giúp người đọc
  // tiếp tục đọc mà không cần quay lại danh sách.
  const chronological = [...mockNews].sort((a, b) => (a.date < b.date ? 1 : -1));
  const currentIndex = chronological.findIndex((n) => n.id === item.id);
  const newerArticle = currentIndex > 0 ? chronological[currentIndex - 1] : undefined;
  const olderArticle =
    currentIndex >= 0 && currentIndex < chronological.length - 1 ? chronological[currentIndex + 1] : undefined;

  // Tin đề xuất — ưu tiên cùng danh mục (mới nhất trước), thiếu thì lấy thêm từ các
  // danh mục khác để luôn đủ tin cho carousel ở cuối trang.
  const sameCategory = chronological.filter((n) => n.category === item.category && n.id !== item.id);
  const otherCategory = chronological.filter((n) => n.category !== item.category && n.id !== item.id);
  const suggested = [...sameCategory, ...otherCategory].slice(0, 8);

  return (
    <main className="news-page-bg">
      <section className="wrap news-detail-head">
        <Link to="/tin-tuc" className="news-back-link">
          ← Quay lại Tin tức
        </Link>
        <div className="eyebrow">{categoryLabel}</div>
        <h1>{item.title}</h1>
        <div className="news-detail-meta">
          <span className="news-date-pill">{fmtDate(item.date)}</span>
          <span className="news-reading-time">{readingTime} phút đọc</span>
        </div>
      </section>

      <section className="wrap news-article">
        <figure className="news-detail-cover">
          <img src={item.image} alt={item.title} loading="lazy" />
        </figure>

        <div className="news-article-body">
          {item.content.map((p, i) => (
            <Reveal key={i} delay={i * 60} as="p">
              {p}
            </Reveal>
          ))}
        </div>

        {(olderArticle || newerArticle) && (
          <nav className="news-detail-nav" aria-label="Điều hướng bài viết">
            {olderArticle ? (
              <Link to={`/tin-tuc/${olderArticle.id}`} className="news-detail-nav-link prev">
                <span className="news-detail-nav-label">← Bài trước</span>
                <span className="news-detail-nav-title">{olderArticle.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {newerArticle && (
              <Link to={`/tin-tuc/${newerArticle.id}`} className="news-detail-nav-link next">
                <span className="news-detail-nav-label">Bài sau →</span>
                <span className="news-detail-nav-title">{newerArticle.title}</span>
              </Link>
            )}
          </nav>
        )}
      </section>

      {suggested.length > 0 && (
        <section className="wrap news-suggested">
          <div className="sec-head">
            <div>
              <div className="eyebrow">Đề xuất cho bạn</div>
              <h2>Tin tức khác có thể bạn quan tâm</h2>
            </div>
          </div>
          <Carousel opts={{ align: 'start', dragFree: true }} className="news-carousel px-12">
            <CarouselContent className="-ml-7">
              {suggested.map((n) => (
                <CarouselItem key={n.id} className="basis-[84%] pl-7 sm:basis-1/2 lg:basis-1/3">
                  <NewsCard item={n} pillDate ribbon panel />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-1.5" />
            <CarouselNext className="right-1.5" />
          </Carousel>
        </section>
      )}
    </main>
  );
}
