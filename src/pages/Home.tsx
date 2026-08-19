import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePresentationScroll } from '../hooks/usePresentationScroll';
import { useActiveSection } from '../context/ActiveSectionContext';
import NewsCard from '../components/NewsCard';
import Reveal from '../components/Reveal';
import StatCounter from '../components/StatCounter';
import HeroPhoto from '../components/HeroPhoto';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { HERO_IMAGE } from '../data/images';
import { mockNews } from '../data/mockNews';
import '../styles/home.css';
import '../styles/news.css';

const DISTRIBUTORS = ['Terra Realty', 'Sunview Homes', 'GreenKey Housing', 'Riverside Realty', 'Golden Path Homes', 'SGLand', 'Sunrise Estates'];

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

// Thứ tự slide đồng bộ với thứ tự mục trong Sidebar: Trang chủ → Giới thiệu → Tin tức → Liên hệ.
const SLIDE_IDS = ['slide-hero', 'slide-about', 'slide-news', 'slide-contact'];

// Slide duy nhất được thiết kế có thể cao hơn 1 màn hình — cuộn/vuốt sẽ ưu tiên cuộn nội
// bộ slide này trước khi đổi sang slide khác.
const SCROLLABLE_SLIDE_IDS = ['slide-contact'];

export default function Home() {
  const navigate = useNavigate();

  // Cảm giác "từng trang toàn màn hình" kiểu PowerPoint — chỉ ở Trang chủ.
  // Các slide giờ xếp chồng cố định (không cuộn tài liệu thật) nên khoá luôn scroll của trang.
  useEffect(() => {
    document.documentElement.classList.add('home-snap');
    return () => document.documentElement.classList.remove('home-snap');
  }, []);
  const { activeIndex, goTo } = usePresentationScroll(SLIDE_IDS, false, SCROLLABLE_SLIDE_IDS);

  // Đồng bộ mục sáng trong Sidebar theo slide đang active, và đăng ký hàm chuyển slide
  // để Sidebar (component riêng, không phải con của Home) có thể điều khiển từ xa.
  const { setActiveSection, registerGoToSlide } = useActiveSection();
  useEffect(() => {
    setActiveSection(SLIDE_IDS[activeIndex]);
    return () => setActiveSection(null);
  }, [activeIndex, setActiveSection]);
  useEffect(() => {
    registerGoToSlide((slideId: string) => {
      const idx = SLIDE_IDS.indexOf(slideId);
      if (idx !== -1) goTo(idx);
    });
    return () => registerGoToSlide(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerGoToSlide]);

  const isLastSlide = activeIndex === SLIDE_IDS.length - 1;
  function handleSlideNavClick() {
    goTo(isLastSlide ? 0 : activeIndex + 1);
  }
  function slideClass(id: string, extra = '') {
    return `morph-slide ${extra} ${activeIndex === SLIDE_IDS.indexOf(id) ? 'is-active' : ''}`.trim();
  }

  const [featuredNews, ...secondaryNews] = mockNews.slice(0, 3);

  return (
    <main>
      <section className={slideClass('slide-hero', 'hero hero-photo')} id="slide-hero">
        <HeroPhoto image={HERO_IMAGE} />

        <div className="hero-logotype" aria-hidden="true">
          <span className="hlt-big">TERRA</span>
          <span className="hlt-caption">R E A L &nbsp; E S T A T E &nbsp; G R O U P</span>
        </div>

        <div className="wrap hero-inner">
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
            <Button variant="brick" onClick={() => navigate('/du-an')}>
              Khám phá dự án
            </Button>
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-[var(--forest)]"
              onClick={() => navigate('/lien-he')}
            >
              Đăng ký tư vấn
            </Button>
          </div>
        </div>
      </section>

      <section className={slideClass('slide-about', 'slide-center about-slide')} id="slide-about" style={{ paddingTop: 0 }}>
        <span className="about-orb about-orb-1" aria-hidden="true" />
        <span className="about-orb about-orb-2" aria-hidden="true" />
        <div className="wrap about-layout">
          <Reveal variant="left" delay={220} active={activeIndex === SLIDE_IDS.indexOf('slide-about')}>
            <div className="about-copy">
              <div className="eyebrow">Về Terra Việt</div>
              <h2>Hơn một chủ đầu tư — một người kiến tạo cộng đồng.</h2>
              <p>
                Từ 2010, Terra Việt theo đuổi triết lý phát triển bền vững: mỗi dự án là một hệ sinh thái sống,
                không chỉ là công trình bất động sản.
              </p>
              <Button variant="outline" onClick={() => navigate('/gioi-thieu')}>
                Tìm hiểu thêm về chúng tôi
              </Button>
            </div>
          </Reveal>
          <div className="about-stats-grid">
            {ABOUT_STATS.map((s, i) => (
              <Reveal
                key={s.label}
                variant="pop"
                delay={600 + i * 260}
                active={activeIndex === SLIDE_IDS.indexOf('slide-about')}
              >
                <Card className="about-stat-card border-0">
                  <span className="about-stat-icon">{s.icon}</span>
                  <StatCounter
                    target={s.target}
                    label={s.label}
                    delay={280}
                    active={activeIndex === SLIDE_IDS.indexOf('slide-about')}
                  />
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={slideClass('slide-news', 'slide-center')} id="slide-news">
        <div className="wrap news-layout">
          <Reveal variant="down" delay={150} active={activeIndex === SLIDE_IDS.indexOf('slide-news')}>
            <div className="news-heading">
              <span className="news-heading-watermark" aria-hidden="true">
                Lifestyle
              </span>
              <div className="eyebrow">Cập nhật</div>
              <h2>Tin tức</h2>
              <p>Thông tin mới nhất về ưu đãi, hạ tầng kết nối và tiềm năng đầu tư từ Terra Việt.</p>
            </div>
          </Reveal>
          <div className="news-content">
            <Reveal variant="pop" delay={400} active={activeIndex === SLIDE_IDS.indexOf('slide-news')}>
              <NewsCard item={featuredNews} variant="featured" />
            </Reveal>
            <div className="news-grid-sm">
              {secondaryNews.map((n, i) => (
                <Reveal
                  key={n.id}
                  variant="right"
                  delay={680 + i * 260}
                  active={activeIndex === SLIDE_IDS.indexOf('slide-news')}
                >
                  <NewsCard item={n} />
                </Reveal>
              ))}
            </div>
            <Button type="button" variant="gold" onClick={() => navigate('/tin-tuc')}>
              Xem thêm →
            </Button>
          </div>
        </div>
      </section>

      <section className={slideClass('slide-contact', 'contact-cta-slide slide-center')} id="slide-contact">
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
          <Reveal variant="pop" delay={150} active={activeIndex === SLIDE_IDS.indexOf('slide-contact')}>
            <div className="partner-block">
              <div className="partner-label">Đầu tư và phát triển bởi</div>
              <div className="partner-wordmark partner-wordmark-lg">TERRA VIỆT</div>
            </div>
          </Reveal>
          <Reveal variant="pop" delay={400} active={activeIndex === SLIDE_IDS.indexOf('slide-contact')}>
            <div className="partner-block">
              <div className="partner-label">Đối tác thi công</div>
              <div className="partner-wordmark">VietBuild Construction</div>
            </div>
          </Reveal>
          <Reveal variant="pop" delay={650} active={activeIndex === SLIDE_IDS.indexOf('slide-contact')}>
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
          </Reveal>

          <Reveal variant="up" delay={950} active={activeIndex === SLIDE_IDS.indexOf('slide-contact')}>
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
          </Reveal>
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
