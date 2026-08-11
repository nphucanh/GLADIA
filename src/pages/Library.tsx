import { Link } from 'react-router-dom';
import HeroPhoto from '../components/HeroPhoto';
import Reveal from '../components/Reveal';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { PAGE_HERO_IMAGE } from '../data/images';
import '../styles/resource-pages.css';

const RESOURCES = [
  {
    title: 'Brochure dự án',
    body: 'Tổng quan quy hoạch, tiện ích và mặt bằng các dự án tiêu biểu của Terra Việt.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M6 2h9l5 5v15H6z" strokeLinejoin="round" />
        <path d="M15 2v5h5" strokeLinejoin="round" />
        <path d="M9 13h6M9 17h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Video giới thiệu',
    body: 'Phim 3D phối cảnh, video flycam thực tế tiến độ thi công cập nhật theo từng quý.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2" y="5" width="15" height="14" rx="1.5" />
        <path d="M17 9l5-3v12l-5-3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Sơ đồ mặt bằng',
    body: 'Bản vẽ mặt bằng tổng thể, mặt bằng căn hộ và chi tiết thiết kế từng phân khu.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="18" height="18" rx="1.5" />
        <path d="M3 9h18M9 9v12" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Bộ ảnh phối cảnh',
    body: 'Hình ảnh phối cảnh 3D chất lượng cao, phục vụ tham khảo và truyền thông.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="4" width="18" height="16" rx="1.5" />
        <circle cx="9" cy="10" r="2" />
        <path d="M21 17l-6-6-9 9" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Pháp lý dự án',
    body: 'Giấy phép xây dựng, tiến độ pháp lý và hồ sơ minh bạch của từng dự án.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Chính sách bán hàng',
    body: 'Bảng giá, phương thức thanh toán và các chương trình ưu đãi hiện hành.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 12h6M12 9v6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Library() {
  return (
    <main>
      <section className="page-hero page-hero-photo">
        <HeroPhoto image={PAGE_HERO_IMAGE} />
        <div className="hero-grid" />
        <div className="wrap">
          <div className="eyebrow">Thư viện</div>
          <h1>Tài liệu &amp; hình ảnh dự án.</h1>
          <p className="lead" style={{ color: '#e6e2d2', maxWidth: 560 }}>
            Toàn bộ brochure, video, mặt bằng và hồ sơ pháp lý các dự án Terra Việt — cập nhật liên tục.
          </p>
        </div>
      </section>

      <section className="wrap">
        <div className="sec-head">
          <div>
            <div className="eyebrow">Tài nguyên</div>
            <h2>Tổng hợp tài liệu dự án</h2>
          </div>
          <p>Để lại thông tin liên hệ, đội ngũ Terra Việt sẽ gửi tài liệu đầy đủ trong thời gian sớm nhất.</p>
        </div>
        <div className="tile-grid">
          {RESOURCES.map((r, i) => (
            <Reveal key={r.title} delay={i * 60}>
              <Card className="tile-card blueprint">
                <div className="ic">{r.icon}</div>
                <h3>{r.title}</h3>
                <p>{r.body}</p>
                <Button asChild variant="outline" className="self-start mt-1">
                  <Link to="/lien-he">Yêu cầu tài liệu →</Link>
                </Button>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
