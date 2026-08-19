/**
 * Ảnh nền thật — chỉ dùng ảnh local trong src/assets (không còn gọi ảnh ngoài từ Unsplash,
 * tránh phụ thuộc mạng). Assets hiện chỉ có 3 ảnh nội dung nên một số vị trí phải dùng lại
 * chung ảnh; thay bằng ảnh dự án thật khác khi có sẵn — chỉ cần đổi import bên dưới.
 */
import { BuildingType } from '../types';
import heroRiverside from '../assets/hero-1.png';
import missionSkyline from '../assets/sứ-mệnh.png';
import poolAerial from '../assets/swim-pool.png';
import vinLogo from '../assets/logo/vin-logo.png';
import vcbLogo from '../assets/logo/vcb-logo.png';
import namLongLogo from '../assets/logo/nam-long-logo.png';
import hadoLogo from '../assets/logo/hado-logo.png';
import keppelLandLogo from '../assets/logo/keppelLand-logo.png';

// Cụm tháp đôi ven sông, cầu bắc ngang lúc hoàng hôn — ảnh render dự án, dùng chung cho hero
// Trang chủ / Giới thiệu / Dự án / Liên hệ / Tuyển dụng / Tin tức
export const HERO_IMAGE = heroRiverside;

export const PAGE_HERO_IMAGE = heroRiverside;

// Hồ bơi vô cực nhìn từ trên cao — ảnh thật duy nhất có sẵn cho các banner tiện ích/nghỉ dưỡng,
// dùng lại cho cả banner hero trang Giới thiệu và banner + ảnh lồng góc dưới trang Tiện ích.
export const ABOUT_HERO_IMAGE = poolAerial;
export const AMENITY_HERO_IMAGE = poolAerial;
export const AMENITY_INSET_IMAGE = poolAerial;

// Toà tháp ven sông — dùng lại ảnh hero cho các vị trí cần ảnh toà nhà/công trình dự án.
export const NEWS_FEATURED_IMAGE = heroRiverside;
export const ABOUT_VISION_IMAGE = heroRiverside;

// Skyline ven sông lúc hoàng hôn — ảnh render dự án, dùng cho các slide còn lại của trang
// Giới thiệu (Sứ mệnh, Định hướng phát triển, Giá trị cốt lõi).
export const ABOUT_MISSION_IMAGE = missionSkyline;
export const ABOUT_DIRECTION_IMAGE = missionSkyline;
export const ABOUT_VALUES_IMAGE = missionSkyline;

// Ảnh thẻ dự án + ảnh bìa trang chi tiết dự án (Projects.tsx/ProjectDetail.tsx), thay cho minh
// hoạ SVG toà nhà trước đây — ghép theo loại hình sao khớp thị giác nhất trong 3 ảnh có sẵn:
// biệt thự dùng ảnh hồ bơi (không gian nghỉ dưỡng), đất nền dùng ảnh skyline (viễn cảnh phát
// triển), căn hộ/shophouse dùng ảnh toà tháp.
export const PROJECT_IMAGE_BY_BUILDING: Record<BuildingType, string> = {
  apartment: heroRiverside,
  shophouse: heroRiverside,
  villa: poolAerial,
  land: missionSkyline,
};

// Logo đối tác — dùng cho dải logo chạy ở slide "Đối tác của chúng tôi" (trang Giới thiệu)
export const PARTNER_LOGOS = [
  { name: 'Vingroup', src: vinLogo },
  { name: 'Vietcombank', src: vcbLogo },
  { name: 'Nam Long', src: namLongLogo },
  { name: 'Hà Đô Group', src: hadoLogo },
  { name: 'Keppel Land', src: keppelLandLogo },
];
