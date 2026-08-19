import { Project, ProjectGalleryItem } from '../types';
import townView from '../assets/house-1/view-town.png';
import apartmentKitchen from '../assets/house-1/kitchen.png';
import apartmentLivingRoom from '../assets/house-1/living-room.png';
import apartmentBedRoom from '../assets/house-1/bed-room.png';
import apartmentBathRoom from '../assets/house-1/bath-room.png';
import penthouseView from '../assets/house-1/view-penthouse.png';
import villaBalcony from '../assets/house-2/ban_cong.png';
import villaDressingRoom from '../assets/house-2/phong_thay_do.png';
import villaLivingRoom from '../assets/house-2/phong_khach.png';
import villaKitchen from '../assets/house-2/phong_bep_va_an.png';
import villaBedRoom from '../assets/house-2/phong_ngu.png';
import villaBathRoom from '../assets/house-2/phong_tam.png';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Hai bộ ảnh thực tế có sẵn (house-1/house-2) — dùng chung cho Terra Riverside/Terra Hills
// Villa và rải ngẫu nhiên cho các dự án mẫu còn lại để trang chi tiết dự án nào cũng có mục
// "Không gian sống thực tế" thay vì chỉ 2 dự án đầu tiên.
const APARTMENT_GALLERY: ProjectGalleryItem[] = [
  {
    room: 'Toàn cảnh dự án',
    image: townView,
    description:
      'Cụm tháp căn hộ vươn cao bên dòng sông, hệ đèn viền vàng đồng nổi bật giữa hoàng hôn thành phố — điểm nhấn kiến trúc dễ nhận diện của dự án.',
  },
  {
    room: 'Phòng khách',
    image: apartmentLivingRoom,
    description:
      'Không gian sinh hoạt chung mở rộng theo phong cách hiện đại sang trọng, tường ốp đá tự nhiên và cửa kính trần sàn đón trọn tầm nhìn thành phố về đêm.',
  },
  {
    room: 'Bếp & phòng ăn',
    image: apartmentKitchen,
    description:
      'Bếp đảo liền khối với bàn ăn 8 chỗ, tủ bếp cao kịch trần hoàn thiện vân đá sang trọng, tích hợp đầy đủ thiết bị nhập khẩu.',
  },
  {
    room: 'Phòng ngủ chính',
    image: apartmentBedRoom,
    description:
      'Phòng ngủ master rộng rãi với khu thay đồ walk-in closet riêng biệt, ánh sáng ấm và tầm nhìn toàn cảnh thành phố qua vách kính lớn.',
  },
  {
    room: 'Phòng tắm',
    image: apartmentBathRoom,
    description:
      'Phòng tắm master ốp đá marble trọn khối, bồn tắm nằm độc lập và vách kính cường lực ngăn khu vực vòi sen, mang lại trải nghiệm nghỉ dưỡng ngay tại nhà.',
  },
  {
    room: 'Sân vườn trên cao',
    image: penthouseView,
    description:
      'Ban công lounge riêng tư trên tầng cao, không gian lý tưởng để thư giãn buổi tối và ngắm trọn hoàng hôn phủ khắp thành phố.',
  },
];

