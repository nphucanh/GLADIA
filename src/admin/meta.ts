// Nhãn hiển thị + màu cho các giá trị trạng thái / phân loại trong trang quản trị.
import type { ApplicationStatus, ContactStatus } from '../api/rows';
import type { BuildingType, ProjectStatus, ProjectType } from '../types';
import type { NewsCategory } from '../data/mockNews';
import type { RoomKind } from '../data/projectDetails';
import type { Tone } from './ui';

export const CONTACT_STATUS: Record<ContactStatus, { label: string; tone: Tone }> = {
  new: { label: 'Mới', tone: 'warn' },
  in_progress: { label: 'Đang xử lý', tone: 'info' },
  done: { label: 'Đã xong', tone: 'ok' },
  spam: { label: 'Spam', tone: 'neutral' },
};

export const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; tone: Tone }> = {
  new: { label: 'Mới', tone: 'warn' },
  reviewing: { label: 'Đang xem xét', tone: 'info' },
  interview: { label: 'Hẹn phỏng vấn', tone: 'accent' },
  hired: { label: 'Đã tuyển', tone: 'ok' },
  rejected: { label: 'Không phù hợp', tone: 'neutral' },
};

export const PROJECT_STATUS_TONE: Record<ProjectStatus, Tone> = {
  'Đang mở bán': 'ok',
  'Sắp mở bán': 'warn',
  'Đã bàn giao': 'neutral',
};

export const PROJECT_TYPES: ProjectType[] = ['Căn hộ', 'Biệt thự', 'Đất nền', 'Shophouse'];
export const PROJECT_STATUSES: ProjectStatus[] = ['Đang mở bán', 'Sắp mở bán', 'Đã bàn giao'];

export const BUILDING_LABEL: Record<BuildingType, string> = {
  apartment: 'Căn hộ',
  villa: 'Biệt thự',
  land: 'Nhà phố (đất nền)',
  shophouse: 'Shophouse',
};
export const BUILDING_TYPES = Object.keys(BUILDING_LABEL) as BuildingType[];
/** Loại hình bán → kiểu công trình mặc định (dùng khi tạo dự án mới). */
export const BUILDING_OF_TYPE: Record<ProjectType, BuildingType> = {
  'Căn hộ': 'apartment',
  'Biệt thự': 'villa',
  'Đất nền': 'land',
  Shophouse: 'shophouse',
};

export const NEWS_CATEGORY_LABEL: Record<NewsCategory, string> = {
  'du-an': 'Tin dự án',
  'cong-ty': 'Tin công ty',
  'thien-nguyen': 'Thiện nguyện',
};

export const ROOM_KIND_LABEL: Record<RoomKind, string> = {
  living: 'Phòng khách / sảnh',
  bed: 'Phòng ngủ',
  kitchen: 'Bếp / ăn',
  wc: 'WC / phòng tắm',
  outdoor: 'Ban công / sân',
  garage: 'Gara',
  stair: 'Cầu thang',
  shop: 'Kinh doanh',
  storage: 'Kho / thay đồ',
};
