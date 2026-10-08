// Dự án — dùng ở: Trang chủ, Dự án, Chi tiết dự án, Liên hệ (danh sách dự án trong form).
// Bảng: projects, project_gallery, floor_plan_sets, floor_plans.
// Đọc: tự rơi về dữ liệu mẫu khi chưa cấu hình Supabase / lỗi. Chỉ dự án đã xuất bản (giống RLS trên database).
import type { Project } from '../../types';
import type { FloorPlanSet } from '../../data/projectDetails';
import { getFloorPlans as staticFloorPlans } from '../../data/projectDetails';
import { mockProjects } from '../../data/mockProjects';
import { readOrMock, unwrap, type Sourced } from '../client';
import { toFloorPlanSet, toProject, type FloorPlanSetRow, type ProjectRow } from '../rows';
import { demoDb } from '../demoStore';
import { isDemo } from './shared';

// ---------- Dữ liệu dự phòng ----------

export function fallbackProjects(): Project[] {
  if (!isDemo) return mockProjects;
  const d = demoDb();
  return d.projects
    .filter((p) => p.is_published)
    .sort((a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at))
    .map((p) => toProject({ ...p, project_gallery: d.gallery.filter((g) => g.project_id === p.id) }));
}

export function fallbackFloorPlanSet(project: Project): FloorPlanSet {
  if (!isDemo) return staticFloorPlans(project);
  const d = demoDb();
  const set =
    d.sets.find((s) => s.project_id !== null && String(s.project_id) === String(project.id)) ??
    d.sets.find((s) => s.project_id === null && s.building_type === project.building);
  const plans = set ? d.plans.filter((p) => p.set_id === set.id) : [];
  return set && plans.length ? toFloorPlanSet({ ...set, floor_plans: plans }) : staticFloorPlans(project);
}

// ---------- API ----------

/** Tất cả dự án đã xuất bản (kèm ảnh không gian sống), mới nhất trước. */
export function listProjects(): Promise<Sourced<Project[]>> {
  return readOrMock(
    'danh sách dự án',
    async (c) => {
      const rows = unwrap<ProjectRow[]>(
        await c
          .from('projects')
          .select('*, project_gallery(*)')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false }),
      );
      return rows.map(toProject);
    },
    fallbackProjects,
  );
}

/** Một dự án theo id; null nếu không có / chưa xuất bản. */
export function getProject(id: number | string): Promise<Sourced<Project | null>> {
  return readOrMock(
    `dự án #${id}`,
    async (c) => {
      const row = unwrap<ProjectRow | null>(await c.from('projects').select('*, project_gallery(*)').eq('id', id).maybeSingle());
      return row ? toProject(row) : null;
    },
    () => fallbackProjects().find((p) => String(p.id) === String(id)) ?? null,
  );
}

/**
 * Bộ mặt bằng của dự án: bộ riêng của dự án → bộ mặc định theo loại hình trên database → bộ mẫu trong code.
 */
export function getFloorPlanSet(project: Project): Promise<Sourced<FloorPlanSet>> {
  return readOrMock(
    `mặt bằng dự án #${project.id}`,
    async (c) => {
      const numericId = Number(project.id);
      const scope = Number.isFinite(numericId)
        ? `project_id.eq.${numericId},and(project_id.is.null,building_type.eq.${project.building})`
        : `and(project_id.is.null,building_type.eq.${project.building})`;
      const sets = unwrap<FloorPlanSetRow[]>(await c.from('floor_plan_sets').select('*, floor_plans(*)').or(scope));
      const set = sets.find((s) => s.project_id !== null) ?? sets[0];
      return set && set.floor_plans?.length ? toFloorPlanSet(set) : staticFloorPlans(project);
    },
    () => fallbackFloorPlanSet(project),
  );
}
