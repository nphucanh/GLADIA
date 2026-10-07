import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Bike,
  BookOpen,
  Car,
  Coffee,
  Dumbbell,
  Footprints,
  GraduationCap,
  HeartPulse,
  Hospital,
  Landmark,
  Plane,
  Route,
  Sailboat,
  School,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  TrainFront,
  Trees,
  Trophy,
  Utensils,
  Waves,
  Wine,
} from 'lucide-react';
import type { BuildingType, Project } from '../types';
import { AMENITY_FEATURE_IMAGE_BY_BUILDING, AMENITY_PHOTO_BY_TITLE } from './images';
import { PROJECT_ROUTES, type ProjectRoute } from './projectRoutes';

/* =========================================================
   Nội dung mở rộng cho trang chi tiết dự án: "Vị trí đắc địa", "Tiện ích", "Mặt bằng".
   Dữ liệu mẫu sinh theo tỉnh/thành (vị trí) và loại hình (tiện ích, mặt bằng) để mọi dự án
   đều có đủ nội dung mà không phải khai báo tay từng dự án trong mockProjects.ts.
   ========================================================= */

// ---------- Vị trí đắc địa ----------

export interface LocationConnection {
  icon: LucideIcon;
  place: string;
  minutes: number;
  km?: number;
  mapsUrl?: string; // chỉ đường trên Google Maps (dự án → điểm đến)
  route?: ProjectRoute; // tuyến lái xe thật (OSRM) — vẽ trên bản đồ
}

export interface LocationHighlight {
  intro: string;
  connections: LocationConnection[];
  origin?: [number, number]; // [lat, lng] toạ độ dự án (khi có dữ liệu tuyến thật)
}

