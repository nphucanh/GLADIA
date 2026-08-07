import { HERO_IMAGE, PAGE_HERO_IMAGE, AMENITY_HERO_IMAGE, AMENITY_INSET_IMAGE } from './images';

export interface NewsItem {
  id: number;
  image: string;
  date: string; // ISO yyyy-mm-dd
  title: string;
}

export const mockNews: NewsItem[] = [
  {
    id: 1,
    image: PAGE_HERO_IMAGE,
    date: '2026-07-31',
    title: 'Terra Việt tung ưu đãi "Đặc quyền Priority" cho khách hàng thân thiết',
  },
  {
    id: 2,
    image: HERO_IMAGE,
    date: '2026-05-25',
    title: 'Dự án kết nối 2 nhà ga, 2 sân bay quốc tế và 2 thành phố trực thuộc trung ương',
  },
  {
    id: 3,
    image: AMENITY_INSET_IMAGE,
    date: '2026-05-18',
    title: 'Tiềm năng shophouse Terra Việt nhờ liền kề nhà ga Metro',
  },
  {
    id: 4,
    image: AMENITY_HERO_IMAGE,
    date: '2026-04-30',
    title: 'Terra Việt ký kết hợp tác chiến lược cùng 5 đối tác lớn',
  },
  {
    id: 5,
    image: PAGE_HERO_IMAGE,
    date: '2026-04-12',
    title: 'Bàn giao giai đoạn 1: hơn 800 căn hộ chính thức có cư dân sinh sống',
  },
  {
    id: 6,
    image: HERO_IMAGE,
    date: '2026-03-20',
    title: 'Tiến độ thi công tháng 3: hoàn thiện phần thô toàn bộ khối đế thương mại',
  },
];
