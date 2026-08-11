import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroPhoto from '../components/HeroPhoto';
import Reveal from '../components/Reveal';
import { ABOUT_MISSION_IMAGE } from '../data/images';
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

// Tổng số slide chi tiết (Sứ mệnh/Tầm nhìn/Định hướng phát triển/Giá trị cốt lõi) — dùng
// để đánh số "0x / 04" nhất quán cho cả 4 slide, mỗi slide đều có bố cục riêng bên dưới.
const TOTAL_DETAIL_SECTIONS = 4;

// Sứ mệnh: 3 cột nổi trên ảnh nền (xem MISSION_COLUMNS).
const MISSION_COLUMNS = [
  {
    title: 'Với khách hàng',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round" />
      </svg>
    ),
    lines: ['Không gian sống chất lượng', 'Cộng đồng nhân văn', 'Phong cách sống hiện đại'],
  },
  {
    title: 'Với nhân viên',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3 2 8l10 5 10-5-10-5Z" strokeLinejoin="round" />
        <path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 8v6" strokeLinecap="round" />
      </svg>
    ),
    lines: ['Môi trường làm việc chuyên nghiệp', 'Nền tảng kiến thức và kỹ năng', 'Ổn định sự nghiệp lâu dài'],
  },
  {
    title: 'Với đối tác',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M2 13l4 4 3-3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 14l3 3a1.5 1.5 0 0 0 2-2l-4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 13l-4 4-3-3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 14l-3 3a1.5 1.5 0 0 1-2-2l4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    lines: ['Đặt niềm tin lên hàng đầu', 'Cùng chia sẻ lợi ích dài lâu'],
  },
];

// Tầm nhìn cũng có bố cục riêng (ảnh nền toàn màn hình, chữ căn phải, danh sách
// icon-tròn/đoạn văn có gạch ngăn cách) — tách khỏi mảng SECTIONS.
const VISION_ITEMS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="5" y="9" width="14" height="12" rx="1" />
        <path d="M9 21v-5h6v5" />
        <path d="M12 9V4c2 0 3 1.5 3 3.5S14 9 12 9Z" strokeLinejoin="round" />
      </svg>
    ),
    text: 'Trở thành thương hiệu bất động sản được tin cậy nhất trong lĩnh vực phát triển đô thị sinh thái tại Việt Nam.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 11l9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 18.3s-3-2-3-4.1a2 2 0 0 1 3.6-1.2 2 2 0 0 1 3.6 1.2c0 2.1-3 4.1-3 4.1Z" />
      </svg>
    ),
    text: 'Cam kết mang đến những "giải pháp an cư hoàn hảo", góp phần mang lại cuộc sống hạnh phúc và thịnh vượng cho cộng đồng.',
  },
];

// Định hướng phát triển — bố cục cột icon-tròn/tiêu đề/đoạn văn giống Sứ mệnh (mỗi cột là
// 1 mốc thời gian).
const DIRECTION_COLUMNS = [
  {
    title: '2010',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M5 3v18" strokeLinecap="round" />
        <path d="M5 4h13l-3 4 3 4H5" strokeLinejoin="round" />
      </svg>
    ),
    lines: ['Khởi đầu với dự án khu dân cư đầu tiên tại Bình Dương, từng bước mở rộng ra TP.HCM, Đồng Nai và Long An.'],
  },
  {
    title: '2026 – 2030',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    lines: ['Mở rộng sang Đà Nẵng, Hà Nội; số hoá toàn bộ trải nghiệm khách hàng, hướng đến trở thành nhà phát triển đô thị xanh hàng đầu Việt Nam.'],
  },
];

// Giá trị cốt lõi — bố cục danh sách icon-tròn/đoạn văn giống Tầm nhìn (mỗi mục là 1 giá trị).
const VALUES_ITEMS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    text: 'Chính trực: giá trị quan trọng nhất hình thành phong cách của Terra Việt, luôn giữ vững uy tín với đối tác, khách hàng.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3 3 9l9 12 9-12-9-6Z" strokeLinejoin="round" />
        <path d="M3 9h18M9.5 3 8 9l4 12 4-12-1.5-6" strokeLinejoin="round" />
      </svg>
    ),
    text: 'Sáng tạo – Tận tâm: mọi quyết định đều đặt lợi ích khách hàng và cộng đồng làm trung tâm, minh bạch trong từng giao dịch.',
  },
];

