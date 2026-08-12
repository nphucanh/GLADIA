import { Link, useParams } from 'react-router-dom';
import HeroPhoto from '../components/HeroPhoto';
import Reveal from '../components/Reveal';
import { mockNews, NEWS_CATEGORIES } from '../data/mockNews';
import { fmtDate } from '../utils/format';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../styles/news.css';

export default function NewsDetail() {
  const { id } = useParams();
  const item = mockNews.find((n) => n.id === Number(id));

  useDocumentTitle(item ? `${item.title} — Terra Việt` : 'Không tìm thấy tin — Terra Việt');

  if (!item) {
    return (
      <main>
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

  return (
    <main>
      <section className="page-hero page-hero-photo" style={{ padding: '64px 0' }}>
        <HeroPhoto image={item.image} />
        <div className="hero-grid" />
        <div className="wrap">
          <Link to="/tin-tuc" className="news-back-link">
            ← Quay lại Tin tức
          </Link>
          <div className="eyebrow">{categoryLabel}</div>
          <h1 className="news-article-h1">{item.title}</h1>
        </div>
      </section>

      <section className="wrap news-article">
        <span className="news-date-pill">{fmtDate(item.date)}</span>
        <div className="news-article-body">
          {item.content.map((p, i) => (
            <Reveal key={i} delay={i * 60} as="p">
              {p}
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