const LOCATION_BY_PROVINCE: Record<string, LocationHighlight> = {
  'TP.HCM': {
    intro:
      'Toạ lạc tại khu vực trung tâm mở rộng của TP.HCM, dự án nằm trên trục giao thông huyết mạch, kết nối nhanh tới Quận 1, khu đô thị Thủ Thiêm và sân bay Tân Sơn Nhất — vừa thuận tiện di chuyển, vừa thừa hưởng trọn vẹn hệ tiện ích ngoại khu đã hoàn thiện.',
    connections: [
      { icon: TrainFront, place: 'Ga Metro số 1', minutes: 5 },
      { icon: Landmark, place: 'Trung tâm Quận 1', minutes: 10 },
      { icon: Route, place: 'Khu đô thị Thủ Thiêm', minutes: 12 },
      { icon: GraduationCap, place: 'Trường quốc tế', minutes: 8 },
      { icon: Hospital, place: 'Bệnh viện quốc tế FV', minutes: 10 },
      { icon: Plane, place: 'Sân bay Tân Sơn Nhất', minutes: 20 },
    ],
  },
  'Bình Dương': {
    intro:
      'Nằm ngay cửa ngõ thành phố Thủ Dầu Một, dự án tiếp giáp Quốc lộ 13 và đường Vành đai 3, kết nối thuận tiện tới các khu công nghiệp lớn, làng đại học và trung tâm TP.HCM — điểm đến lý tưởng để an cư lẫn đầu tư cho thuê.',
    connections: [
      { icon: Route, place: 'Quốc lộ 13', minutes: 3 },
      { icon: ShoppingBag, place: 'AEON Mall Bình Dương', minutes: 7 },
      { icon: Landmark, place: 'Trung tâm TP. Thủ Dầu Một', minutes: 10 },
      { icon: Store, place: 'KCN VSIP', minutes: 10 },
      { icon: GraduationCap, place: 'Làng Đại học Quốc gia', minutes: 15 },
      { icon: Car, place: 'Trung tâm TP.HCM', minutes: 30 },
    ],
  },
  'Đồng Nai': {
    intro:
      'Đón đầu hạ tầng trọng điểm phía Đông, dự án nằm gần cao tốc TP.HCM – Long Thành – Dầu Giây và sân bay quốc tế Long Thành, thừa hưởng đà tăng trưởng mạnh mẽ của vùng kinh tế công nghiệp Đồng Nai.',
    connections: [
      { icon: Route, place: 'Cao tốc TP.HCM – Long Thành – Dầu Giây', minutes: 5 },
      { icon: Store, place: 'KCN Amata', minutes: 10 },
      { icon: Landmark, place: 'Trung tâm TP. Biên Hoà', minutes: 15 },
      { icon: Hospital, place: 'Bệnh viện Đa khoa Đồng Nai', minutes: 15 },
      { icon: Plane, place: 'Sân bay quốc tế Long Thành', minutes: 20 },
      { icon: Car, place: 'Trung tâm TP.HCM', minutes: 35 },
    ],
  },
  'Long An': {
    intro:
      'Toạ lạc tại cửa ngõ miền Tây, liền kề cao tốc TP.HCM – Trung Lương, dự án kết nối nhanh về khu Nam Sài Gòn và các khu công nghiệp lân cận — quỹ đất tiềm năng với mức giá còn rất hợp lý.',
    connections: [
      { icon: Route, place: 'Cao tốc TP.HCM – Trung Lương', minutes: 5 },
      { icon: Store, place: 'Khu công nghiệp lân cận', minutes: 10 },
      { icon: ShoppingCart, place: 'Chợ & siêu thị khu vực', minutes: 8 },
      { icon: Landmark, place: 'Trung tâm TP. Tân An', minutes: 15 },
      { icon: School, place: 'Trường liên cấp', minutes: 7 },
      { icon: Car, place: 'Phú Mỹ Hưng (Quận 7)', minutes: 25 },
    ],
  },
  'Đà Nẵng': {
    intro:
      'Tọa lạc tại cung đường biển đẹp nhất Đà Nẵng, dự án sở hữu tầm nhìn trực diện biển Mỹ Khê, chỉ vài phút tới trung tâm thành phố và sân bay quốc tế — vị trí hiếm có cho cả nghỉ dưỡng và khai thác du lịch.',
    connections: [
      { icon: Waves, place: 'Biển Mỹ Khê', minutes: 3 },
      { icon: Landmark, place: 'Cầu Rồng', minutes: 8 },
      { icon: ShoppingBag, place: 'Chợ Hàn', minutes: 10 },
      { icon: Plane, place: 'Sân bay quốc tế Đà Nẵng', minutes: 10 },
      { icon: Trees, place: 'Bán đảo Sơn Trà', minutes: 15 },
      { icon: Hospital, place: 'Bệnh viện Vinmec Đà Nẵng', minutes: 12 },
    ],
  },
  'Hà Nội': {
    intro:
      'Nằm tại khu vực phát triển năng động phía Tây Hà Nội, dự án liền kề đường Vành đai 3 và tuyến Metro Nhổn – Ga Hà Nội, dễ dàng kết nối tới khu phố cổ, các trung tâm hành chính và thương mại lớn của Thủ đô.',
    connections: [
      { icon: TrainFront, place: 'Metro Nhổn – Ga Hà Nội', minutes: 7 },
      { icon: Route, place: 'Đường Vành đai 3', minutes: 5 },
      { icon: ShoppingBag, place: 'Trung tâm thương mại lớn', minutes: 10 },
      { icon: GraduationCap, place: 'Cụm trường đại học', minutes: 10 },
      { icon: Landmark, place: 'Hồ Hoàn Kiếm', minutes: 15 },
      { icon: Plane, place: 'Sân bay Nội Bài', minutes: 30 },
    ],
  },
};

const DEFAULT_LOCATION: LocationHighlight = {
  intro:
    'Dự án sở hữu vị trí kết nối thuận tiện tới trung tâm hành chính, thương mại và các trục giao thông chính của khu vực.',
  connections: [
    { icon: Route, place: 'Trục giao thông chính', minutes: 5 },
    { icon: Landmark, place: 'Trung tâm hành chính', minutes: 10 },
    { icon: ShoppingBag, place: 'Trung tâm thương mại', minutes: 10 },
    { icon: Hospital, place: 'Bệnh viện', minutes: 12 },
  ],
};

/** Thông tin vị trí của dự án. Khi dự án có dữ liệu tuyến thật (projectRoutes.ts — sinh từ
 *  OSRM/OpenStreetMap) thì tên điểm đến, số phút, số km lấy theo tuyến thật và kèm link chỉ
 *  đường Google Maps; icon giữ theo thứ tự danh sách của tỉnh/thành. */
