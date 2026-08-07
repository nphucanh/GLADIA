import Reveal from '../components/Reveal';
import { AMENITY_HERO_IMAGE, AMENITY_INSET_IMAGE } from '../data/images';
import '../styles/amenities.css';

const AMENITIES = [
  {
    title: 'Hồ bơi vô cực',
    body: 'Hồ bơi tràn view sông, mở cửa cả ngày lẫn đêm cho cư dân thư giãn và tận hưởng khung cảnh hoàng hôn.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M2 17c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0" strokeLinecap="round" />
        <path d="M2 21c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0" strokeLinecap="round" />
        <path d="M6 13V5a2 2 0 0 1 2-2h3l7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Khu vui chơi trẻ em',
    body: 'Sân chơi an toàn, thiết kế theo tiêu chuẩn quốc tế, dành riêng cho các thành viên nhỏ tuổi trong gia đình.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="5" r="2" />
        <path d="M5 21l4-9 3 3 3-3 4 9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 12l3-6 3 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Phòng gym & yoga',
    body: 'Trang thiết bị hiện đại nhập khẩu, không gian tập luyện thoáng đãng với view xanh mát bao quanh.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 12h16" strokeLinecap="round" />
        <path d="M6 8v8M18 8v8" strokeLinecap="round" />
        <path d="M2 10v4M22 10v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Công viên cây xanh',
    body: 'Mảng xanh trải dài quanh khuôn viên, đường dạo bộ và ghế nghỉ chân giữa thiên nhiên trong lành.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 22V13" strokeLinecap="round" />
        <path d="M12 13a5 5 0 0 0 5-5c0-1-3-6-5-6s-5 5-5 6a5 5 0 0 0 5 5Z" strokeLinejoin="round" />
        <path d="M8 22h8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Nhà cộng đồng',
    body: 'Sảnh sinh hoạt chung đa năng, nơi tổ chức sự kiện, gắn kết cư dân trong không gian ấm cúng.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 11l9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 20v-6h4v6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'An ninh 24/7',
    body: 'Hệ thống camera giám sát và bảo vệ trực gác liên tục, kiểm soát ra vào chặt chẽ theo tiêu chuẩn quốc tế.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Bãi đỗ xe thông minh',
    body: 'Hầm để xe rộng rãi, phân làn rõ ràng cùng hệ thống quản lý ra vào tự động, thuận tiện cho cư dân.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="7" width="18" height="12" rx="1.5" />
        <path d="M8 11h5a2 2 0 0 1 0 4H8v-6Z" strokeLinejoin="round" />
        <path d="M8 15v2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Đường dạo ven sông',
    body: 'Lối đi bộ và đạp xe men theo bờ sông, kết nối cư dân với thiên nhiên ngay trong khuôn viên dự án.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 19c2-3 4-5 9-5s7 2 9 5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="7" r="2.4" />
      </svg>
    ),
  },
];

export default function Amenities() {
  return (
    <main>
      <section className="amenity-showcase">
        <div className="wrap">
          <div className="amenity-media">
            <Reveal className="amenity-media-main amenity-flip">
              <img src={AMENITY_HERO_IMAGE} alt="Hồ bơi vô cực Terra Việt" />
              <h1 className="amenity-media-title">Tiện ích</h1>
            </Reveal>
            <Reveal delay={220} className="amenity-media-secondary amenity-flip">
              <img src={AMENITY_INSET_IMAGE} alt="Không gian tiện ích nghỉ dưỡng Terra Việt" />
            </Reveal>
            <span className="amenity-watermark" aria-hidden="true">
              Lifestyle
            </span>
          </div>
          <div className="amenity-showcase-foot">
            <p>
              Bằng tinh thần trẻ trung, phóng khoáng kết hợp cùng tư duy hiện đại, Terra Việt khéo léo định hình những
              phong cách sống mới dựa trên các đặc quyền tiện ích được thiết kế theo mô hình{' '}
              <strong>"Live - Work - Learn - Play"</strong>, đáp ứng đầy đủ nhu cầu "Sống - Làm việc - Học tập - Giải
              trí" của từng thành viên trong gia đình.
            </p>
            <a href="#amenities-grid" className="cta-btn ghost">
              Xem thêm →
            </a>
          </div>
        </div>
      </section>

      <section className="wrap" id="amenities-grid">
        <div className="sec-head">
          <div>
            <div className="eyebrow">Đặc quyền cư dân</div>
            <h2>Mọi tiện ích trong tầm tay</h2>
          </div>
          <p>Hệ thống tiện ích nội khu được đầu tư đồng bộ, phục vụ mọi nhu cầu sinh hoạt hằng ngày của cư dân.</p>
        </div>
        <div className="amenities-grid">
          {AMENITIES.map((a, i) => (
            <Reveal key={a.title} delay={i * 60}>
              <div className="amenity-card blueprint">
                <div className="ic">{a.icon}</div>
                <h3>{a.title}</h3>
                <p>{a.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
