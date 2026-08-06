import { useEffect, useState } from 'react';
import { Project } from '../types';
import { supabase } from '../lib/supabaseClient';
import { mockProjects } from '../data/mockProjects';

interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  usingMockData: boolean;
}

/**
 * Tải danh sách dự án từ bảng "projects" trên Supabase.
 * Nếu chưa cấu hình Supabase, hoặc bảng trống, hoặc có lỗi mạng —
 * tự động rơi về dữ liệu mẫu (mockProjects) để giao diện luôn chạy được.
 */
export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!cancelled && data && data.length > 0) {
          const mapped: Project[] = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            type: row.type,
            location: row.location,
            status: row.status,
            price: Number(row.price),
            interest: row.interest_count ?? 0,
            popular: row.popularity ?? 0,
            date: (row.created_at ?? '').slice(0, 10),
            building: row.building_type ?? 'apartment',
            description: row.description ?? undefined,
          }));
          setProjects(mapped);
          setUsingMockData(false);
        }
      } catch (err) {
        console.warn('Không tải được dữ liệu dự án từ Supabase, dùng dữ liệu mẫu:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { projects, loading, usingMockData };
}
