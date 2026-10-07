// API công khai cho các trang của website (không cần đăng nhập).
// Đọc: tự rơi về dữ liệu mẫu khi chưa cấu hình Supabase / lỗi. Ghi (form): kiểm tra dữ liệu rồi gửi lên Supabase.
import type { ContactPayload, Job, JobApplicationPayload, Project } from '../types';
import type { FloorPlanSet } from '../data/projectDetails';
import type { NewsCategory, NewsItem } from '../data/mockNews';
import { getFloorPlans as staticFloorPlans } from '../data/projectDetails';
import { mockProjects } from '../data/mockProjects';
import { mockNews } from '../data/mockNews';
import { mockJobs } from '../data/mockJobs';
import { ApiError, db, isSupabaseConfigured, readOrMock, toApiError, unwrap, type Sourced } from './client';
import { CV_MAX_BYTES, CV_MIME_TYPES, clean, ensure, isValidEmail, isValidName, isValidPhone, isValidUrl, uniqueName } from './validate';
import { toFloorPlanSet, toJob, toNewsItem, toProject, type FloorPlanSetRow, type JobRow, type NewsRow, type ProjectRow } from './rows';
import { demoDb, nextDemoId, nowIso, saveDemoDb } from './demoStore';

const byDateDesc = (a: NewsItem, b: NewsItem) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id);

// ============================================================
// Dữ liệu dự phòng khi không đọc được Supabase.
// Chưa cấu hình Supabase (chế độ xem thử) → đọc kho xem thử dùng chung với trang quản trị (demoStore.ts), nên
// nội dung thêm / sửa ở /quan-tri hiện ngay trên website. Đã cấu hình nhưng lỗi mạng → dữ liệu mẫu cố định.
// Lọc giống phân quyền trên database: chỉ dự án đã xuất bản, bài đã đăng & tới ngày, vị trí đang mở.
// ============================================================

const isDemo = !isSupabaseConfigured;
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const byOrder = <T extends { sort_order: number; id: number }>(a: T, b: T) => a.sort_order - b.sort_order || a.id - b.id;

export function fallbackProjects(): Project[] {
  if (!isDemo) return mockProjects;
  const d = demoDb();
  return d.projects
    .filter((p) => p.is_published)
    .sort((a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at))
    .map((p) => toProject({ ...p, project_gallery: d.gallery.filter((g) => g.project_id === p.id) }));
}

export function fallbackNews(): NewsItem[] {
  if (!isDemo) return [...mockNews].sort(byDateDesc);
  const today = todayIso();
  return demoDb()
    .news.filter((n) => n.is_published && n.published_at <= today)
    .map(toNewsItem)
    .sort(byDateDesc);
}

