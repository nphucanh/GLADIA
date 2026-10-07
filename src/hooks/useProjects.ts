import { useLocation } from 'react-router-dom';
import { Project } from '../types';
import { useProjectList } from './useApiData';

interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  usingMockData: boolean;
}

/**
 * Danh sách dự án (src/api/public.ts → listProjects): từ bảng "projects" trên Supabase; chưa cấu hình
 * Supabase → kho xem thử dùng chung với trang quản trị; lỗi mạng → dữ liệu mẫu.
 * Tải lại mỗi khi chuyển trang (danh sách được giữ ở gốc ứng dụng) để thấy ngay dự án vừa thêm / sửa.
 */
export function useProjects(): UseProjectsResult {
  const { pathname } = useLocation();
  const { data, loading, source } = useProjectList(pathname);
  return { projects: data, loading, usingMockData: source === 'mock' };
}
