import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePresentationScroll } from '../hooks/usePresentationScroll';
import { useActiveSection } from '../context/ActiveSectionContext';
import NewsCard from '../components/NewsCard';
import Reveal from '../components/Reveal';
import StatCounter from '../components/StatCounter';
import HeroPhoto from '../components/HeroPhoto';
import { HERO_IMAGE, AMENITY_HERO_IMAGE, AMENITY_INSET_IMAGE } from '../data/images';
import { mockNews } from '../data/mockNews';
import '../styles/home.css';
import '../styles/news.css';

const DISTRIBUTORS = ['Terra Realty', 'Sunview Homes', 'GreenKey Housing', 'Riverside Realty', 'Golden Path Homes'];

const ABOUT_STATS = [
  {
    target: 15,
    label: 'Năm kinh nghiệm',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    target: 48,
    label: 'Dự án đã triển khai',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="4" y="9" width="7" height="12" />
        <rect x="13" y="4" width="7" height="17" />
        <path d="M6.5 12h2M6.5 15h2M6.5 18h2M15.5 7h2M15.5 10h2M15.5 13h2M15.5 16h2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    target: 12000,
    label: 'Khách hàng tin tưởng',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="9" cy="9" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
        <circle cx="17" cy="8" r="2.4" />
        <path d="M15.5 14.3c2.6.4 4.5 2.6 4.5 5.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    target: 9,
    label: 'Tỉnh thành hiện diện',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" strokeLinejoin="round" />
        <circle cx="12" cy="9.5" r="2.4" />
      </svg>
    ),
  },
];

// Thứ tự slide đồng bộ với thứ tự mục trong Sidebar: Trang chủ → Giới thiệu → Tin tức → Tiện ích → Liên hệ.
const SLIDE_IDS = ['slide-hero', 'slide-about', 'slide-news', 'slide-amenities', 'slide-contact'];

// Section nào đang cuộn tới trên Trang chủ thì mục tương ứng trong Sidebar sẽ sáng lên
const SLIDE_NAV_MAP: Record<string, string> = {
  'slide-hero': '/',
  'slide-about': '/gioi-thieu',
  'slide-news': '/tin-tuc',
  'slide-amenities': '/tien-ich',
  'slide-contact': '/lien-he',
};