export function fallbackJobs(): Job[] {
  if (!isDemo) return mockJobs;
  return demoDb()
    .jobs.filter((j) => j.is_open)
    .sort(byOrder)
    .map(toJob);
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

// ============================================================
// Dự án — trang Dự án, Chi tiết dự án, Trang chủ, form Liên hệ (danh sách dự án)
// ============================================================

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

// ============================================================
// Tin tức — trang Tin tức, Chi tiết tin, Trang chủ
// ============================================================

/** Bài viết đã đăng, mới nhất trước; lọc theo chuyên mục nếu có. */
export function listNews(category?: NewsCategory): Promise<Sourced<NewsItem[]>> {
  return readOrMock(
    'tin tức',
    async (c) => {
      let q = c.from('news').select('*').order('published_at', { ascending: false }).order('id', { ascending: false });
      if (category) q = q.eq('category', category);
      return unwrap<NewsRow[]>(await q).map(toNewsItem);
    },
    () => fallbackNews().filter((n) => !category || n.category === category),
  );
}

/** Một bài viết theo id; null nếu không có / chưa đăng. */
export function getNews(id: number): Promise<Sourced<NewsItem | null>> {
  return readOrMock(
    `bài viết #${id}`,
    async (c) => {
      const row = unwrap<NewsRow | null>(await c.from('news').select('*').eq('id', id).maybeSingle());
      return row ? toNewsItem(row) : null;
    },
    () => fallbackNews().find((n) => n.id === id) ?? null,
  );
}

// ============================================================
// Tuyển dụng — trang Tuyển dụng
// ============================================================

/** Các vị trí đang mở, theo thứ tự hiển thị. */
export function listJobs(): Promise<Sourced<Job[]>> {
  return readOrMock(
    'vị trí tuyển dụng',
    async (c) =>
      unwrap<JobRow[]>(
        await c.from('jobs').select('*').order('sort_order', { ascending: true }).order('id', { ascending: true }),
      ).map(toJob),
    fallbackJobs,
  );
}

// ============================================================
// Form
// ============================================================

export interface SubmitResult {
  stored: boolean; // false = chưa cấu hình Supabase (bản demo) — dữ liệu không được lưu
}

/** Gửi yêu cầu tư vấn (form Liên hệ). Gửi kèm tên dự án → tăng lượt quan tâm của dự án đó. */
export async function submitContact(payload: ContactPayload): Promise<SubmitResult> {
  ensure([
    [isValidName(payload.full_name), 'Vui lòng nhập họ tên (2–120 ký tự).'],
    [isValidPhone(payload.phone), 'Số điện thoại không hợp lệ (9–11 chữ số).'],
    [isValidEmail(payload.email), 'Email không hợp lệ.'],
    [payload.topic.trim().length > 0 && payload.topic.length <= 200, 'Vui lòng chọn chủ đề.'],
    [(payload.message ?? '').length <= 5000, 'Nội dung tối đa 5000 ký tự.'],
  ]);
  if (!isSupabaseConfigured) {
    const d = demoDb();
    const project = clean(payload.project_interest);
    d.contacts.push({
      id: nextDemoId(),
      full_name: payload.full_name.trim(),
      phone: payload.phone.replace(/\s/g, ''),
      email: payload.email.trim(),
      project_interest: project,
      topic: payload.topic.trim(),
      message: clean(payload.message),
      status: 'new',
      admin_note: null,
      handled_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    // như trigger trên database: tăng lượt quan tâm của dự án được chọn
    d.projects.forEach((p) => {
      if (p.name === project) p.interest_count += 1;
    });
    saveDemoDb();
    return { stored: false };
  }
  try {
    unwrap(
      await db()
        .from('contact_submissions')
        .insert({
          full_name: payload.full_name.trim(),
          phone: payload.phone.replace(/\s/g, ''),
          email: payload.email.trim(),
          project_interest: clean(payload.project_interest),
          topic: payload.topic.trim(),
          message: clean(payload.message),
        }),
    );
    return { stored: true };
  } catch (err) {
    throw toApiError(err);
  }
}

/**
 * Nộp hồ sơ ứng tuyển. File CV (PDF/Word ≤ 5MB) được tải lên kho riêng tư "cv" — chỉ admin xem được.
 */
export async function submitApplication(payload: JobApplicationPayload): Promise<SubmitResult> {
  const file = payload.cv_file ?? null;
  const cvUrl = clean(payload.cv_url);
  ensure([
    [isValidName(payload.full_name), 'Vui lòng nhập họ tên (2–120 ký tự).'],
    [isValidPhone(payload.phone), 'Số điện thoại không hợp lệ (9–11 chữ số).'],
    [isValidEmail(payload.email), 'Email không hợp lệ.'],
    [!cvUrl || isValidUrl(cvUrl), 'Link CV / portfolio phải bắt đầu bằng http:// hoặc https://'],
    [!file || file.size <= CV_MAX_BYTES, 'File CV tối đa 5MB.'],
    [!file || CV_MIME_TYPES.includes(file.type), 'File CV phải là PDF hoặc Word (.doc, .docx).'],
    [(payload.message ?? '').length <= 5000, 'Lời nhắn tối đa 5000 ký tự.'],
  ]);
  if (!isSupabaseConfigured) {
    demoDb().applications.push({
      id: nextDemoId(),
      job_id: payload.job_id ?? null,
      position: clean(payload.position) ?? 'Vị trí khác',
      full_name: payload.full_name.trim(),
      phone: payload.phone.replace(/\s/g, ''),
      email: payload.email.trim(),
      cv_url: cvUrl,
      cv_path: file ? `applications/${uniqueName(file.name)}` : null,
      message: clean(payload.message),
      status: 'new',
      admin_note: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    saveDemoDb();
    return { stored: false };
  }
  try {
    const client = db();
    let cvPath: string | null = null;
    if (file) {
      cvPath = `applications/${uniqueName(file.name)}`;
      const up = await client.storage.from('cv').upload(cvPath, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
    }
    unwrap(
      await client.from('job_applications').insert({
        job_id: payload.job_id ?? null,
        position: clean(payload.position) ?? 'Vị trí khác',
        full_name: payload.full_name.trim(),
        phone: payload.phone.replace(/\s/g, ''),
        email: payload.email.trim(),
        cv_url: cvUrl,
        cv_path: cvPath,
        message: clean(payload.message),
      }),
    );
    return { stored: true };
  } catch (err) {
    throw toApiError(err);
  }
}

export { ApiError };
