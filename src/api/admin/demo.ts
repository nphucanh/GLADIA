// Chế độ xem thử của trang quản trị — dùng khi CHƯA cấu hình Supabase (.env).
// Cài đặt đúng giao diện của API quản trị thật (cùng tên hàm, tham số, kiểu trả về, cùng quy tắc kiểm tra),
// dữ liệu nằm trong kho xem thử dùng chung với website (demoStore.ts, lưu trong localStorage của trình duyệt).
import type { Session, User } from '@supabase/supabase-js';
import type { NewsCategory } from '../../data/mockNews';
import { ApiError, toPage, pageRange, type Page } from '../client';
import { ensure } from '../validate';
import type {
  ContactSubmissionRow,
  FloorPlanRow,
  FloorPlanSetRow,
  GalleryRow,
  JobApplicationRow,
  JobRow,
  NewsRow,
  ProjectRow,
} from '../rows';
import type * as AuthApi from './auth';
import type * as ProjectsApi from './projects';
import type * as FloorPlansApi from './floorPlans';
import type * as NewsApi from './news';
import type * as JobsApi from './jobs';
import type * as InboxApi from './inbox';
import type * as MediaApi from './media';
import { validateProject, type ProjectFilter } from './projects';
import { validatePlan } from './floorPlans';
import { tidyNews, validateNews, type NewsFilter } from './news';
import { validateJob } from './jobs';
import { MEDIA_MAX_BYTES, MEDIA_MIME_TYPES } from '../validate';
import { demoDb, nextDemoId, nowIso, saveDemoDb } from '../demoStore';

// ---------- Kho dữ liệu (dùng chung với website) ----------

const D = demoDb;
const now = nowIso;
const nextId = nextDemoId;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const delay = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120)); // giả lập độ trễ mạng
/** Lưu kho rồi trả kết quả — dùng cho mọi thao tác ghi. */
const commit = <T>(v: T) => {
  saveDemoDb();
  return delay(v);
};

// ---------- Tiện ích truy vấn ----------

const like = (q: string | undefined, ...fields: (string | null)[]) => {
  const s = (q ?? '').trim().toLowerCase();
  return !s || fields.some((f) => (f ?? '').toLowerCase().includes(s));
};

function paginate<T>(rows: T[], f: { page?: number; pageSize?: number }): Page<T> {
  const { page, pageSize, from, to } = pageRange(f);
  return toPage(clone(rows.slice(from, to + 1)), rows.length, page, pageSize);
}

function find<T extends { id: number }>(rows: T[], id: number, what: string): T {
  const r = rows.find((x) => x.id === id);
  if (!r) throw new ApiError(`Không tìm thấy ${what}.`, 'not_found');
  return r;
}

const byOrder = <T extends { sort_order: number; id: number }>(a: T, b: T) => a.sort_order - b.sort_order || a.id - b.id;

// ---------- auth ----------

const SESSION_KEY = 'terra-admin-demo';
const listeners = new Set<(s: Session | null) => void>();
const fakeSession = (email: string) => {
  const user = { id: 'demo-admin', email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: now() } as User;
  return { user, session: { access_token: 'demo', refresh_token: 'demo', expires_in: 3600, token_type: 'bearer', user } as Session };
};
const readSession = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};

const auth: typeof AuthApi = {
  async signIn(email, password) {
    ensure([
      [/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), 'Email không hợp lệ.'],
      [password.length > 0, 'Vui lòng nhập mật khẩu.'],
    ]);
    try {
      sessionStorage.setItem(SESSION_KEY, email.trim());
    } catch {
      /* trình duyệt chặn lưu trữ — vẫn đăng nhập trong phiên hiện tại */
    }
    const s = fakeSession(email.trim());
    listeners.forEach((cb) => cb(s.session));
    return delay(s);
  },
  async signOut() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* bỏ qua */
    }
    listeners.forEach((cb) => cb(null));
  },
  async getAdminSession() {
    const email = readSession();
    return email ? fakeSession(email) : null;
  },
  onAuthChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  async requestPasswordReset() {
    await delay(null);
  },
  async updatePassword(pw) {
    if (pw.length < 8) throw new ApiError('Mật khẩu tối thiểu 8 ký tự.', 'validation');
    await delay(null);
  },
};

// ---------- D().projects ----------

