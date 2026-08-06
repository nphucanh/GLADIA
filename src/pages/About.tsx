import HeroPhoto from '../components/HeroPhoto';
import { PAGE_HERO_IMAGE } from '../data/images';
import Reveal from '../components/Reveal';

const VALUES = [
  {
    idx: 'SỨ MỆNH',
    title: 'Kiến tạo giá trị sống bền vững',
    body: 'Phát triển các không gian sống chất lượng, hài hoà với môi trường và cộng đồng xung quanh, mang lại giá trị lâu dài cho cư dân.',
  },
  {
    idx: 'TẦM NHÌN',
    title: 'Nhà phát triển bất động sản hàng đầu Việt Nam',
    body: 'Trở thành thương hiệu được tin cậy nhất trong lĩnh vực phát triển đô thị sinh thái tại Việt Nam vào năm 2030.',
  },
  {
    idx: 'GIÁ TRỊ CỐT LÕI',
    title: 'Chính trực – Sáng tạo – Tận tâm',
    body: 'Mọi quyết định đều đặt lợi ích khách hàng và cộng đồng làm trung tâm, minh bạch trong từng giao dịch.',
  },
];

const TIMELINE = [
  { year: '2010', title: 'Thành lập Terra Việt', body: 'Khởi đầu với dự án khu dân cư đầu tiên tại Bình Dương.' },
  { year: '2015', title: 'Mở rộng quy mô toàn quốc', body: 'Phát triển dự án tại TP.HCM, Đồng Nai và Long An.' },
  { year: '2020', title: 'Chuyển đổi mô hình đô thị xanh', body: 'Áp dụng tiêu chuẩn công trình xanh cho toàn bộ dự án mới.' },
  { year: '2026', title: 'Hướng đến 2030', body: 'Mở rộng sang Đà Nẵng, Hà Nội; số hoá toàn bộ trải nghiệm khách hàng.' },
];

const PARTNERS = ['VietBuild', 'Sacom Bank', 'Delta Architects', 'GreenPark JSC', 'Sunrise Materials'];

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
        <div className="three-col">
          {VALUES.map((v, i) => (
            <Reveal key={v.idx} delay={i * 100}>
              <div className="value-card blueprint">
                <div className="idx">{v.idx}</div>
                <h3>{v.title}</h3>
                <p style={{ color: '#5c5648' }}>{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="wrap" style={{ background: 'var(--white)' }}>
        <div className="sec-head">
          <div>
            <div className="eyebrow">Hành trình</div>
            <h2>Định hướng phát triển</h2>
          </div>
        </div>
        <div className="timeline">
          {TIMELINE.map((t) => (
            <div className="tl-item" key={t.year}>
              <div className="yr">{t.year}</div>
              <h4>{t.title}</h4>
              <p style={{ color: '#5c5648' }}>{t.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className="eyebrow">Đối tác</div>
        <h2 style={{ marginBottom: 28 }}>Đồng hành cùng những thương hiệu uy tín</h2>
        <div className="partners-strip">
          {PARTNERS.map((p) => (
            <div className="partner-tile" key={p}>
              {p}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
