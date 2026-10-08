// Quản trị mặt bằng: bộ mặc định theo loại hình, hoặc bộ riêng của một dự án (ghi đè bộ mặc định).
import type { BuildingType } from '../../types';
import type { FloorPlanRoom, RoomKind } from '../../data/projectDetails';
import { db, deleteById, unwrap } from '../client';
import { ensure } from '../validate';
import type { FloorPlanRow, FloorPlanSetRow } from '../rows';

const ROOM_KINDS: RoomKind[] = ['living', 'bed', 'kitchen', 'wc', 'outdoor', 'garage', 'stair', 'shop', 'storage'];

export type FloorPlanScope = { building_type: BuildingType } | { project_id: number };

export interface FloorPlanSetInput {
  title: string;
  intro?: string;
}

export interface FloorPlanInput {
  slug: string; // mã tab, vd "t1"
  name: string;
  code: string;
  area: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  note?: string;
  width: number;
  depth: number;
  rooms: FloorPlanRoom[];
  sort_order?: number;
}

/** Kiểm tra phòng nằm trong khung mặt bằng và đúng loại — bản vẽ + tham quan 3D dựa vào các số này. */
export function validatePlan(p: Partial<FloorPlanInput>) {
  ensure([
    [p.slug === undefined || /^[a-z0-9-]{1,32}$/.test(p.slug), 'Mã tab chỉ gồm chữ thường, số, gạch ngang (vd "t1").'],
    [p.area === undefined || p.area > 0, 'Diện tích phải lớn hơn 0.'],
    [p.width === undefined || p.width > 0, 'Chiều rộng phải lớn hơn 0.'],
    [p.depth === undefined || p.depth > 0, 'Chiều sâu phải lớn hơn 0.'],
  ]);
  if (!p.rooms) return;
  const W = p.width ?? Infinity;
  const D = p.depth ?? Infinity;
  p.rooms.forEach((r, i) =>
    ensure([
      [r.label?.trim().length > 0, `Phòng #${i + 1}: thiếu tên.`],
      [ROOM_KINDS.includes(r.kind), `Phòng "${r.label}": loại phòng không hợp lệ.`],
      [[r.x, r.y, r.w, r.h].every((v) => typeof v === 'number' && Number.isFinite(v)), `Phòng "${r.label}": toạ độ phải là số.`],
      [r.w > 0 && r.h > 0, `Phòng "${r.label}": kích thước phải lớn hơn 0.`],
      [r.x >= 0 && r.y >= 0 && r.x + r.w <= W + 1e-6 && r.y + r.h <= D + 1e-6, `Phòng "${r.label}" nằm ngoài khung mặt bằng.`],
    ]),
  );
}

/** Tất cả bộ mặt bằng kèm các mặt bằng con. */
export async function listFloorPlanSets(): Promise<FloorPlanSetRow[]> {
  return unwrap<FloorPlanSetRow[]>(
    await db().from('floor_plan_sets').select('*, floor_plans(*)').order('building_type').order('project_id'),
  );
}

/** Tạo hoặc cập nhật bộ mặt bằng theo phạm vi (loại hình / dự án). */
export async function saveFloorPlanSet(scope: FloorPlanScope, input: FloorPlanSetInput): Promise<FloorPlanSetRow> {
  ensure([[input.title.trim().length > 0, 'Vui lòng nhập tiêu đề.']]);
  const q = db().from('floor_plan_sets').select('id');
  const existing = unwrap<{ id: number } | null>(
    await ('project_id' in scope
      ? q.eq('project_id', scope.project_id)
      : q.eq('building_type', scope.building_type).is('project_id', null)
    ).maybeSingle(),
  );
  const row: Record<string, unknown> = { ...scope, title: input.title.trim(), intro: input.intro ?? '' };
  if (existing) {
    return unwrap<FloorPlanSetRow>(await db().from('floor_plan_sets').update(row).eq('id', existing.id).select().single());
  }
  return unwrap<FloorPlanSetRow>(await db().from('floor_plan_sets').insert(row).select().single());
}

/** Xoá bộ mặt bằng (kèm các mặt bằng con). Xoá bộ riêng của dự án → dự án quay về bộ mặc định. */
export async function deleteFloorPlanSet(id: number) {
  await deleteById('floor_plan_sets', id, 'bộ mặt bằng');
}

export async function createFloorPlan(setId: number, input: FloorPlanInput): Promise<FloorPlanRow> {
  validatePlan(input);
  return unwrap<FloorPlanRow>(
    await db()
      .from('floor_plans')
      .insert({ ...input, set_id: setId })
      .select()
      .single(),
  );
}

export async function updateFloorPlan(id: number, patch: Partial<FloorPlanInput>): Promise<FloorPlanRow> {
  // Kiểm tra phòng theo khung mặt bằng sau khi cập nhật
  if (patch.rooms && (patch.width === undefined || patch.depth === undefined)) {
    const cur = unwrap<FloorPlanRow>(await db().from('floor_plans').select('width, depth').eq('id', id).single());
    validatePlan({ width: Number(cur.width), depth: Number(cur.depth), ...patch });
  } else validatePlan(patch);
  return unwrap<FloorPlanRow>(await db().from('floor_plans').update(patch).eq('id', id).select().single());
}

export async function deleteFloorPlan(id: number) {
  await deleteById('floor_plans', id, 'mặt bằng');
}
