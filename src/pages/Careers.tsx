import { Link } from 'react-router-dom';
import HeroPhoto from '../components/HeroPhoto';
import Reveal from '../components/Reveal';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { PAGE_HERO_IMAGE } from '../data/images';
import '../styles/resource-pages.css';

const JOBS = [
  {
    title: 'Chuyên viên Kinh doanh Bất động sản',
    meta: 'TP.HCM · Toàn thời gian',
    body: 'Tư vấn, giới thiệu sản phẩm và chăm sóc khách hàng cho các dự án đang mở bán của Terra Việt.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 21V9l9-6 9 6v12" strokeLinejoin="round" />
        <path d="M9 21v-8h6v8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Trưởng phòng Marketing',
    meta: 'TP.HCM · Toàn thời gian',
    body: 'Xây dựng chiến lược thương hiệu, truyền thông đa kênh cho danh mục dự án của công ty.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 11l18-7-7 18-2-8-9-3Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Kỹ sư Giám sát công trình',
    meta: 'Bình Dương · Toàn thời gian',
    body: 'Giám sát chất lượng, tiến độ thi công thực tế tại công trường theo đúng hồ sơ thiết kế.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M14 3l7 7-9 9-7-7 9-9Z" strokeLinejoin="round" />
        <path d="M4 20l3-3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Chuyên viên Chăm sóc khách hàng',
    meta: 'TP.HCM · Toàn thời gian',
    body: 'Hỗ trợ, giải đáp và đồng hành cùng cư dân trong suốt quá trình sử dụng dịch vụ tại dự án.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Careers() {
  return (
    <main>
      <section className="page-hero page-hero-photo">
        <HeroPhoto image={PAGE_HERO_IMAGE} />
        <div className="hero-grid" />
        <div className="wrap">
          <div className="eyebrow">Tuyển dụng</div>
          <h1>Cùng kiến tạo không gian sống thật.</h1>
          <p className="lead" style={{ color: '#e6e2d2', maxWidth: 560 }}>
            Terra Việt luôn tìm kiếm những cộng sự tận tâm, sẵn sàng phát triển sự nghiệp lâu dài cùng chúng tôi.
          </p>
        </div>
      </section>

      <section className="wrap">
        <div className="sec-head">
          <div>
            <div className="eyebrow">Vị trí đang tuyển</div>
            <h2>Cơ hội nghề nghiệp tại Terra Việt</h2>
          </div>
          <p>Gửi hồ sơ ứng tuyển qua trang Liên hệ, đội ngũ nhân sự sẽ phản hồi trong vòng 3–5 ngày làm việc.</p>
        </div>
        <div className="tile-grid">
          {JOBS.map((j, i) => (
            <Reveal key={j.title} delay={i * 60}>
              <Card className="tile-card blueprint">
                <div className="ic">{j.icon}</div>
                <h3>{j.title}</h3>
                <div className="tile-meta">{j.meta}</div>
                <p>{j.body}</p>
                <Button asChild variant="outline" className="self-start mt-1">
                  <Link to="/lien-he">Ứng tuyển →</Link>
                </Button>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