export default function Home() {
  const navigate = useNavigate();

  // Cảm giác "từng trang toàn màn hình" kiểu PowerPoint — chỉ ở Trang chủ.
  useEffect(() => {
    document.documentElement.classList.add('home-snap');
    return () => document.documentElement.classList.remove('home-snap');
  }, []);
  usePresentationScroll(SLIDE_IDS);

  // Đồng bộ mục sáng trong Sidebar + nút cuộn nổi theo section đang cuộn tới trên Trang chủ.
  const { setActiveSection } = useActiveSection();
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  useEffect(() => {
    const elements = SLIDE_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (elements.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveSection(SLIDE_NAV_MAP[entry.target.id] ?? '/');
            setActiveSlideIndex(SLIDE_IDS.indexOf(entry.target.id));
          }
        });
      },
      { threshold: [0.5] },
    );
    elements.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      setActiveSection(null);
    };
  }, [setActiveSection]);

  const isLastSlide = activeSlideIndex === SLIDE_IDS.length - 1;
  function handleSlideNavClick() {
    const targetId = isLastSlide ? SLIDE_IDS[0] : SLIDE_IDS[activeSlideIndex + 1];
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const [featuredNews, ...secondaryNews] = mockNews.slice(0, 3);

  return (
    <main>
      <section className="hero hero-photo snap-section" id="slide-hero">
        <HeroPhoto image={HERO_IMAGE} />
        <div className="hero-grid" />

        {/* Logotype khổng lồ, mờ dần — lấy cảm hứng bố cục từ thegio.vn */}
        <div className="hero-logotype" aria-hidden="true">
          <span className="hlt-small">Terra</span>
          <span className="hlt-big">VIỆT</span>
          <span className="hlt-caption">R E A L &nbsp; E S T A T E &nbsp; G R O U P</span>
        </div>

        <div className="wrap hero-inner">
          <div className="eyebrow">Terra Việt Group · Từ 2010</div>
          <h1>
            <span className="line">
              <span>Kiến tạo</span>
            </span>
            <span className="line">
              <span>không gian sống thật.</span>
            </span>
          </h1>
          <p className="lead">
            Chúng tôi phát triển các dự án bất động sản gắn với đời sống thực — nơi con người, thiên nhiên và đô thị
            cùng tồn tại hài hoà.
          </p>
          <div className="hero-actions">
            <button className="cta-btn brick" onClick={() => navigate('/du-an')}>
              Khám phá dự án
            </button>
            <button
              className="cta-btn ghost"
              style={{ color: '#fff', borderColor: '#fff' }}
              onClick={() => navigate('/lien-he')}
            >
              Đăng ký tư vấn
            </button>
          </div>
        </div>
      </section>

      <section className="snap-section slide-center about-slide" id="slide-about" style={{ paddingTop: 0 }}>
        <span className="about-orb about-orb-1" aria-hidden="true" />
        <span className="about-orb about-orb-2" aria-hidden="true" />
        <div className="wrap about-layout">
          <Reveal>
            <div className="about-copy">
              <div className="eyebrow">Về Terra Việt</div>
              <h2>Hơn một chủ đầu tư — một người kiến tạo cộng đồng.</h2>
              <p>
                Từ 2010, Terra Việt theo đuổi triết lý phát triển bền vững: mỗi dự án là một hệ sinh thái sống,
                không chỉ là công trình bất động sản.
              </p>
              <button className="cta-btn ghost about-cta" onClick={() => navigate('/gioi-thieu')}>
                Tìm hiểu thêm về chúng tôi
              </button>
            </div>
          </Reveal>
          <div className="about-stats-grid">
            {ABOUT_STATS.map((s, i) => (
              <Reveal key={s.label} delay={150 + i * 90}>
                <div className="about-stat-card">
                  <span className="about-stat-icon">{s.icon}</span>
                  <StatCounter target={s.target} label={s.label} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="snap-section slide-center" id="slide-news">
        <div className="wrap news-layout">
          <div className="news-heading">
            <span className="news-heading-watermark" aria-hidden="true">
              Lifestyle
            </span>
            <div className="eyebrow">Cập nhật</div>
            <h2>Tin tức</h2>
            <p>Thông tin mới nhất về ưu đãi, hạ tầng kết nối và tiềm năng đầu tư từ Terra Việt.</p>
          </div>
          <div className="news-content">
            <Reveal>
              <NewsCard item={featuredNews} variant="featured" />
            </Reveal>
            <div className="news-grid-sm">
              {secondaryNews.map((n, i) => (
                <Reveal key={n.id} delay={(i + 1) * 80}>
                  <NewsCard item={n} />
                </Reveal>
              ))}
            </div>
            <button
              type="button"
              className="cta-btn ghost"
              style={{ color: 'var(--gold)', borderColor: 'var(--gold)' }}
              onClick={() => navigate('/tin-tuc')}
            >
              Xem thêm →
            </button>
          </div>
        </div>
      </section>

      <section className="hero hero-photo snap-section" id="slide-amenities">
        <HeroPhoto image={AMENITY_HERO_IMAGE} />
        <div className="hero-grid" />
        <div className="wrap hero-inner">
          <div className="eyebrow" style={{ color: 'var(--gold)' }}>
            Trải nghiệm sống
          </div>
          <h1>Tiện ích</h1>
          <p className="lead" style={{ color: '#e6e2d2', maxWidth: 520 }}>
            Hệ thống tiện ích nội khu được thiết kế theo mô hình{' '}
            <strong style={{ color: '#fff' }}>"Live - Work - Learn - Play"</strong>, đáp ứng đầy đủ nhu cầu sống,
            làm việc, học tập và giải trí của từng thành viên trong gia đình.
          </p>
          <div className="hero-actions">
            <button className="cta-btn brick" onClick={() => navigate('/tien-ich')}>
              Xem thêm
            </button>
          </div>
        </div>
        <img className="home-slide-inset" src={AMENITY_INSET_IMAGE} alt="Không gian tiện ích Terra Việt" />
      </section>

      <section className="contact-cta-slide snap-section slide-center" id="slide-contact">
        <div className="contact-wave-bg" aria-hidden="true">
          <svg viewBox="0 0 1600 500" preserveAspectRatio="none">
            <path
              d="M0,260 C 300,180 500,340 800,260 C 1100,180 1300,320 1600,240"
              fill="none"
              stroke="rgba(255,253,248,.16)"
              strokeWidth="2"
            />
            <path
              d="M0,330 C 320,250 520,410 820,330 C 1120,250 1340,390 1600,310"
              fill="none"
              stroke="rgba(255,253,248,.1)"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <div className="wrap contact-showcase">
          <div className="partner-block">
            <div className="partner-label">Đầu tư và phát triển bởi</div>
            <div className="partner-wordmark partner-wordmark-lg">TERRA VIỆT</div>
          </div>
          <div className="partner-block">
            <div className="partner-label">Đối tác thi công</div>
            <div className="partner-wordmark">VietBuild Construction</div>
          </div>
          <div className="partner-block">
            <div className="partner-label">Phân phối &amp; tiếp thị</div>
            <div className="partner-logo-row-wrap">
              <div className="partner-logo-row">
                {[...DISTRIBUTORS, ...DISTRIBUTORS].map((d, i) => (
                  <span className="partner-wordmark small" key={`${d}-${i}`}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="contact-info-block">
            <span className="contact-info-watermark" aria-hidden="true">
              Lifestyle
            </span>
            <h3>Tập đoàn Bất động sản Terra Việt</h3>
            <div className="contact-info-row">
              <span className="contact-info-item">
                <span className="ic" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" strokeLinejoin="round" />
                    <circle cx="12" cy="9.5" r="2.4" />
                  </svg>
                </span>
                88 Nguyễn Huệ, Phường Bến Nghé, TP. Hồ Chí Minh
              </span>
              <span className="contact-info-item">
                <span className="ic" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9Z" />
                  </svg>
                </span>
                <a href="https://terraviet.vn">terraviet.vn</a>
              </span>
            </div>
            <p className="contact-disclaimer">
              (*) Chúng tôi đặc biệt cẩn trọng trong việc chuẩn bị nội dung trên website này. Các thông tin/hình
              ảnh/bản vẽ chỉ thể hiện thông số kỹ thuật, tính thẩm mỹ và sự sáng tạo tại thời điểm được đăng tải và
              mang tính chất tham khảo, không đại diện chính xác cho điều kiện xây dựng thực tế và không mang tính
              đại diện hay là một phần của hợp đồng.
            </p>
          </div>
        </div>
      </section>

      <button
        type="button"
        className={`home-slide-nav-btn ${isLastSlide ? 'is-last' : ''}`}
        onClick={handleSlideNavClick}
        aria-label={isLastSlide ? 'Về đầu trang' : 'Cuộn xuống phần tiếp theo'}
      >
        {!isLastSlide && <span className="hsn-label">Scroll</span>}
        <span className="hsn-circle-wrap">
          <span className="hsn-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isLastSlide ? (
                <path d="M7 14l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </span>
        </span>
        {isLastSlide && <span className="hsn-label">Go top</span>}
      </button>

      <button
        type="button"
        className="home-subscribe-fab"
        onClick={() => navigate('/lien-he')}
        aria-label="Đăng ký nhận tin"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="hsf-arrow">
          <path d="M12 5v13M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Nhận tin</span>
      </button>

      {isLastSlide && (
        <div className="home-contact-bottom-bar">
          <div className="contact-socials">
            <a href="#!" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 9h3V5h-3c-2.2 0-4 1.8-4 4v2H8v4h2v6h4v-6h3l1-4h-4V9c0-.6.4-1 1-1Z" />
              </svg>
            </a>
            <a href="#!" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="6" width="20" height="12" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M10 9.5v5l4.5-2.5L10 9.5Z" />
              </svg>
            </a>
          </div>
          <span className="contact-copyright">© 2026 Terra Việt Group.</span>
        </div>
      )}
    </main>
  );
}