const VILLA_GALLERY: ProjectGalleryItem[] = [
  {
    room: 'Phòng khách',
    image: villaLivingRoom,
    description:
      'Phòng khách ấm cúng với lò sưởi âm tường, sofa nhung xanh rêu và cửa kính lớn hướng ra sông — không gian tiếp khách sang trọng đậm chất nghỉ dưỡng.',
  },
  {
    room: 'Bếp & phòng ăn',
    image: villaKitchen,
    description:
      'Bếp gỗ tối màu kết hợp bàn đảo đá, khu vực ăn uống rộng cho 10 khách, phù hợp những buổi sum họp gia đình nhiều thế hệ.',
  },
  {
    room: 'Phòng ngủ chính',
    image: villaBedRoom,
    description:
      'Phòng ngủ master tông trầm ấm, đầu giường bọc nhung xanh rêu, cửa kính lớn mở ra ban công riêng nhìn thẳng ra sông.',
  },
  {
    room: 'Phòng thay đồ',
    image: villaDressingRoom,
    description:
      'Không gian walk-in closet biệt lập, hệ tủ gỗ chia ngăn khoa học cùng ánh đèn hắt ấm áp — nơi lưu giữ tủ đồ như một phòng trưng bày riêng.',
  },
  {
    room: 'Phòng tắm',
    image: villaBathRoom,
    description:
      'Phòng tắm phong cách spa với đá tối màu, bồn tắm rời sơn đen nổi bật cùng vách kính khu vực vòi sen tách biệt.',
  },
  {
    room: 'Ban công',
    image: villaBalcony,
    description:
      'Ban công riêng tầng cao với sofa ngoài trời, phóng tầm mắt ra toàn cảnh sông và thành phố lên đèn về đêm.',
  },
];

