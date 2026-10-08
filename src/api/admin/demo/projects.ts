// Xem thử › Dự án (danh sách, thêm / sửa, ảnh không gian sống).
import type { GalleryRow, ProjectRow } from '../../rows';
import { ensure } from '../../validate';
import type * as ProjectsApi from '../projects';
import { validateProject, type ProjectFilter } from '../projects';
import { floorPlansApi } from './floorPlans';
import { byOrder, clone, commit, D, delay, find, like, nextId, now, paginate } from './shared';

export const projectsApi: typeof ProjectsApi = {
  validateProject,
  async listProjects(f: ProjectFilter = {}) {
    const rows = D().projects
      .filter((p) => like(f.search, p.name, p.location))
      .filter((p) => !f.status || p.status === f.status)
      .filter((p) => !f.type || p.type === f.type)
      .filter((p) => f.published === undefined || p.is_published === f.published)
      .sort((a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at));
    return delay(paginate(rows, f));
  },
  async getProject(id) {
    const p = find(D().projects, id, 'dự án');
    return delay(clone({ ...p, project_gallery: D().gallery.filter((g) => g.project_id === id).sort(byOrder) }));
  },
  async createProject(input) {
    validateProject(input, true);
    const row: ProjectRow = {
      interest_count: 0,
      popularity: 0,
      description: null,
      overview: null,
      cover_image_url: null,
      is_published: true,
      sort_order: 0,
      ...input,
      id: nextId(),
      created_at: now(),
      updated_at: now(),
    } as ProjectRow;
    D().projects.push(row);
    return commit(clone(row));
  },
  async updateProject(id, patch) {
    validateProject(patch, false);
    const p = find(D().projects, id, 'dự án');
    Object.assign(p, patch, { updated_at: now() });
    return commit(clone(p));
  },
  async deleteProject(id) {
    find(D().projects, id, 'dự án');
    D().projects.splice(D().projects.findIndex((p) => p.id === id), 1);
    for (let i = D().gallery.length - 1; i >= 0; i--) if (D().gallery[i].project_id === id) D().gallery.splice(i, 1);
    const own = D().sets.findIndex((s) => s.project_id === id);
    if (own >= 0) await floorPlansApi.deleteFloorPlanSet(D().sets[own].id);
    await commit(null);
  },
  async listGallery(projectId) {
    return delay(clone(D().gallery.filter((g) => g.project_id === projectId).sort(byOrder)));
  },
  async addGalleryItem(projectId, input) {
    ensure([
      [input.room.trim().length > 0, 'Vui lòng nhập tên phòng.'],
      [input.image_url.trim().length > 0, 'Vui lòng chọn ảnh.'],
    ]);
    const maxOrder = Math.max(-1, ...D().gallery.filter((g) => g.project_id === projectId).map((g) => g.sort_order));
    const row: GalleryRow = {
      description: '',
      depth_url: null,
      sort_order: maxOrder + 1,
      ...input,
      id: nextId(),
      project_id: projectId,
      created_at: now(),
    };
    D().gallery.push(row);
    return commit(clone(row));
  },
  async updateGalleryItem(id, patch) {
    const g = find(D().gallery, id, 'ảnh');
    Object.assign(g, patch);
    return commit(clone(g));
  },
  async deleteGalleryItem(id) {
    find(D().gallery, id, 'ảnh');
    D().gallery.splice(D().gallery.findIndex((g) => g.id === id), 1);
    await commit(null);
  },
  async reorderGallery(ids) {
    ids.forEach((id, i) => {
      const g = D().gallery.find((x) => x.id === id);
      if (g) g.sort_order = i;
    });
    await commit(null);
  },
};