export default function About() {
  // Cảm giác "từng trang toàn màn hình" kiểu PowerPoint, giống Trang chủ.
  useEffect(() => {
    document.documentElement.classList.add('home-snap');
    return () => document.documentElement.classList.remove('home-snap');
  }, []);
  const navigate = useNavigate();
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
        <HeroPhoto image={ABOUT_MISSION_IMAGE} />
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

      <section className={slideClass('slide-mission', 'slide-center mission-slide')} id="slide-mission">
        <HeroPhoto image={ABOUT_MISSION_IMAGE} />
        <div className="mission-overlay" aria-hidden="true" />
        <div className="wrap mission-heading">
          <Reveal variant="up" delay={100} active={activeIndex === SLIDE_IDS.indexOf('slide-mission')}>
            <div className="eyebrow">{`01 / 0${TOTAL_DETAIL_SECTIONS}`}</div>
            <h2>Sứ mệnh</h2>
          </Reveal>
        </div>
        <div className="wrap mission-columns">
          {MISSION_COLUMNS.map((col, ci) => {
            const active = activeIndex === SLIDE_IDS.indexOf('slide-mission');
            return (
              <div className="mission-col" key={col.title}>
                <Reveal variant="pop" delay={220 + ci * 180} active={active}>
                  <span className="mission-col-icon">{col.icon}</span>
                </Reveal>
                <Reveal variant="up" delay={380 + ci * 180} active={active}>
                  <h3>{col.title}</h3>
                  <div className="mission-col-lines">
                    {col.lines.map((l) => (
                      <p key={l}>{l}</p>
                    ))}
                  </div>
                </Reveal>
                <span className="mission-col-line" aria-hidden="true" />
              </div>
            );
          })}
        </div>
      </section>

      <section className={slideClass('slide-vision', 'slide-center vision-slide')} id="slide-vision">
        <HeroPhoto image={ABOUT_MISSION_IMAGE} />
        <div className="vision-overlay" aria-hidden="true" />
        {(() => {
          const active = activeIndex === SLIDE_IDS.indexOf('slide-vision');
          return (
            <>
              <div className="wrap vision-heading">
                <Reveal variant="up" delay={100} active={active}>
                  <div className="eyebrow">{`02 / 0${TOTAL_DETAIL_SECTIONS}`}</div>
                </Reveal>
              </div>
              <div className="wrap vision-layout">
                <Reveal variant="left" delay={220} active={active}>
                  <h2>Tầm nhìn</h2>
                </Reveal>
                <div className="vision-items">
                  {VISION_ITEMS.map((item, vi) => (
                    <Reveal key={vi} variant="left" delay={320 + vi * 180} active={active}>
                      <div className="vision-item">
                        <span className="vision-item-icon">{item.icon}</span>
                        <p>{item.text}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </>
          );
        })()}
      </section>

      <section className={slideClass('slide-direction', 'slide-center direction-slide')} id="slide-direction">
        <HeroPhoto image={ABOUT_MISSION_IMAGE} />
        <div className="direction-overlay" aria-hidden="true" />
        <div className="wrap mission-heading">
          <Reveal variant="up" delay={100} active={activeIndex === SLIDE_IDS.indexOf('slide-direction')}>
            <div className="eyebrow">{`03 / 0${TOTAL_DETAIL_SECTIONS}`}</div>
            <h2>Định hướng phát triển</h2>
          </Reveal>
        </div>
        <div className="wrap values-columns">
          {DIRECTION_COLUMNS.map((col, ci) => {
            const active = activeIndex === SLIDE_IDS.indexOf('slide-direction');
            return (
              <div className="mission-col" key={col.title}>
                <Reveal variant="pop" delay={220 + ci * 180} active={active}>
                  <span className="mission-col-icon">{col.icon}</span>
                </Reveal>
                <Reveal variant="up" delay={380 + ci * 180} active={active}>
                  <h3>{col.title}</h3>
                  <div className="mission-col-lines">
                    {col.lines.map((l) => (
                      <p key={l}>{l}</p>
                    ))}
                  </div>
                </Reveal>
                <span className="mission-col-line" aria-hidden="true" />
              </div>
            );
          })}
        </div>
      </section>

      <section className={slideClass('slide-values', 'slide-center values-slide')} id="slide-values">
        <HeroPhoto image={ABOUT_MISSION_IMAGE} />
        <div className="values-overlay" aria-hidden="true" />
        {(() => {
          const active = activeIndex === SLIDE_IDS.indexOf('slide-values');
          return (
            <>
              <div className="wrap direction-heading">
                <Reveal variant="up" delay={100} active={active}>
                  <div className="eyebrow">{`04 / 0${TOTAL_DETAIL_SECTIONS}`}</div>
                  <h2>Giá trị cốt lõi</h2>
                </Reveal>
              </div>
              <div className="wrap direction-layout">
                <div className="vision-items">
                  {VALUES_ITEMS.map((item, vi) => (
                    <Reveal key={vi} variant="up" delay={280 + vi * 180} active={active}>
                      <div className="vision-item">
                        <span className="vision-item-icon">{item.icon}</span>
                        <p>{item.text}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </>
          );
        })()}
      </section>

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
    </main>
  );
}