/** Dữ liệu mẫu — dùng khi chưa cấu hình Supabase hoặc khi bảng "projects" trống */
export const mockProjects: Project[] = [
  {
    id: 1,
    name: 'Terra Riverside',
    type: 'Căn hộ',
    location: 'TP.HCM',
    status: 'Đang mở bán',
    price: 4.2,
    interest: 980,
    popular: 92,
    date: daysAgo(5),
    building: 'apartment',
    gallery: APARTMENT_GALLERY,
    overview: {
      developer: 'Tập đoàn Terra Việt',
      scale: ['Cao 32 tầng, 2 tầng hầm để xe.', 'Gồm 3 tháp: Sông Xanh, Sông Vàng, Sông Bạc.', 'Khối đế 4 tầng thương mại & tiện ích nội khu.'],
      landArea: '15.200 m²',
      buildingDensity: '35%',
      ownership: 'Sở hữu lâu dài',
      amenities: '32+ hạng mục tiện ích',
      handover: 'Dự kiến quý IV/2027',
    },
  },
  {
    id: 2,
    name: 'Terra Hills Villa',
    type: 'Biệt thự',
    location: 'Bình Dương',
    status: 'Đang mở bán',
    price: 12.5,
    interest: 640,
    popular: 75,
    date: daysAgo(20),
    building: 'villa',
    gallery: VILLA_GALLERY,
    overview: {
      developer: 'Tập đoàn Terra Việt',
      scale: ['68 căn biệt thự đơn lập & song lập.', 'Diện tích mỗi căn từ 240 - 400 m².', 'Thiết kế 1 trệt + 2 lầu, sân vườn riêng.'],
      landArea: '42.000 m²',
      buildingDensity: '28%',
      ownership: 'Sở hữu lâu dài',
      amenities: '20+ hạng mục tiện ích nội khu',
      handover: 'Dự kiến quý III/2026',
    },
  },
  {
    id: 3,
    name: 'Golden Sand Land',
    type: 'Đất nền',
    location: 'Long An',
    status: 'Sắp mở bán',
    price: 2.1,
    interest: 1120,
    popular: 88,
    date: daysAgo(2),
    building: 'land',
    gallery: VILLA_GALLERY,
    overview: {
      developer: 'Tập đoàn Terra Việt',
      scale: ['620 nền đất nền thổ cư đã có sổ.', 'Diện tích mỗi nền từ 90 - 150 m².', 'Hạ tầng đường nhựa, điện, cấp thoát nước hoàn thiện 100%.'],
      landArea: '18,5 ha',
      buildingDensity: 'Tối đa 70% diện tích mỗi nền (theo quy hoạch 1/500)',
      ownership: 'Sở hữu lâu dài, đã có sổ đỏ từng nền',
      amenities: '12+ hạng mục tiện ích nội khu',
      handover: 'Dự kiến bàn giao đất quý I/2026',
    },
  },
  {
    id: 4,
    name: 'Terra Central Plaza',
    type: 'Shophouse',
    location: 'TP.HCM',
    status: 'Đang mở bán',
    price: 8.9,
    interest: 410,
    popular: 60,
    date: daysAgo(60),
    building: 'shophouse',
    gallery: APARTMENT_GALLERY,
    overview: {
      developer: 'Tập đoàn Terra Việt',
      scale: ['86 căn shophouse thương mại.', 'Thiết kế 1 trệt + 4 lầu.', 'Mặt tiền tiếp giáp trục đường chính khu vực.'],
      landArea: '9.800 m²',
      buildingDensity: '55%',
      ownership: 'Sở hữu lâu dài',
      amenities: '15+ hạng mục tiện ích thương mại',
      handover: 'Đang bàn giao theo tiến độ hợp đồng',
    },
  },
  {
    id: 5,
    name: 'Emerald Riverside',
    type: 'Căn hộ',
    location: 'Đồng Nai',
    status: 'Đã bàn giao',
    price: 3.4,
    interest: 305,
    popular: 55,
    date: daysAgo(400),
    building: 'apartment',
    gallery: APARTMENT_GALLERY,
    overview: {
      developer: 'Tập đoàn Terra Việt',
      scale: ['Cao 28 tầng, 1 tầng hầm để xe.', 'Gồm 2 tháp: Emerald A, Emerald B.', 'Khối đế 3 tầng tiện ích.'],
      landArea: '11.000 m²',
      buildingDensity: '38%',
      ownership: 'Sở hữu lâu dài',
      amenities: '25+ hạng mục tiện ích',
      handover: 'Đã bàn giao — cư dân đang sinh sống',
    },
  },
  {
    id: 6,
    name: 'Terra Coastal Villas',
    type: 'Biệt thự',
    location: 'Đà Nẵng',
    status: 'Sắp mở bán',
    price: 15.8,
    interest: 870,
    popular: 81,
    date: daysAgo(10),
    building: 'villa',
    gallery: VILLA_GALLERY,
    overview: {
      developer: 'Tập đoàn Terra Việt',
      scale: ['45 căn biệt thự nghỉ dưỡng ven biển.', 'Diện tích mỗi căn từ 300 - 500 m².', 'Thiết kế 1 trệt + 1 lầu, hồ bơi riêng.'],
      landArea: '36.000 m²',
      buildingDensity: '25%',
      ownership: 'Sở hữu lâu dài',
      amenities: '18+ hạng mục tiện ích nghỉ dưỡng',
      handover: 'Dự kiến quý IV/2026',
    },
  },
  {
    id: 7,
    name: 'Sunrise Garden Land',
    type: 'Đất nền',
    location: 'Bình Dương',
    status: 'Đang mở bán',
    price: 1.8,
    interest: 530,
    popular: 66,
    date: daysAgo(45),
    building: 'land',
    gallery: VILLA_GALLERY,
    overview: {
      developer: 'Tập đoàn Terra Việt',
      scale: ['410 nền đất nền thổ cư.', 'Diện tích mỗi nền từ 100 - 160 m².', 'Hạ tầng nội khu đồng bộ, công viên cây xanh trung tâm.'],
      landArea: '12,4 ha',
      buildingDensity: 'Tối đa 70% diện tích mỗi nền (theo quy hoạch 1/500)',
      ownership: 'Sở hữu lâu dài, đã có sổ đỏ từng nền',
      amenities: '10+ hạng mục tiện ích nội khu',
      handover: 'Dự kiến bàn giao đất quý III/2026',
    },
  },
  {
    id: 8,
    name: 'Terra Sky Residence',
    type: 'Căn hộ',
    location: 'Hà Nội',
    status: 'Sắp mở bán',
    price: 5.6,
    interest: 750,
    popular: 79,
    date: daysAgo(8),
    building: 'apartment',
    gallery: APARTMENT_GALLERY,
    overview: {
      developer: 'Tập đoàn Terra Việt',
      scale: ['Cao 35 tầng, 3 tầng hầm để xe.', 'Gồm 2 tháp: Sky Tower 1, Sky Tower 2.', 'Khối đế 5 tầng thương mại & tiện ích.'],
      landArea: '13.600 m²',
      buildingDensity: '32%',
      ownership: 'Sở hữu lâu dài',
      amenities: '30+ hạng mục tiện ích',
      handover: 'Dự kiến quý I/2028',
    },
  },
  {
    id: 9,
    name: 'Terra Boulevard Shophouse',
    type: 'Shophouse',
    location: 'Long An',
    status: 'Đã bàn giao',
    price: 6.3,
    interest: 220,
    popular: 48,
    date: daysAgo(500),
    building: 'shophouse',
    gallery: VILLA_GALLERY,
    overview: {
      developer: 'Tập đoàn Terra Việt',
      scale: ['52 căn shophouse mặt tiền đại lộ.', 'Thiết kế 1 trệt + 3 lầu.', 'Bố trí liền kề trục đường thương mại chính.'],
      landArea: '7.200 m²',
      buildingDensity: '50%',
      ownership: 'Sở hữu lâu dài',
      amenities: '10+ hạng mục tiện ích',
      handover: 'Đã bàn giao — đang kinh doanh, cho thuê',
    },
  },
  {
    id: 10,
    name: 'Lakeview Residence',
    type: 'Căn hộ',
    location: 'TP.HCM',
    status: 'Đang mở bán',
    price: 4.9,
    interest: 1300,
    popular: 95,
    date: daysAgo(1),
    building: 'apartment',
    gallery: APARTMENT_GALLERY,
    overview: {
      developer: 'Tập đoàn Terra Việt',
      scale: ['Cao 30 tầng, 2 tầng hầm để xe.', 'Gồm 3 tháp: Lake View A, B, C.', 'Khối đế 4 tầng tiện ích, hướng nhìn hồ trung tâm.'],
      landArea: '16.500 m²',
      buildingDensity: '36%',
      ownership: 'Sở hữu lâu dài',
      amenities: '35+ hạng mục tiện ích',
      handover: 'Dự kiến quý II/2027',
    },
  },
  {
    id: 11,
    name: 'Terra Green Valley',
    type: 'Biệt thự',
    location: 'Đồng Nai',
    status: 'Đang mở bán',
    price: 9.4,
    interest: 460,
    popular: 63,
    date: daysAgo(33),
    building: 'villa',
    gallery: APARTMENT_GALLERY,
    overview: {
      developer: 'Tập đoàn Terra Việt',
      scale: ['58 căn biệt thự song lập trong thung lũng xanh.', 'Diện tích mỗi căn từ 220 - 380 m².', 'Thiết kế 1 trệt + 2 lầu, sân vườn bao quanh.'],
      landArea: '38.000 m²',
      buildingDensity: '27%',
      ownership: 'Sở hữu lâu dài',
      amenities: '16+ hạng mục tiện ích',
      handover: 'Dự kiến quý IV/2026',
    },
  },
  {
    id: 12,
    name: 'Metro Junction Land',
    type: 'Đất nền',
    location: 'Hà Nội',
    status: 'Sắp mở bán',
    price: 3.9,
    interest: 690,
    popular: 72,
    date: daysAgo(15),
    building: 'land',
    gallery: VILLA_GALLERY,
    overview: {
      developer: 'Tập đoàn Terra Việt',
      scale: ['350 nền đất nền liền kề gần nhà ga Metro.', 'Diện tích mỗi nền từ 80 - 120 m².', 'Hạ tầng kết nối trực tiếp tuyến Metro số 3.'],
      landArea: '9,6 ha',
      buildingDensity: 'Tối đa 70% diện tích mỗi nền (theo quy hoạch 1/500)',
      ownership: 'Sở hữu lâu dài, đã có sổ đỏ từng nền',
      amenities: '8+ hạng mục tiện ích nội khu',
      handover: 'Dự kiến bàn giao đất quý II/2026',
    },
  },
];
