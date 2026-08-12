/**
 * Ảnh nền thật. Phần lớn lấy từ Unsplash (Unsplash License — miễn phí sử dụng thương mại,
 * không cần ghi nguồn); ảnh hero chính là ảnh dự án thật (render) đặt tại src/assets.
 * Có thể thay bằng ảnh dự án thật khác khi có sẵn — chỉ cần đổi URL/import.
 */
import heroRiverside from '../assets/hero-1.png';
import missionSkyline from '../assets/sứ-mệnh.png';
import vinLogo from '../assets/vin-logo.png';
import vcbLogo from '../assets/vcb-logo.png';
import namLongLogo from '../assets/nam-long-logo.png';
import hadoLogo from '../assets/hado-logo.png';
import keppelLandLogo from '../assets/keppelLand-logo.png';

// Cụm tháp đôi ven sông, cầu bắc ngang lúc hoàng hôn — ảnh render dự án, dùng chung cho hero
// Trang chủ / Giới thiệu / Dự án / Liên hệ / Tuyển dụng / Tin tức
export const HERO_IMAGE = heroRiverside;

export const PAGE_HERO_IMAGE = heroRiverside;

// Hồ bơi vô cực nhìn từ trên cao, resort ven biển — dùng cho banner hero trang Giới thiệu
export const ABOUT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=2400&q=80';

// Hồ bơi vô cực nhìn từ trên cao, resort ven biển — dùng cho banner trang Tiện ích
export const AMENITY_HERO_IMAGE =
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=2400&q=80';

// Khu hồ bơi lúc hoàng hôn — ảnh lồng góc dưới của banner Tiện ích
export const AMENITY_INSET_IMAGE =
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1000&q=80';

// Toà nhà kính hiện đại, khung ngang — ảnh tin nổi bật đầu trang Tin tức.
// Cắt cứng theo tỉ lệ ngang (w/h) để không bao giờ bị lệch dọc dù ảnh gốc là ảnh đứng.
export const NEWS_FEATURED_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&h=1000&q=80';

// Skyline ven sông lúc hoàng hôn — ảnh render dự án, nền cho slide Sứ mệnh (trang Giới thiệu)
export const ABOUT_MISSION_IMAGE = missionSkyline;

// Toà tháp kính vươn cao giữa bầu trời — minh hoạ slide Tầm nhìn (trang Giới thiệu)
export const ABOUT_VISION_IMAGE =
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80';

// Công trường, cần cẩu xây dựng — minh hoạ slide Định hướng phát triển (trang Giới thiệu)
export const ABOUT_DIRECTION_IMAGE =
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80';

// Đội ngũ họp bàn, hợp tác — minh hoạ slide Giá trị cốt lõi (trang Giới thiệu)
export const ABOUT_VALUES_IMAGE =
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80';

// Logo đối tác — dùng cho dải logo chạy ở slide "Đối tác của chúng tôi" (trang Giới thiệu)
export const PARTNER_LOGOS = [
  { name: 'Vingroup', src: vinLogo },
  { name: 'Vietcombank', src: vcbLogo },
  { name: 'Nam Long', src: namLongLogo },
  { name: 'Hà Đô Group', src: hadoLogo },
  { name: 'Keppel Land', src: keppelLandLogo },
];
