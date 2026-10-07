// Dữ liệu mẫu "Vị trí đang tuyển" — dùng khi chưa cấu hình Supabase / lỗi mạng, và để sinh supabase/seed.sql.
import type { Job } from '../types';

export const mockJobs: Job[] = [
  {
    id: 1,
    title: 'Chuyên viên Kinh doanh Bất động sản',
    location: 'TP.HCM',
    employment: 'Toàn thời gian',
    body: 'Tư vấn, giới thiệu sản phẩm và chăm sóc khách hàng cho các dự án đang mở bán của Terra.',
    icon: 'building',
  },
  {
    id: 2,
    title: 'Trưởng phòng Marketing',
    location: 'TP.HCM',
    employment: 'Toàn thời gian',
    body: 'Xây dựng chiến lược thương hiệu, truyền thông đa kênh cho danh mục dự án của công ty.',
    icon: 'megaphone',
  },
  {
    id: 3,
    title: 'Kỹ sư Giám sát công trình',
    location: 'Bình Dương',
    employment: 'Toàn thời gian',
    body: 'Giám sát chất lượng, tiến độ thi công thực tế tại công trường theo đúng hồ sơ thiết kế.',
    icon: 'engineer',
  },
  {
    id: 4,
    title: 'Chuyên viên Chăm sóc khách hàng',
    location: 'TP.HCM',
    employment: 'Toàn thời gian',
    body: 'Hỗ trợ, giải đáp và đồng hành cùng cư dân trong suốt quá trình sử dụng dịch vụ tại dự án.',
    icon: 'support',
  },
  {
    id: 5,
    title: 'Chuyên viên Pháp lý dự án',
    location: 'TP.HCM',
    employment: 'Toàn thời gian',
    body: 'Soát xét hồ sơ pháp lý, hỗ trợ thủ tục cấp phép và sổ hồng cho các dự án đang triển khai.',
    icon: 'legal',
  },
  {
    id: 6,
    title: 'Kế toán tổng hợp',
    location: 'Đồng Nai',
    employment: 'Toàn thời gian',
    body: 'Ghi nhận, đối soát chứng từ kế toán và lập báo cáo tài chính định kỳ cho khu vực phụ trách.',
    icon: 'finance',
  },
];
