import HeroPhoto from '../components/HeroPhoto';
import { PAGE_HERO_IMAGE } from '../data/images';
import Reveal from '../components/Reveal';
import '../styles/about.css';

const MAP_ITEMS = [
  {
    label: 'Sứ mệnh',
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
    label: 'Tầm nhìn',
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
    label: 'Định hướng phát triển',
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
    label: 'Giá trị cốt lõi',
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
  return (
    <main>
      <section className="page-hero page-hero-photo">
        <HeroPhoto image={PAGE_HERO_IMAGE} />
        <div className="hero-grid" />
        <div className="wrap">
          <div className="eyebrow" style={{ color: 'var(--gold)' }}>
            Về Terra Việt
          </div>
          <h1>Xây dựng từ niềm tin, phát triển bằng trách nhiệm.</h1>
          <p className="lead" style={{ color: '#e6e2d2', maxWidth: 640 }}>
            15 năm hình thành và phát triển, Terra Việt kiên định với một triết lý: bất động sản phải phục vụ con
            người trước khi phục vụ lợi nhuận.
          </p>
        </div>
      </section>

      <section className="wrap">
        <div className="sec-head">
          <div>
            <div className="eyebrow">Định hướng</div>
            <h2>Sứ mệnh — Tầm nhìn — Giá trị</h2>
          </div>
        </div>
        <div className="map-timeline">
          {MAP_ITEMS.map((item, i) => {
            const content = (
              <>
                <div className="map-label">{item.label}</div>
                <div className="map-body">
                  {item.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </>
            );
            return (
              <Reveal key={item.label} delay={i * 100}>
                <div className="map-item">
                  <div className="map-text map-text-left">{i % 2 === 0 ? content : null}</div>
                  <div className="map-icon-wrap">
                    <span className="map-icon">{item.icon}</span>
                  </div>
                  <div className="map-text map-text-right">{i % 2 === 1 ? content : null}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </main>
  );
}
