export type ProjectType = 'Căn hộ' | 'Biệt thự' | 'Đất nền' | 'Shophouse';
export type ProjectStatus = 'Đang mở bán' | 'Sắp mở bán' | 'Đã bàn giao';
export type BuildingType = 'apartment' | 'villa' | 'land' | 'shophouse';

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
}

export interface ContactPayload {
  full_name: string;
  phone: string;
  email: string;
  project_interest?: string | null;
  topic: string;
  message?: string | null;
}
