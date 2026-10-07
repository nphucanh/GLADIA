/**
 * Ảnh nền thật — chỉ dùng ảnh local trong src/assets (không còn gọi ảnh ngoài từ Unsplash,
 * tránh phụ thuộc mạng). Assets hiện chỉ có 3 ảnh nội dung nên một số vị trí phải dùng lại
 * chung ảnh; thay bằng ảnh dự án thật khác khi có sẵn — chỉ cần đổi import bên dưới.
 */
import { BuildingType } from '../types';
import heroRiverside from '../assets/hero-1.png';
import missionSkyline from '../assets/sứ-mệnh.png';
import poolAerial from '../assets/swim-pool.png';
import townView from '../assets/house-1/view-town.png';
import penthouseView from '../assets/house-1/view-penthouse.png';
import villaBalcony from '../assets/house-2/ban_cong.png';
import villaDining from '../assets/house-2/phong_bep_va_an.png';
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

// Ảnh thẻ tiện ích "điểm nhấn" (thẻ lớn đầu tiên mục Tiện ích — ProjectDetailSections.tsx), khớp
// với tiện ích đầu tiên của từng loại hình trong projectDetails.ts: hồ bơi (căn hộ, biệt thự),
// viễn cảnh đô thị xanh (đất nền), phố thương mại lên đèn (shophouse).
export const AMENITY_FEATURE_IMAGE_BY_BUILDING: Record<BuildingType, string> = {
  apartment: poolAerial,
  villa: poolAerial,
  land: missionSkyline,
  shophouse: townView,
};

// Ảnh cho từng tiện ích (mục Tiện ích — bấm một mục thì khung ảnh bên cạnh đổi theo), tra theo
// tên tiện ích trong projectDetails.ts. Kho ảnh hiện chỉ có ít ảnh nên ghép ảnh gần nghĩa nhất
// và một số tiện ích dùng chung ảnh — có ảnh thật của tiện ích nào thì chỉ cần import và đổi
// dòng tương ứng. Tiện ích không có trong bảng sẽ dùng ảnh điểm nhấn của loại hình.
export const AMENITY_PHOTO_BY_TITLE: Record<string, string> = {
  'Hồ bơi vô cực': poolAerial,
  'Hồ bơi tràn bờ': poolAerial,
  'Gym & Yoga': villaBalcony,
  'Sky Lounge': penthouseView,
  Clubhouse: penthouseView,
  'Công viên nội khu': missionSkyline,
  'Công viên ven sông': missionSkyline,
  'Công viên trung tâm': missionSkyline,
  'Công viên cảnh quan': missionSkyline,
  'Sân tennis & golf mini': missionSkyline,
  'Khu thể thao': missionSkyline,
  'Khu vui chơi trẻ em': heroRiverside,
  'Đường dạo bộ': heroRiverside,
  'Phố đi bộ cuối tuần': heroRiverside,
  'Bến du thuyền': heroRiverside,
  'Đường nội khu 16–24m': heroRiverside,
  'Quảng trường sự kiện': heroRiverside,
  'An ninh 24/7': heroRiverside,
  'An ninh nhiều lớp': heroRiverside,
  'Hạ tầng hoàn thiện': heroRiverside,
  'Trung tâm thương mại': townView,
  'Phố thương mại': townView,
  'Chợ & siêu thị': townView,
  'Hầm xe thông minh': townView,
  'Bãi đỗ xe rộng': townView,
  'Trường mầm non': townView,
  'Trường học các cấp': townView,
  'Nhà văn hoá': townView,
  'Trạm y tế': townView,
  'Ẩm thực & cà phê': villaDining,
  'Food court': villaDining,
};

// Logo đối tác — dùng cho dải logo chạy ở slide "Đối tác của chúng tôi" (trang Giới thiệu)
export const PARTNER_LOGOS = [
  { name: 'Vingroup', src: vinLogo },
  { name: 'Vietcombank', src: vcbLogo },
  { name: 'Nam Long', src: namLongLogo },
  { name: 'Hà Đô Group', src: hadoLogo },
  { name: 'Keppel Land', src: keppelLandLogo },
];
