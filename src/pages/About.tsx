import { useEffect } from 'react';
import HeroPhoto from '../components/HeroPhoto';
import Reveal from '../components/Reveal';
import { PAGE_HERO_IMAGE } from '../data/images';
import { usePresentationScroll } from '../hooks/usePresentationScroll';
import { useActiveSection, type RailItem } from '../context/ActiveSectionContext';
import '../styles/home.css';
import '../styles/about.css';

const SLIDE_IDS = ['slide-intro', 'slide-mission', 'slide-vision', 'slide-direction', 'slide-values'];

const ABOUT_RAIL_ITEMS: RailItem[] = [
  { to: '/gioi-thieu', label: 'Giới thiệu', slide: 'slide-intro' },
  { to: '/gioi-thieu', label: 'Sứ mệnh', slide: 'slide-mission' },
  { to: '/gioi-thieu', label: 'Tầm nhìn', slide: 'slide-vision' },
  { to: '/gioi-thieu', label: 'Định hướng phát triển', slide: 'slide-direction' },
  { to: '/gioi-thieu', label: 'Giá trị cốt lõi', slide: 'slide-values' },
];

const SECTIONS = [
  {
    slide: 'slide-mission',
    label: 'Sứ mệnh',
    light: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round" />
      </svg>
    ),
    body: [
      'Với khách hàng: cung cấp những không gian sống chất lượng, góp phần tạo dựng một cộng đồng nhân văn, phong cách sống hiện đại.',
      'Với nhân viên: xây dựng môi trường làm việc chuyên nghiệp, nền tảng kiến thức và kỹ năng để mỗi người ổn định sự nghiệp lâu dài.',
      'Với đối tác: đặt niềm tin và lợi ích của đối tác lên hàng đầu, cùng chia sẻ lợi ích dài lâu.',
    ],
  },
  {
    slide: 'slide-vision',
    label: 'Tầm nhìn',
    light: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2.8" />
      </svg>
    ),
    body: [
      'Trở thành thương hiệu bất động sản được tin cậy nhất trong lĩnh vực phát triển đô thị sinh thái tại Việt Nam.',
      'Cam kết mang đến những "giải pháp an cư hoàn hảo", góp phần mang lại cuộc sống hạnh phúc và thịnh vượng cho cộng đồng.',
    ],
  },
  {
    slide: 'slide-direction',
    label: 'Định hướng phát triển',
    light: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    body: [
      'Từ 2010: khởi đầu với dự án khu dân cư đầu tiên tại Bình Dương, từng bước mở rộng ra TP.HCM, Đồng Nai và Long An.',
      'Giai đoạn 2026 – 2030: mở rộng sang Đà Nẵng, Hà Nội; số hoá toàn bộ trải nghiệm khách hàng, hướng đến trở thành nhà phát triển đô thị xanh hàng đầu Việt Nam.',
    ],
  },
  {
    slide: 'slide-values',
    label: 'Giá trị cốt lõi',
    light: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3 3 9l9 12 9-12-9-6Z" strokeLinejoin="round" />
        <path d="M3 9h18M9.5 3 8 9l4 12 4-12-1.5-6" strokeLinejoin="round" />
      </svg>
    ),
    body: [
      'Chính trực: giá trị quan trọng nhất hình thành phong cách của Terra Việt, luôn giữ vững uy tín với đối tác, khách hàng.',
      'Sáng tạo – Tận tâm: mọi quyết định đều đặt lợi ích khách hàng và cộng đồng làm trung tâm, minh bạch trong từng giao dịch.',
    ],
  },
];

export default function About() {
  // Cảm giác "từng trang toàn màn hình" kiểu PowerPoint, giống Trang chủ.
  useEffect(() => {
    document.documentElement.classList.add('home-snap');
    return () => document.documentElement.classList.remove('home-snap');
  }, []);
  const { activeIndex, goTo } = usePresentationScroll(SLIDE_IDS, false);

  // Đồng bộ mục sáng trong Sidebar theo slide đang active, và đăng ký bộ mục + hàm chuyển
  // slide riêng của trang này (Sidebar là component riêng, không phải con của About).
  const { setActiveSection, registerGoToSlide, registerRailItems } = useActiveSection();
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
  useEffect(() => {
    registerRailItems(ABOUT_RAIL_ITEMS);
    return () => registerRailItems(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerRailItems]);

  const isLastSlide = activeIndex === SLIDE_IDS.length - 1;
  function slideClass(id: string, extra = '') {
    return `morph-slide ${extra} ${activeIndex === SLIDE_IDS.indexOf(id) ? 'is-active' : ''}`.trim();
  }

  return (
    <main>
      <section className={slideClass('slide-intro', 'hero hero-photo')} id="slide-intro">
        <HeroPhoto image={PAGE_HERO_IMAGE} />
        <div className="hero-grid" />
        <div className="wrap hero-inner">
          <div className="eyebrow">Về Terra Việt</div>
          <h1>
            <span className="line">
              <span>Xây dựng từ niềm tin,</span>
            </span>
            <span className="line">
              <span>phát triển bằng trách nhiệm.</span>
            </span>
          </h1>
          <p className="lead">
            15 năm hình thành và phát triển, Terra Việt kiên định với một triết lý: bất động sản phải phục vụ con
            người trước khi phục vụ lợi nhuận.
          </p>
        </div>
      </section>

      {SECTIONS.map((sec, i) => {
        const active = activeIndex === SLIDE_IDS.indexOf(sec.slide);
        return (
          <section
            key={sec.slide}
            className={slideClass(sec.slide, `slide-center about-detail-slide ${sec.light ? 'about-detail-light' : ''}`)}
            id={sec.slide}
          >
            <span className="about-orb about-orb-1" aria-hidden="true" />
            <span className="about-orb about-orb-2" aria-hidden="true" />
            <div className="wrap about-detail-layout">
              <Reveal variant="pop" delay={200} active={active}>
                <span className="about-detail-icon">{sec.icon}</span>
              </Reveal>
              <Reveal variant="up" delay={380} active={active}>
                <div className="eyebrow">{`0${i + 1} / 0${SECTIONS.length}`}</div>
                <h2>{sec.label}</h2>
              </Reveal>
              <Reveal variant="up" delay={520} active={active}>
                <div className="about-detail-body">
                  {sec.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>
        );
      })}

      <button
        type="button"
        className={`home-slide-nav-btn ${isLastSlide ? 'is-last' : ''}`}
        onClick={() => goTo(isLastSlide ? 0 : activeIndex + 1)}
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
    </main>
  );
}