export function getLocationHighlight(project: Project): LocationHighlight {
  const base = LOCATION_BY_PROVINCE[project.location] ?? DEFAULT_LOCATION;
  const real = PROJECT_ROUTES[String(project.id)];
  if (!real) return base;
  const [olat, olng] = real.origin;
  return {
    intro: base.intro,
    origin: real.origin,
    connections: real.routes.map((r, i) => ({
      icon: base.connections[i]?.icon ?? Route,
      place: r.place,
      minutes: r.minutes,
      km: r.km,
      mapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${olat},${olng}&destination=${r.dest[0]},${r.dest[1]}&travelmode=driving`,
      route: r,
    })),
  };
}

// ---------- Tiện ích ----------

export type AmenityCategory = 'relax' | 'sport' | 'family' | 'service';

export const AMENITY_CATEGORY_LABEL: Record<AmenityCategory, string> = {
  relax: 'Thư giãn',
  sport: 'Thể thao',
  family: 'Gia đình',
  service: 'Tiện nghi & an ninh',
};

export interface Amenity {
  icon: LucideIcon;
  title: string;
  description: string;
  category: AmenityCategory;
}

const AMENITIES_BY_BUILDING: Record<BuildingType, Amenity[]> = {
  // Phần tử đầu tiên mỗi loại là tiện ích "điểm nhấn" — hiển thị thẻ lớn kèm ảnh thật
  apartment: [
    { icon: Waves, category: 'relax', title: 'Hồ bơi vô cực', description: 'Hồ bơi tràn bờ trên tầng mái, ngắm trọn đường chân trời thành phố từ độ cao hơn 100m.' },
    { icon: Dumbbell, category: 'sport', title: 'Gym & Yoga', description: 'Phòng tập trang bị hiện đại, studio yoga ngập ánh sáng tự nhiên.' },
    { icon: Trees, category: 'relax', title: 'Công viên nội khu', description: 'Hơn 40% diện tích dành cho cây xanh, đường dạo bộ và vườn thiền.' },
    { icon: Baby, category: 'family', title: 'Khu vui chơi trẻ em', description: 'Sân chơi an toàn trong nhà và ngoài trời cho mọi lứa tuổi.' },
    { icon: Wine, category: 'relax', title: 'Sky Lounge', description: 'Không gian thư giãn, tiếp khách sang trọng trên cao.' },
    { icon: ShoppingBag, category: 'service', title: 'Trung tâm thương mại', description: 'Khối đế thương mại với siêu thị, cà phê, nhà hàng ngay dưới chân nhà.' },
    { icon: ShieldCheck, category: 'service', title: 'An ninh 24/7', description: 'Kiểm soát ra vào bằng thẻ từ, camera giám sát toàn khu.' },
    { icon: Car, category: 'service', title: 'Hầm xe thông minh', description: '2 tầng hầm rộng rãi, hệ thống quản lý bãi xe tự động.' },
  ],
  villa: [
    { icon: Waves, category: 'relax', title: 'Hồ bơi tràn bờ', description: 'Hồ bơi phong cách resort bao quanh bởi cảnh quan nhiệt đới, riêng tư cho cư dân.' },
    { icon: Landmark, category: 'relax', title: 'Clubhouse', description: 'Câu lạc bộ cư dân với nhà hàng, bar và phòng sự kiện riêng tư.' },
    { icon: Trophy, category: 'sport', title: 'Sân tennis & golf mini', description: 'Tổ hợp thể thao ngoài trời đạt chuẩn thi đấu.' },
    { icon: Trees, category: 'relax', title: 'Công viên ven sông', description: 'Dải công viên xanh mát chạy dọc bờ sông nội khu.' },
    { icon: Footprints, category: 'sport', title: 'Đường dạo bộ', description: 'Hơn 3km đường dạo bộ, chạy bộ rợp bóng cây.' },
    { icon: School, category: 'family', title: 'Trường mầm non', description: 'Trường mầm non chuẩn quốc tế ngay trong khu dân cư.' },
    { icon: ShieldCheck, category: 'service', title: 'An ninh nhiều lớp', description: 'Cổng kiểm soát, tuần tra 24/7 và camera AI nhận diện.' },
    { icon: Sailboat, category: 'relax', title: 'Bến du thuyền', description: 'Bến thuyền riêng cho cư dân, kết nối giao thông đường thuỷ.' },
  ],
  land: [
    { icon: Trees, category: 'relax', title: 'Công viên trung tâm', description: 'Công viên cảnh quan rộng hơn 2ha giữa lòng khu đô thị, lá phổi xanh cho cả cộng đồng.' },
    { icon: School, category: 'family', title: 'Trường học các cấp', description: 'Quỹ đất giáo dục từ mầm non đến trung học cơ sở.' },
    { icon: ShoppingCart, category: 'service', title: 'Chợ & siêu thị', description: 'Khu thương mại dịch vụ phục vụ nhu cầu thiết yếu hằng ngày.' },
    { icon: BookOpen, category: 'family', title: 'Nhà văn hoá', description: 'Không gian sinh hoạt cộng đồng, thư viện và lớp năng khiếu.' },
    { icon: Route, category: 'service', title: 'Đường nội khu 16–24m', description: 'Hệ thống giao thông nội khu rộng, vỉa hè thoáng đãng.' },
    { icon: Bike, category: 'sport', title: 'Khu thể thao', description: 'Sân bóng đá, bóng rổ và đường chạy bộ, đạp xe.' },
    { icon: HeartPulse, category: 'family', title: 'Trạm y tế', description: 'Trạm y tế khu vực, phòng khám đa khoa lân cận.' },
    { icon: ShieldCheck, category: 'service', title: 'Hạ tầng hoàn thiện', description: 'Điện âm, cấp thoát nước, cáp quang đồng bộ đến từng lô.' },
  ],
  shophouse: [
    { icon: Store, category: 'service', title: 'Phố thương mại', description: 'Tuyến phố kinh doanh sầm uất với mặt tiền rộng, vỉa hè lớn, đón dòng khách mỗi ngày.' },
    { icon: Footprints, category: 'relax', title: 'Phố đi bộ cuối tuần', description: 'Phố đi bộ thu hút lưu lượng khách lớn vào dịp cuối tuần.' },
    { icon: Landmark, category: 'family', title: 'Quảng trường sự kiện', description: 'Quảng trường trung tâm tổ chức lễ hội, hội chợ định kỳ.' },
    { icon: Coffee, category: 'relax', title: 'Ẩm thực & cà phê', description: 'Chuỗi nhà hàng, cà phê thương hiệu tạo dòng khách ổn định.' },
    { icon: Utensils, category: 'family', title: 'Food court', description: 'Khu ẩm thực tập trung phục vụ cư dân và khách vãng lai.' },
    { icon: Car, category: 'service', title: 'Bãi đỗ xe rộng', description: 'Bãi đỗ xe công cộng thuận tiện cho khách mua sắm.' },
    { icon: Trees, category: 'relax', title: 'Công viên cảnh quan', description: 'Dải cây xanh, tiểu cảnh nước dọc tuyến phố.' },
    { icon: ShieldCheck, category: 'service', title: 'An ninh 24/7', description: 'Hệ thống camera và bảo vệ tuần tra toàn khu.' },
  ],
};

export interface AmenityStat {
  value: string;
  label: string;
}

/** Số liệu nổi bật trên dải thống kê của mục Tiện ích. */
const AMENITY_STATS_BY_BUILDING: Record<BuildingType, AmenityStat[]> = {
  apartment: [
    { value: '40%', label: 'diện tích cây xanh' },
    { value: '100m', label: 'hồ bơi tầng mái' },
    { value: '24/7', label: 'an ninh thẻ từ' },
  ],
  villa: [
    { value: '3km', label: 'đường dạo ven sông' },
    { value: '72%', label: 'không gian mở' },
    { value: '24/7', label: 'an ninh nhiều lớp' },
  ],
  land: [
    { value: '2ha', label: 'công viên trung tâm' },
    { value: '24m', label: 'đường nội khu' },
    { value: '100%', label: 'hạ tầng hoàn thiện' },
  ],
  shophouse: [
    { value: '7/7', label: 'phố thương mại sôi động' },
    { value: '30+', label: 'thương hiệu F&B' },
    { value: '24/7', label: 'an ninh toàn khu' },
  ],
};

/** Tiện ích kèm ảnh minh hoạ (hiện trong khung ảnh khi chọn mục). */
export interface AmenityWithPhoto extends Amenity {
  photo: string;
}

export interface AmenityShowcase {
  amenities: AmenityWithPhoto[];
  stats: AmenityStat[];
  /** Tổng số hạng mục tiện ích (lấy từ thông tin tổng quan nếu có), vd "32+". */
  total: string;
  /** Đoạn giới thiệu chứa tên dự án + khu vực + tiện ích chính (từ khoá SEO). */
  intro: string;
  featureImage: string;
}

export function getAmenities(project: Project): AmenityShowcase {
  const featureImage = AMENITY_FEATURE_IMAGE_BY_BUILDING[project.building];
  const amenities = AMENITIES_BY_BUILDING[project.building].map((a) => ({
    ...a,
    photo: AMENITY_PHOTO_BY_TITLE[a.title] ?? featureImage,
  }));
  const total = project.overview?.amenities.match(/\d+\+?/)?.[0] ?? `${amenities.length}+`;
  const names = amenities.map((a) => a.title.toLowerCase());
  const intro =
    `${project.name} sở hữu ${total} hạng mục tiện ích nội khu tại ${project.location} — từ ` +
    `${names.slice(0, 3).join(', ')} đến ${names[names.length - 1]}, đáp ứng trọn vẹn nhu cầu nghỉ ngơi, ` +
    'rèn luyện sức khoẻ và kết nối cộng đồng của cư dân ngay trong khuôn viên dự án.';
  return {
    amenities,
    stats: AMENITY_STATS_BY_BUILDING[project.building],
    total,
    intro,
    featureImage,
  };
}

// ---------- Mặt bằng ----------

// Loại phòng quyết định màu nền + ký hiệu nội thất trên bản vẽ (FloorPlanDrawing.tsx).
export type RoomKind = 'living' | 'bed' | 'kitchen' | 'wc' | 'outdoor' | 'garage' | 'stair' | 'shop' | 'storage';

export interface FloorPlanRoom {
  label: string;
  kind: RoomKind;
  // Toạ độ và kích thước tính theo mét, gốc ở góc trên-trái mặt bằng.
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FloorPlan {
  id: string;
  name: string; // tên tab, vd "2 phòng ngủ"
  code: string; // mã căn / tầng, vd "B2"
  area: number; // m²
  bedrooms?: number;
  bathrooms?: number;
  note: string;
  width: number; // m
  depth: number; // m
  rooms: FloorPlanRoom[];
}

export interface FloorPlanSet {
  title: string;
  intro: string;
  plans: FloorPlan[];
}

const PLANS_BY_BUILDING: Record<BuildingType, FloorPlanSet> = {
  apartment: {
    title: 'Mặt bằng căn hộ',
    intro:
      'Các loại căn hộ được thiết kế tối ưu công năng, không gian sinh hoạt chung liền mạch, mọi phòng ngủ đều đón ánh sáng và gió tự nhiên.',
    plans: [
      {
        id: 'a1',
        name: '1 phòng ngủ',
        code: 'A1',
        area: 52,
        bedrooms: 1,
        bathrooms: 1,
        note: 'Căn hộ nhỏ gọn cho người trẻ độc thân hoặc vợ chồng mới cưới, phù hợp cho thuê.',
        width: 8,
        depth: 6.5,
        rooms: [
          { label: 'Bếp', kind: 'kitchen', x: 0, y: 0, w: 3, h: 2.5 },
          { label: 'WC', kind: 'wc', x: 3, y: 0, w: 2, h: 2.5 },
          { label: 'Phòng ngủ', kind: 'bed', x: 5, y: 0, w: 3, h: 4.5 },
          { label: 'Phòng khách', kind: 'living', x: 0, y: 2.5, w: 5, h: 4 },
          { label: 'Ban công', kind: 'outdoor', x: 5, y: 4.5, w: 3, h: 2 },
        ],
      },
      {
        id: 'b2',
        name: '2 phòng ngủ',
        code: 'B2',
        area: 75,
        bedrooms: 2,
        bathrooms: 2,
        note: 'Lựa chọn phổ biến nhất cho gia đình trẻ, phòng ngủ master có WC riêng.',
        width: 10,
        depth: 7.5,
        rooms: [
          { label: 'Bếp', kind: 'kitchen', x: 0, y: 0, w: 3, h: 3.5 },
          { label: 'WC', kind: 'wc', x: 3, y: 0, w: 2, h: 3.5 },
          { label: 'Phòng ngủ master', kind: 'bed', x: 5, y: 0, w: 5, h: 3.5 },
          { label: 'Phòng khách', kind: 'living', x: 0, y: 3.5, w: 6, h: 4 },
          { label: 'Phòng ngủ 2', kind: 'bed', x: 6, y: 3.5, w: 4, h: 3 },
          { label: 'Ban công', kind: 'outdoor', x: 6, y: 6.5, w: 4, h: 1 },
        ],
      },
      {
        id: 'c3',
        name: '3 phòng ngủ',
        code: 'C3',
        area: 96,
        bedrooms: 3,
        bathrooms: 2,
        note: 'Căn góc 2 mặt thoáng cho gia đình nhiều thế hệ, lô gia rộng để giặt phơi.',
        width: 12,
        depth: 8,
        rooms: [
          { label: 'Phòng ngủ 2', kind: 'bed', x: 0, y: 0, w: 3.5, h: 3.5 },
          { label: 'WC', kind: 'wc', x: 3.5, y: 0, w: 2, h: 3.5 },
          { label: 'Bếp', kind: 'kitchen', x: 5.5, y: 0, w: 3, h: 3.5 },
          { label: 'Phòng ngủ 3', kind: 'bed', x: 8.5, y: 0, w: 3.5, h: 3.5 },
          { label: 'Phòng khách', kind: 'living', x: 0, y: 3.5, w: 6.5, h: 4.5 },
          { label: 'Phòng ngủ master', kind: 'bed', x: 6.5, y: 3.5, w: 4, h: 4.5 },
          { label: 'WC', kind: 'wc', x: 10.5, y: 3.5, w: 1.5, h: 2.5 },
          { label: 'Lô gia', kind: 'outdoor', x: 10.5, y: 6, w: 1.5, h: 2 },
        ],
      },
    ],
  },
  villa: {
    title: 'Mặt bằng biệt thự',
    intro:
      'Biệt thự song lập trên lô đất 12 × 15m, tầng 1 dành cho sinh hoạt chung và tiếp khách, tầng 2 là không gian nghỉ ngơi riêng tư của gia đình.',
    plans: [
      {
        id: 't1',
        name: 'Tầng 1',
        code: 'T1',
        area: 180,
        bedrooms: 1,
        bathrooms: 1,
        note: 'Gara ô tô, phòng khách thông tầng, bếp mở ra sân vườn phía sau.',
        width: 12,
        depth: 15,
        rooms: [
          { label: 'Gara', kind: 'garage', x: 0, y: 0, w: 4, h: 6 },
          { label: 'Phòng khách', kind: 'living', x: 4, y: 0, w: 8, h: 7 },
          { label: 'Phòng ngủ khách', kind: 'bed', x: 0, y: 6, w: 4, h: 5 },
          { label: 'Bếp & ăn', kind: 'kitchen', x: 4, y: 7, w: 8, h: 5 },
          { label: 'WC', kind: 'wc', x: 0, y: 11, w: 4, h: 2 },
          { label: 'Kho', kind: 'storage', x: 0, y: 13, w: 4, h: 2 },
          { label: 'Sân vườn', kind: 'outdoor', x: 4, y: 12, w: 8, h: 3 },
        ],
      },
      {
        id: 't2',
        name: 'Tầng 2',
        code: 'T2',
        area: 180,
        bedrooms: 3,
        bathrooms: 2,
        note: 'Phòng ngủ master kèm phòng thay đồ và WC riêng, sảnh sinh hoạt chung cho gia đình.',
        width: 12,
        depth: 15,
        rooms: [
          { label: 'Phòng ngủ master', kind: 'bed', x: 0, y: 0, w: 7, h: 6 },
          { label: 'WC master', kind: 'wc', x: 7, y: 0, w: 5, h: 3 },
          { label: 'Phòng thay đồ', kind: 'storage', x: 7, y: 3, w: 5, h: 3 },
          { label: 'Sảnh sinh hoạt', kind: 'living', x: 0, y: 6, w: 5, h: 5 },
          { label: 'Phòng ngủ 2', kind: 'bed', x: 5, y: 6, w: 7, h: 5 },
          { label: 'Phòng ngủ 3', kind: 'bed', x: 0, y: 11, w: 6, h: 4 },
          { label: 'WC', kind: 'wc', x: 6, y: 11, w: 3, h: 4 },
          { label: 'Ban công', kind: 'outdoor', x: 9, y: 11, w: 3, h: 4 },
        ],
      },
    ],
  },
  land: {
    title: 'Mặt bằng nhà phố gợi ý',
    intro:
      'Lô đất tiêu chuẩn 5 × 20m. Dưới đây là phương án thiết kế nhà phố 2 tầng gợi ý từ đội ngũ kiến trúc sư của Terra, giúp khách hàng hình dung công năng khi xây dựng.',
    plans: [
      {
        id: 'l1',
        name: 'Tầng trệt',
        code: 'L1',
        area: 100,
        bathrooms: 1,
        note: 'Sân trước để xe, phòng khách rộng, giếng trời lấy sáng giữa nhà.',
        width: 5,
        depth: 20,
        rooms: [
          { label: 'Sân trước', kind: 'outdoor', x: 0, y: 0, w: 5, h: 3 },
          { label: 'Phòng khách', kind: 'living', x: 0, y: 3, w: 5, h: 6 },
          { label: 'Thang', kind: 'stair', x: 0, y: 9, w: 2, h: 3 },
          { label: 'WC', kind: 'wc', x: 2, y: 9, w: 3, h: 2 },
          { label: 'Giếng trời', kind: 'outdoor', x: 2, y: 11, w: 3, h: 1 },
          { label: 'Bếp & ăn', kind: 'kitchen', x: 0, y: 12, w: 5, h: 6 },
          { label: 'Sân sau', kind: 'outdoor', x: 0, y: 18, w: 5, h: 2 },
        ],
      },
      {
        id: 'l2',
        name: 'Tầng 1',
        code: 'L2',
        area: 100,
        bedrooms: 2,
        bathrooms: 1,
        note: 'Hai phòng ngủ trước – sau đều có cửa sổ lớn, sân phơi riêng phía sau.',
        width: 5,
        depth: 20,
        rooms: [
          { label: 'Ban công', kind: 'outdoor', x: 0, y: 0, w: 5, h: 2 },
          { label: 'Phòng ngủ 1', kind: 'bed', x: 0, y: 2, w: 5, h: 6 },
          { label: 'Thang', kind: 'stair', x: 0, y: 8, w: 2, h: 3 },
          { label: 'WC', kind: 'wc', x: 2, y: 8, w: 3, h: 3 },
          { label: 'Phòng ngủ 2', kind: 'bed', x: 0, y: 11, w: 5, h: 6 },
          { label: 'Sân phơi', kind: 'outdoor', x: 0, y: 17, w: 5, h: 3 },
        ],
      },
    ],
  },
  shophouse: {
    title: 'Mặt bằng shophouse',
    intro:
      'Shophouse 6 × 18m: tầng trệt mặt tiền rộng tối ưu cho kinh doanh, các tầng trên bố trí khép kín để gia đình ở hoặc cho thuê văn phòng.',
    plans: [
      {
        id: 's1',
        name: 'Tầng trệt kinh doanh',
        code: 'S1',
        area: 108,
        bathrooms: 1,
        note: 'Không gian kinh doanh thông thoáng 60m², kho và bếp riêng phía sau.',
        width: 6,
        depth: 18,
        rooms: [
          { label: 'Khu kinh doanh', kind: 'shop', x: 0, y: 0, w: 6, h: 10 },
          { label: 'Kho', kind: 'storage', x: 0, y: 10, w: 3, h: 2 },
          { label: 'WC', kind: 'wc', x: 0, y: 12, w: 3, h: 2 },
          { label: 'Thang', kind: 'stair', x: 3, y: 10, w: 3, h: 4 },
          { label: 'Bếp', kind: 'kitchen', x: 0, y: 14, w: 6, h: 4 },
        ],
      },
      {
        id: 's2',
        name: 'Tầng 2 – 3 ở',
        code: 'S2',
        area: 108,
        bedrooms: 2,
        bathrooms: 1,
        note: 'Phòng khách hướng ra mặt phố, hai phòng ngủ yên tĩnh phía sau.',
        width: 6,
        depth: 18,
        rooms: [
          { label: 'Phòng khách', kind: 'living', x: 0, y: 0, w: 6, h: 6 },
          { label: 'Phòng ngủ 1', kind: 'bed', x: 0, y: 6, w: 6, h: 5 },
          { label: 'WC', kind: 'wc', x: 0, y: 11, w: 3, h: 4 },
          { label: 'Thang', kind: 'stair', x: 3, y: 11, w: 3, h: 4 },
          { label: 'Phòng ngủ 2', kind: 'bed', x: 0, y: 15, w: 6, h: 3 },
        ],
      },
    ],
  },
};

export function getFloorPlans(project: Project): FloorPlanSet {
  return PLANS_BY_BUILDING[project.building];
}
