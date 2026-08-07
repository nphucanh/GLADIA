import HeroPhoto from '../components/HeroPhoto';
import { PAGE_HERO_IMAGE } from '../data/images';
import NewsCard from '../components/NewsCard';
import Reveal from '../components/Reveal';
import { mockNews } from '../data/mockNews';
import '../styles/news.css';

export default function News() {
  return (
    <main>
      <section className="page-hero page-hero-photo" style={{ padding: '64px 0' }}>
        <HeroPhoto image={PAGE_HERO_IMAGE} />
        <div className="hero-grid" />
        <div className="wrap">
          <div className="eyebrow" style={{ color: 'var(--gold)' }}>
            Cập nhật
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.6rem)' }}>Tin tức Terra Việt</h1>
        </div>
      </section>

      <section className="wrap news-layout">
        <div className="news-heading">
          <span className="news-heading-watermark" aria-hidden="true">
            Lifestyle
          </span>
          <div className="eyebrow">Cập nhật</div>
          <h2>Tin tức</h2>
          <p>Toàn bộ thông tin về ưu đãi, hạ tầng kết nối và tiềm năng đầu tư từ Terra Việt.</p>
        </div>
        <div className="news-content">
          <div className="news-grid-sm news-grid-list">
            {mockNews.map((n, i) => (
              <Reveal key={n.id} delay={(i % 6) * 60}>
                <NewsCard item={n} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