const projectsApi: typeof ProjectsApi = {
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

// ---------- floor D().plans ----------

const withPlans = (s: FloorPlanSetRow): FloorPlanSetRow => ({ ...s, floor_plans: D().plans.filter((p) => p.set_id === s.id).sort(byOrder) });

const floorPlansApi: typeof FloorPlansApi = {
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

// ---------- D().news ----------

const newsApi: typeof NewsApi = {
  validateNews,
  tidyNews,
  async listNews(f: NewsFilter = {}) {
    const rows = D().news
      .filter((n) => like(f.search, n.title))
      .filter((n) => !f.category || n.category === f.category)
      .filter((n) => f.published === undefined || n.is_published === f.published)
      .sort((a, b) => b.published_at.localeCompare(a.published_at) || b.id - a.id);
    return delay(paginate(rows, f));
  },
  async getNews(id) {
    return delay(clone(find(D().news, id, 'bài viết')));
  },
  async createNews(input) {
    validateNews(input, true);
    const t = tidyNews(input);
    const row: NewsRow = {
      image_url: null,
      published_at: now().slice(0, 10),
      is_featured: false,
      is_published: true,
      ...t,
      category: t.category as NewsCategory,
      title: (t.title ?? '').trim(),
      content: t.content ?? [],
      id: nextId(),
      created_at: now(),
      updated_at: now(),
    };
    D().news.push(row);
    return commit(clone(row));
  },
  async updateNews(id, patch) {
    validateNews(patch, false);
    const n = find(D().news, id, 'bài viết');
    Object.assign(n, tidyNews(patch), { updated_at: now() });
    return commit(clone(n));
  },
  async deleteNews(id) {
    find(D().news, id, 'bài viết');
    D().news.splice(D().news.findIndex((n) => n.id === id), 1);
    await commit(null);
  },
};

// ---------- D().jobs ----------

const jobsApi: typeof JobsApi = {
  validateJob,
  async listJobs() {
    return delay(clone([...D().jobs].sort(byOrder)));
  },
  async createJob(input) {
    validateJob(input, true);
    const row: JobRow = {
      employment_type: 'Toàn thời gian',
      icon: 'building',
      is_open: true,
      sort_order: Math.max(-1, ...D().jobs.map((j) => j.sort_order)) + 1,
      ...input,
      id: nextId(),
      created_at: now(),
      updated_at: now(),
    };
    D().jobs.push(row);
    return commit(clone(row));
  },
  async updateJob(id, patch) {
    validateJob(patch, false);
    const j = find(D().jobs, id, 'vị trí');
    Object.assign(j, patch, { updated_at: now() });
    return commit(clone(j));
  },
  async deleteJob(id) {
    find(D().jobs, id, 'vị trí');
    D().jobs.splice(D().jobs.findIndex((j) => j.id === id), 1);
    D().applications.forEach((a) => {
      if (a.job_id === id) a.job_id = null;
    });
    await commit(null);
  },
  async reorderJobs(ids) {
    ids.forEach((id, i) => {
      const j = D().jobs.find((x) => x.id === id);
      if (j) j.sort_order = i;
    });
    await commit(null);
  },
};

// ---------- inbox ----------

const inboxApi: typeof InboxApi = {
  async listContactSubmissions(f = {}) {
    const rows = D().contacts
      .filter((c) => like(f.search, c.full_name, c.phone, c.email))
      .filter((c) => !f.status || c.status === f.status)
      .filter((c) => !f.project || c.project_interest === f.project)
      .filter((c) => !f.from || c.created_at >= f.from)
      .filter((c) => !f.to || c.created_at.slice(0, 10) <= f.to.slice(0, 10))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return delay(paginate(rows, f));
  },
  async updateContactSubmission(id, patch) {
    const c = find(D().contacts, id, 'yêu cầu');
    Object.assign(c, patch, { updated_at: now() });
    if (patch.status === 'done') c.handled_at = now();
    else if (patch.status) c.handled_at = null;
    return commit(clone(c));
  },
  async deleteContactSubmission(id) {
    find(D().contacts, id, 'yêu cầu');
    D().contacts.splice(D().contacts.findIndex((c) => c.id === id), 1);
    await commit(null);
  },
  async listJobApplications(f = {}) {
    const rows = D().applications
      .filter((a) => like(f.search, a.full_name, a.phone, a.email, a.position))
      .filter((a) => !f.status || a.status === f.status)
      .filter((a) => !f.jobId || a.job_id === f.jobId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return delay(paginate(rows, f));
  },
  async updateJobApplication(id, patch) {
    const a = find(D().applications, id, 'hồ sơ');
    Object.assign(a, patch, { updated_at: now() });
    return commit(clone(a));
  },
  async deleteJobApplication(id) {
    find(D().applications, id, 'hồ sơ');
    D().applications.splice(D().applications.findIndex((a) => a.id === id), 1);
    await commit(null);
  },
  async getCvDownloadUrl(cvPath) {
    const text = `Chế độ xem thử — đây là file thay thế cho "${cvPath}".\nKhi kết nối Supabase, nút này tải file CV thật của ứng viên.`;
    return URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  },
  async getInboxStats() {
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    return delay({
      newContacts: D().contacts.filter((c) => c.status === 'new').length,
      newApplications: D().applications.filter((a) => a.status === 'new').length,
      contactsLast7Days: D().contacts.filter((c) => c.created_at >= since).length,
      applicationsLast7Days: D().applications.filter((a) => a.created_at >= since).length,
    });
  },
};

// ---------- media ----------

const mediaApi: typeof MediaApi = {
  async uploadMedia(file, folder) {
    ensure([
      [file.size <= MEDIA_MAX_BYTES, 'Ảnh tối đa 10MB.'],
      [MEDIA_MIME_TYPES.includes(file.type), 'Chỉ nhận ảnh JPG, PNG, WebP hoặc AVIF.'],
    ]);
    // Kho xem thử nằm trong localStorage (giới hạn vài MB) → thu ảnh về tối đa 1600px, lưu dạng data URL
    return delay({ path: `${folder}/${file.name}`, url: await shrinkImage(file) });
  },
  mediaPathFromUrl: () => null,
  async deleteMedia() {
    await delay(null);
  },
  ApiError,
};

async function shrinkImage(file: File, max = 1600): Promise<string> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    const webp = c.toDataURL('image/webp', 0.82);
    return webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', 0.85);
  } catch {
    throw new ApiError('Không đọc được ảnh này, hãy thử ảnh khác.', 'validation');
  }
}

export const demoAdmin = {
  auth,
  projects: projectsApi,
  floorPlans: floorPlansApi,
  news: newsApi,
  jobs: jobsApi,
  inbox: inboxApi,
  media: mediaApi,
};
