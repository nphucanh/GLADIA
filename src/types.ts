export type ProjectType = 'Căn hộ' | 'Biệt thự' | 'Đất nền' | 'Shophouse';
export type ProjectStatus = 'Đang mở bán' | 'Sắp mở bán' | 'Đã bàn giao';
export type BuildingType = 'apartment' | 'villa' | 'land' | 'shophouse';

// Ảnh thực tế từng phòng — hiển thị ở mục "Không gian thực tế" trên trang chi tiết dự án.
// Optional vì chỉ một số dự án mẫu có sẵn bộ ảnh nội thất riêng.
export interface ProjectGalleryItem {
  room: string;
  image: string;
  description: string;
  /** Dữ liệu dựng ảnh thành không gian 3D (src/data/photo3d.ts — tạo bởi scripts/depth/generate.mjs). */
  photo3d?: Photo3D;
}

/** Dữ liệu 3D của ảnh "Không gian sống": bản đồ độ sâu (+ các lớp phụ do scripts/depth/generate.mjs sinh). */
export interface Photo3D {
  depth: string; // bản đồ độ sâu (xám, sáng = gần) — phần tham quan 3D dùng
  bg?: string; // màu lớp nền vẽ bù (alpha = vùng vẽ bù) — hiện không dùng
  bgDepth?: string; // độ sâu lớp nền — hiện không dùng
  forward?: number; // biên độ bước tới an toàn (m) — hiện không dùng
  lateral?: number; // biên độ sang ngang an toàn (m) — hiện không dùng
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
  image?: string; // ảnh đại diện; trống → ảnh minh hoạ theo loại hình (PROJECT_IMAGE_BY_BUILDING)
  gallery?: ProjectGalleryItem[];
  overview?: ProjectOverview;
}

// Biểu tượng của tin tuyển dụng (vẽ trong Careers.tsx) — khớp ràng buộc cột jobs.icon trong supabase/schema.sql
export type JobIcon = 'building' | 'megaphone' | 'engineer' | 'support' | 'legal' | 'finance';

export interface Job {
  id: number;
  title: string;
  location: string;
  employment: string;
  body: string;
  icon: JobIcon;
}

export interface JobApplicationPayload {
  job_id?: number | null;
  position: string;
  full_name: string;
  phone: string;
  email: string;
  cv_url?: string | null; // link CV / portfolio
  cv_file?: File | null; // file CV (PDF / Word, tối đa 5MB) — tải lên kho "cv"
  message?: string | null;
}

export interface ContactPayload {
  full_name: string;
  phone: string;
  email: string;
  project_interest?: string | null;
  topic: string;
  message?: string | null;
}
