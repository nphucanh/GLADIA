// Quản trị dự án + ảnh "Không gian sống". Chỉ admin (RLS chặn mọi người khác).
import type { BuildingType, ProjectOverview, ProjectStatus, ProjectType } from '../../types';
import { db, pageRange, searchTerm, toPage, unwrap, type Page, type PageQuery } from '../client';
import { ensure } from '../validate';
import type { GalleryRow, ProjectRow } from '../rows';

const PROJECT_TYPES: ProjectType[] = ['Căn hộ', 'Biệt thự', 'Đất nền', 'Shophouse'];
const PROJECT_STATUSES: ProjectStatus[] = ['Đang mở bán', 'Sắp mở bán', 'Đã bàn giao'];
const BUILDING_TYPES: BuildingType[] = ['apartment', 'villa', 'land', 'shophouse'];

export interface ProjectInput {
  name: string;
  type: ProjectType;
  location: string;
  status: ProjectStatus;
  price: number; // tỷ VNĐ
  building_type: BuildingType;
  popularity?: number; // 0–100
  interest_count?: number;
  description?: string | null;
  overview?: ProjectOverview | null;
  cover_image_url?: string | null;
  is_published?: boolean;
  sort_order?: number;
}

export function validateProject(p: Partial<ProjectInput>, creating: boolean) {
  const has = (k: keyof ProjectInput) => creating || k in p;
  ensure([
    [!has('name') || (p.name ?? '').trim().length >= 2, 'Tên dự án tối thiểu 2 ký tự.'],
    [!has('type') || PROJECT_TYPES.includes(p.type as ProjectType), 'Loại hình không hợp lệ.'],
    [!has('location') || (p.location ?? '').trim().length > 0, 'Vui lòng nhập vị trí (tỉnh / thành).'],
    [!has('status') || PROJECT_STATUSES.includes(p.status as ProjectStatus), 'Trạng thái không hợp lệ.'],
    [!has('price') || (typeof p.price === 'number' && p.price >= 0), 'Giá phải là số ≥ 0 (tỷ VNĐ).'],
    [!has('building_type') || BUILDING_TYPES.includes(p.building_type as BuildingType), 'Kiểu công trình không hợp lệ.'],
    [p.popularity === undefined || (p.popularity >= 0 && p.popularity <= 100), 'Điểm phổ biến từ 0 đến 100.'],
  ]);
}

export interface ProjectFilter extends PageQuery {
  search?: string; // theo tên / vị trí
  status?: ProjectStatus;
  type?: ProjectType;
  published?: boolean;
}

/** Danh sách dự án cho trang quản trị (kể cả bản nháp), có lọc + phân trang. */
export async function listProjects(f: ProjectFilter = {}): Promise<Page<ProjectRow>> {
  const { page, pageSize, from, to } = pageRange(f);
  let q = db()
    .from('projects')
    .select('*', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, to);
  const s = searchTerm(f.search);
  if (s) q = q.or(`name.ilike.${s},location.ilike.${s}`);
  if (f.status) q = q.eq('status', f.status);
  if (f.type) q = q.eq('type', f.type);
  if (f.published !== undefined) q = q.eq('is_published', f.published);
  const res = await q;
  return toPage(unwrap<ProjectRow[]>(res), res.count, page, pageSize);
}

export async function getProject(id: number): Promise<ProjectRow> {
  return unwrap<ProjectRow>(await db().from('projects').select('*, project_gallery(*)').eq('id', id).single());
}

export async function createProject(input: ProjectInput): Promise<ProjectRow> {
  validateProject(input, true);
  return unwrap<ProjectRow>(await db().from('projects').insert(input).select().single());
}

export async function updateProject(id: number, patch: Partial<ProjectInput>): Promise<ProjectRow> {
  validateProject(patch, false);
  return unwrap<ProjectRow>(await db().from('projects').update(patch).eq('id', id).select().single());
}

/** Xoá dự án (ảnh không gian sống + mặt bằng riêng của dự án bị xoá theo). Ảnh trong kho media không bị xoá. */
export async function deleteProject(id: number) {
  unwrap(await db().from('projects').delete().eq('id', id));
}

// ---------- Ảnh "Không gian sống" ----------

export interface GalleryInput {
  room: string;
  description?: string;
  image_url: string;
  depth_url?: string | null;
  sort_order?: number;
}

export async function listGallery(projectId: number): Promise<GalleryRow[]> {
  return unwrap<GalleryRow[]>(
    await db().from('project_gallery').select('*').eq('project_id', projectId).order('sort_order').order('id'),
  );
}

export async function addGalleryItem(projectId: number, input: GalleryInput): Promise<GalleryRow> {
  ensure([
    [input.room.trim().length > 0, 'Vui lòng nhập tên phòng.'],
    [input.image_url.trim().length > 0, 'Vui lòng chọn ảnh.'],
  ]);
  return unwrap<GalleryRow>(
    await db()
      .from('project_gallery')
      .insert({ ...input, project_id: projectId })
      .select()
      .single(),
  );
}

export async function updateGalleryItem(id: number, patch: Partial<GalleryInput>): Promise<GalleryRow> {
  return unwrap<GalleryRow>(await db().from('project_gallery').update(patch).eq('id', id).select().single());
}

export async function deleteGalleryItem(id: number) {
  unwrap(await db().from('project_gallery').delete().eq('id', id));
}

/** Sắp xếp lại ảnh theo thứ tự id truyền vào. */
export async function reorderGallery(ids: number[]) {
  await Promise.all(ids.map((id, i) => db().from('project_gallery').update({ sort_order: i }).eq('id', id).then(unwrap)));
}
