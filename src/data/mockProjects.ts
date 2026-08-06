import { Project } from '../types';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Dữ liệu mẫu — dùng khi chưa cấu hình Supabase hoặc khi bảng "projects" trống */
export const mockProjects: Project[] = [
  { id: 1, name: 'Terra Riverside', type: 'Căn hộ', location: 'TP.HCM', status: 'Đang mở bán', price: 4.2, interest: 980, popular: 92, date: daysAgo(5), building: 'apartment' },
  { id: 2, name: 'Terra Hills Villa', type: 'Biệt thự', location: 'Bình Dương', status: 'Đang mở bán', price: 12.5, interest: 640, popular: 75, date: daysAgo(20), building: 'villa' },
  { id: 3, name: 'Golden Sand Land', type: 'Đất nền', location: 'Long An', status: 'Sắp mở bán', price: 2.1, interest: 1120, popular: 88, date: daysAgo(2), building: 'land' },
  { id: 4, name: 'Terra Central Plaza', type: 'Shophouse', location: 'TP.HCM', status: 'Đang mở bán', price: 8.9, interest: 410, popular: 60, date: daysAgo(60), building: 'shophouse' },
  { id: 5, name: 'Emerald Riverside', type: 'Căn hộ', location: 'Đồng Nai', status: 'Đã bàn giao', price: 3.4, interest: 305, popular: 55, date: daysAgo(400), building: 'apartment' },
  { id: 6, name: 'Terra Coastal Villas', type: 'Biệt thự', location: 'Đà Nẵng', status: 'Sắp mở bán', price: 15.8, interest: 870, popular: 81, date: daysAgo(10), building: 'villa' },
  { id: 7, name: 'Sunrise Garden Land', type: 'Đất nền', location: 'Bình Dương', status: 'Đang mở bán', price: 1.8, interest: 530, popular: 66, date: daysAgo(45), building: 'land' },
  { id: 8, name: 'Terra Sky Residence', type: 'Căn hộ', location: 'Hà Nội', status: 'Sắp mở bán', price: 5.6, interest: 750, popular: 79, date: daysAgo(8), building: 'apartment' },
  { id: 9, name: 'Terra Boulevard Shophouse', type: 'Shophouse', location: 'Long An', status: 'Đã bàn giao', price: 6.3, interest: 220, popular: 48, date: daysAgo(500), building: 'shophouse' },
  { id: 10, name: 'Lakeview Residence', type: 'Căn hộ', location: 'TP.HCM', status: 'Đang mở bán', price: 4.9, interest: 1300, popular: 95, date: daysAgo(1), building: 'apartment' },
  { id: 11, name: 'Terra Green Valley', type: 'Biệt thự', location: 'Đồng Nai', status: 'Đang mở bán', price: 9.4, interest: 460, popular: 63, date: daysAgo(33), building: 'villa' },
  { id: 12, name: 'Metro Junction Land', type: 'Đất nền', location: 'Hà Nội', status: 'Sắp mở bán', price: 3.9, interest: 690, popular: 72, date: daysAgo(15), building: 'land' },
];
