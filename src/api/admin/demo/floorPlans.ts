// Xem thử › Mặt bằng (bộ mặc định theo loại hình + bộ riêng của dự án).
import { ApiError } from '../../client';
import type { FloorPlanRow, FloorPlanSetRow } from '../../rows';
import { ensure } from '../../validate';
import type * as FloorPlansApi from '../floorPlans';
import { validatePlan } from '../floorPlans';
import { byOrder, clone, commit, D, delay, find, nextId, now } from './shared';

const withPlans = (s: FloorPlanSetRow): FloorPlanSetRow => ({ ...s, floor_plans: D().plans.filter((p) => p.set_id === s.id).sort(byOrder) });

export const floorPlansApi: typeof FloorPlansApi = {
  validatePlan,
  async listFloorPlanSets() {
    return delay(clone(D().sets.map(withPlans)));
  },
  async saveFloorPlanSet(scope, input) {
    ensure([[input.title.trim().length > 0, 'Vui lòng nhập tiêu đề.']]);
    const existing = D().sets.find((s) =>
      'project_id' in scope ? s.project_id === scope.project_id : s.building_type === scope.building_type && s.project_id === null,
    );
    if (existing) {
      Object.assign(existing, { title: input.title.trim(), intro: input.intro ?? '', updated_at: now() });
      return commit(clone(existing));
    }
    const row: FloorPlanSetRow = {
      id: nextId(),
      building_type: 'building_type' in scope ? scope.building_type : null,
      project_id: 'project_id' in scope ? scope.project_id : null,
      title: input.title.trim(),
      intro: input.intro ?? '',
      updated_at: now(),
    };
    D().sets.push(row);
    return commit(clone(row));
  },
  async deleteFloorPlanSet(id) {
    find(D().sets, id, 'bộ mặt bằng');
    D().sets.splice(D().sets.findIndex((s) => s.id === id), 1);
    for (let i = D().plans.length - 1; i >= 0; i--) if (D().plans[i].set_id === id) D().plans.splice(i, 1);
    await commit(null);
  },
  async createFloorPlan(setId, input) {
    validatePlan(input);
    find(D().sets, setId, 'bộ mặt bằng');
    if (D().plans.some((p) => p.set_id === setId && p.slug === input.slug))
      throw new ApiError('Dữ liệu bị trùng (mã / đường dẫn đã tồn tại).', 'validation');
    const row: FloorPlanRow = {
      bedrooms: null,
      bathrooms: null,
      note: '',
      sort_order: D().plans.filter((p) => p.set_id === setId).length,
      ...clone(input),
      id: nextId(),
      set_id: setId,
    };
    D().plans.push(row);
    return commit(clone(row));
  },
  async updateFloorPlan(id, patch) {
    const cur = find(D().plans, id, 'mặt bằng');
    validatePlan({ width: Number(cur.width), depth: Number(cur.depth), ...patch });
    if (patch.slug && D().plans.some((p) => p.set_id === cur.set_id && p.slug === patch.slug && p.id !== id))
      throw new ApiError('Dữ liệu bị trùng (mã / đường dẫn đã tồn tại).', 'validation');
    Object.assign(cur, clone(patch));
    return commit(clone(cur));
  },
  async deleteFloorPlan(id) {
    find(D().plans, id, 'mặt bằng');
    D().plans.splice(D().plans.findIndex((p) => p.id === id), 1);
    await commit(null);
  },
};
