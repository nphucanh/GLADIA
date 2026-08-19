export type ProjectType = 'Căn hộ' | 'Biệt thự' | 'Đất nền' | 'Shophouse';
export type ProjectStatus = 'Đang mở bán' | 'Sắp mở bán' | 'Đã bàn giao';
export type BuildingType = 'apartment' | 'villa' | 'land' | 'shophouse';

// Ảnh thực tế từng phòng — hiển thị ở mục "Không gian thực tế" trên trang chi tiết dự án.
// Optional vì chỉ một số dự án mẫu có sẵn bộ ảnh nội thất riêng.
export interface ProjectGalleryItem {
  room: string;
  image: string;
  description: string;
}

// Thông tin tổng quan dạng bảng thông số — hiển thị ở mục "Thông tin tổng quan" trên trang chi tiết dự án. 
export interface ProjectOverview {
  developer: string; // Chủ đầu tư
  scale: string[]; // Quy mô dự án
  landArea: string; // Diện tích đất
  buildingDensity: string; // Mật độ xây dựng
  ownership: string; // Hình thức sở hữu
  amenities: string; // Số hạng mục tiện ích
  handover: string; // Tiến độ bàn giao
}

export interface Project {
  id: number | string;
  name: string;
  type: ProjectType;
  location: string;
  status: ProjectStatus;
  price: number; // đơn vị: tỷ VNĐ
  interest: number;
  popular: number;
  date: string; // ISO date string (yyyy-mm-dd)
  building: BuildingType;
  description?: string;
  gallery?: ProjectGalleryItem[];
  overview?: ProjectOverview;
}

export interface ContactPayload {
  full_name: string;
  phone: string;
  email: string;
  project_interest?: string | null;
  topic: string;
  message?: string | null;
}
