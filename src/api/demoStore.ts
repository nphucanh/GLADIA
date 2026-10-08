// Kho dữ liệu của CHẾ ĐỘ XEM THỬ (chưa cấu hình Supabase).
// Trang quản trị (api/admin/demo/) ghi vào đây, website (api/public/) đọc từ đây — nên dự án / tin / vị trí thêm ở
// trang quản trị hiện ngay trên website. Lưu trong localStorage của trình duyệt: giữ qua các lần tải trang và
// giữa các tab, nhưng chỉ trên máy này. Khởi tạo từ dữ liệu mẫu (src/data/*).
import { mockProjects } from '../data/mockProjects';
import { mockNews } from '../data/mockNews';
import { mockJobs } from '../data/mockJobs';
import { getFloorPlans } from '../data/projectDetails';
import type { BuildingType } from '../types';
import { ApiError } from './client';
import type {
  AdminUserRow,
  ApplicationStatus,
  ContactStatus,
  ContactSubmissionRow,
  FloorPlanRow,
  FloorPlanSetRow,
  GalleryRow,
  JobApplicationRow,
  JobRow,
  NewsRow,
  ProjectRow,
} from './rows';

export interface DemoDb {
  signature: string;
  seq: number;
  projects: ProjectRow[];
  gallery: GalleryRow[];
  sets: FloorPlanSetRow[];
  plans: FloorPlanRow[];
  news: NewsRow[];
  jobs: JobRow[];
  contacts: ContactSubmissionRow[];
  applications: JobApplicationRow[];
  /** Lượt xem theo ngày — xem demoViews(). Kho cũ chưa có thì tạo khi cần. */
  views?: DemoViews;
  /** Người quản trị — xem demoAdmins(). Kho cũ chưa có thì tạo khi cần. */
  admins?: AdminUserRow[];
}

/** items["project:1"][i] = số lượt xem ngày (base + i). */
export interface DemoViews {
  base: string;
  items: Record<string, number[]>;
}

const KEY = 'terra-demo-db-v1';
// Ảnh mẫu là file đóng gói (đường dẫn đổi theo bản build) → đường dẫn ảnh mẫu đổi thì khởi tạo lại kho
const SIGNATURE = [mockProjects[0]?.gallery?.[0]?.image, mockNews[0]?.image, mockProjects.length, mockNews.length].join('|');

export const nowIso = () => new Date().toISOString();
const daysAgo = (d: number, h = 9) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, 12, 0, 0);
  return t.toISOString();
};
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

function seed(): DemoDb {
  let seq = 1000;
  const nextId = () => ++seq;

  const projects: ProjectRow[] = mockProjects.map((p, i) => ({
    id: Number(p.id),
    name: p.name,
    type: p.type,
    location: p.location,
    status: p.status,
    price: p.price,
    interest_count: p.interest,
    popularity: p.popular,
    building_type: p.building,
    description: p.description ?? null,
    overview: p.overview ?? null,
    cover_image_url: null,
    is_published: true,
    sort_order: i,
    created_at: `${p.date}T09:00:00.000Z`,
    updated_at: `${p.date}T09:00:00.000Z`,
  }));

  const gallery: GalleryRow[] = mockProjects.flatMap((p) =>
    (p.gallery ?? []).map((g, i) => ({
      id: nextId(),
      project_id: Number(p.id),
      room: g.room,
      description: g.description,
      image_url: g.image,
      depth_url: g.photo3d?.depth ?? null,
      sort_order: i,
      created_at: nowIso(),
    })),
  );

  const sets: FloorPlanSetRow[] = [];
  const plans: FloorPlanRow[] = [];
  (['apartment', 'villa', 'land', 'shophouse'] as BuildingType[]).forEach((building) => {
    const s = getFloorPlans({ building } as never);
    const id = nextId();
    sets.push({ id, building_type: building, project_id: null, title: s.title, intro: s.intro, updated_at: nowIso() });
    s.plans.forEach((p, i) =>
      plans.push({
        id: nextId(),
        set_id: id,
        slug: p.id,
        name: p.name,
        code: p.code,
        area: p.area,
        bedrooms: p.bedrooms ?? null,
        bathrooms: p.bathrooms ?? null,
        note: p.note,
        width: p.width,
        depth: p.depth,
        rooms: clone(p.rooms),
        sort_order: i,
      }),
    );
  });

  const news: NewsRow[] = mockNews.map((n) => ({
    id: n.id,
    category: n.category,
    title: n.title,
    content: [...n.content],
    image_url: n.image,
    published_at: n.date,
    is_featured: Boolean(n.isNew),
    is_published: true,
    created_at: `${n.date}T08:00:00.000Z`,
    updated_at: `${n.date}T08:00:00.000Z`,
  }));

  const jobs: JobRow[] = mockJobs.map((j, i) => ({
    id: j.id,
    title: j.title,
    location: j.location,
    employment_type: j.employment,
    summary: j.body,
    icon: j.icon,
    is_open: true,
    sort_order: i,
    created_at: daysAgo(40),
    updated_at: daysAgo(40),
  }));

  const contact = (
    d: number,
    full_name: string,
    phone: string,
    email: string,
    project_interest: string | null,
    topic: string,
    message: string | null,
    status: ContactStatus = 'new',
    admin_note: string | null = null,
  ): ContactSubmissionRow => ({
    id: nextId(),
    full_name,
    phone,
    email,
    project_interest,
    topic,
    message,
    status,
    admin_note,
    handled_at: status === 'done' ? daysAgo(d - 1) : null,
    created_at: daysAgo(d, 8 + (d % 9)),
    updated_at: daysAgo(d),
  });
  const contacts: ContactSubmissionRow[] = [
    contact(0, 'Nguyễn Minh Anh', '0903123456', 'minhanh@gmail.com', 'Terra Riverside', 'Đặt lịch xem nhà mẫu', 'Tôi muốn xem căn 2 phòng ngủ vào cuối tuần này, buổi sáng.'),
    contact(1, 'Trần Quốc Bảo', '0912888777', 'baotq@outlook.com', 'Terra Hills Villa', 'Chính sách vay vốn / thanh toán', 'Cho tôi hỏi chính sách hỗ trợ lãi suất khi mua biệt thự.'),
    contact(1, 'Lê Thu Hà', '0987654321', 'ha.le@company.vn', 'Lakeview Residence', 'Thông tin dự án & bảng giá', null, 'in_progress', 'Đã gửi bảng giá qua email, hẹn gọi lại thứ 5.'),
    contact(3, 'Phạm Đức Long', '0938111222', 'longpd@gmail.com', null, 'Pháp lý & sổ hồng', 'Dự án Emerald Riverside đã có sổ hồng chưa?', 'done', 'Đã tư vấn qua điện thoại.'),
    contact(5, 'Võ Thị Mai', '0909000111', 'maivo@yahoo.com', 'Golden Sand Land', 'Thông tin dự án & bảng giá', 'Gửi giúp tôi bảng giá các nền góc.', 'done'),
    contact(8, 'abc', '0900000000', 'test@test.com', null, 'Khác', 'test test test', 'spam'),
    contact(12, 'Hoàng Gia Huy', '0977333444', 'huyhg@gmail.com', 'Terra Coastal Villas', 'Đặt lịch xem nhà mẫu', 'Gia đình tôi muốn tham quan dự án vào tháng sau.', 'done'),
  ];

  const application = (
    d: number,
    job: JobRow | null,
    full_name: string,
    phone: string,
    email: string,
    cv: { url?: string; file?: string },
    message: string | null,
    status: ApplicationStatus = 'new',
    admin_note: string | null = null,
  ): JobApplicationRow => ({
    id: nextId(),
    job_id: job?.id ?? null,
    position: job?.title ?? 'Vị trí khác',
    full_name,
    phone,
    email,
    cv_url: cv.url ?? null,
    cv_path: cv.file ? `applications/${cv.file}` : null,
    message,
    status,
    admin_note,
    created_at: daysAgo(d, 10 + (d % 7)),
    updated_at: daysAgo(d),
  });
  const applications: JobApplicationRow[] = [
    application(0, jobs[0], 'Đặng Hoài Nam', '0905123123', 'namdh@gmail.com', { file: 'cv-dang-hoai-nam.pdf' }, 'Tôi có 3 năm kinh nghiệm bán căn hộ cao cấp tại TP.HCM.'),
    application(2, jobs[1], 'Bùi Ngọc Lan', '0916222333', 'lan.bui@gmail.com', { url: 'https://www.linkedin.com/in/ngoclan' }, null, 'reviewing'),
    application(4, jobs[2], 'Ngô Văn Thành', '0938444555', 'thanhnv@gmail.com', { file: 'thanh-ngo-cv.docx' }, 'Kỹ sư xây dựng, 5 năm giám sát nhà cao tầng.', 'interview', 'Hẹn phỏng vấn 9h thứ 3.'),
    application(9, jobs[5], 'Mai Thanh Trúc', '0909888999', 'truc.mai@gmail.com', { file: 'cv-mai-thanh-truc.pdf' }, null, 'rejected'),
    application(15, null, 'Lý Minh Khôi', '0981555666', 'khoily@gmail.com', { url: 'https://portfolio.example.com/khoi' }, 'Mong muốn ứng tuyển vị trí thiết kế nội thất.', 'new'),
  ];

  return { signature: SIGNATURE, seq, projects, gallery, sets, plans, news, jobs, contacts, applications };
}

let db: DemoDb | null = null;

function readStored(): DemoDb | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoDb;
    return parsed.signature === SIGNATURE && Array.isArray(parsed.projects) ? parsed : null;
  } catch {
    return null; // trình duyệt chặn lưu trữ / dữ liệu hỏng → dùng dữ liệu mẫu
  }
}

/** Kho dữ liệu xem thử (đọc localStorage, chưa có thì khởi tạo từ dữ liệu mẫu). */
export function demoDb(): DemoDb {
  if (!db) db = readStored() ?? seed();
  return db;
}

/** Lưu kho xuống localStorage (gọi sau mỗi thay đổi). */
export function saveDemoDb() {
  if (!db) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch (e) {
    const quota = e instanceof DOMException && /quota/i.test(e.name + e.message);
    throw new ApiError(
      quota
        ? 'Bộ nhớ của chế độ xem thử đã đầy (thường do ảnh). Hãy xoá bớt ảnh hoặc khôi phục dữ liệu mẫu.'
        : 'Trình duyệt không cho lưu dữ liệu xem thử — thay đổi chỉ còn đến khi tải lại trang.',
      'unknown',
      e,
    );
  }
}

/** Xoá mọi thay đổi, quay về dữ liệu mẫu ban đầu. */
export function resetDemoDb() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* bỏ qua */
  }
  db = seed();
}

/** Trang khác (tab khác) vừa sửa kho → đọc lại ở lần truy cập sau. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) db = null;
  });
}

export const nextDemoId = () => ++demoDb().seq;

// ---------- Người quản trị (xem thử) ----------

/** id cố định của người đang đăng nhập ở chế độ xem thử (đăng nhập bằng email bất kỳ). */
export const DEMO_SELF_ID = 'demo-admin';

/** Danh sách người quản trị mẫu; người đang đăng nhập luôn là owner đầu tiên. */
export function demoAdmins(selfEmail: string): AdminUserRow[] {
  const d = demoDb();
  if (!d.admins) {
    const person = (id: string, email: string, full_name: string, role: 'owner' | 'editor', is_active: boolean, days: number, lastSeen: number | null): AdminUserRow => ({
      user_id: id,
      email,
      full_name,
      phone: null,
      avatar_url: null,
      role,
      is_active,
      created_at: daysAgo(days),
      last_sign_in_at: lastSeen === null ? null : daysAgo(lastSeen, 15),
    });
    d.admins = [
      person(DEMO_SELF_ID, selfEmail, 'Quản trị viên', 'owner', true, 240, 0),
      person('demo-editor-1', 'bientap@terra.vn', 'Nguyễn Minh Anh', 'editor', true, 120, 1),
      person('demo-editor-2', 'tuyendung@terra.vn', 'Trần Thu Trang', 'editor', true, 60, 6),
      person('demo-editor-3', 'ctv.noidung@terra.vn', 'Lê Quốc Bảo', 'editor', false, 30, null),
    ];
  }
  const self = d.admins.find((a) => a.user_id === DEMO_SELF_ID);
  if (self) {
    self.email = selfEmail;
    self.last_sign_in_at = self.last_sign_in_at ?? nowIso();
  }
  return d.admins;
}

// ---------- Lượt xem (thống kê) ----------

/** Ngày theo giờ Việt Nam (YYYY-MM-DD), lệch `offset` ngày so với hôm nay. */
export function vnDay(offset = 0) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  return shiftDay(today, offset);
}
export function shiftDay(isoDay: string, offset: number) {
  const d = new Date(`${isoDay}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}
export const dayDiff = (a: string, b: string) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 864e5);

const HISTORY_DAYS = 180;

/** Lịch sử lượt xem mẫu: tỉ lệ theo độ quan tâm của dự án, bài mới đăng được đọc nhiều hơn, cuối tuần đông hơn. */
function seedViews(d: DemoDb): DemoViews {
  const base = vnDay(-(HISTORY_DAYS - 1));
  let s = 7;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const items: Record<string, number[]> = {};
  const weekend = (i: number) => {
    const w = new Date(`${shiftDay(base, i)}T00:00:00Z`).getUTCDay();
    return w === 0 || w === 6 ? 1.35 : 1;
  };
  const growth = (i: number) => 0.7 + (0.3 * i) / HISTORY_DAYS;
  for (const p of d.projects) {
    const level = 2 + Math.sqrt(Math.max(p.interest_count, 1)) / 2.2;
    items[`project:${p.id}`] = Array.from({ length: HISTORY_DAYS }, (_, i) => Math.round(level * weekend(i) * growth(i) * (0.55 + rand() * 0.9)));
  }
  for (const n of d.news) {
    const start = dayDiff(n.published_at, base);
    const level = n.is_featured ? 9 : 4 + rand() * 4;
    items[`news:${n.id}`] = Array.from({ length: HISTORY_DAYS }, (_, i) => {
      const age = i - start;
      if (age < 0) return 0;
      return Math.round((level * 6) / (1 + age / 4) + level * 0.25 * weekend(i) * (0.4 + rand() * 1.2));
    });
  }
  return { base, items };
}

/** Lượt xem của kho xem thử (tạo lịch sử mẫu ở lần đầu). */
export function demoViews(): DemoViews {
  const d = demoDb();
  if (!d.views) {
    d.views = seedViews(d);
    try {
      saveDemoDb();
    } catch {
      /* chỉ là số liệu mẫu */
    }
  }
  return d.views;
}

/** Số lượt xem của một dự án / bài viết vào một ngày. */
export function demoViewsOn(kind: 'project' | 'news', id: number, day: string) {
  const v = demoViews();
  return v.items[`${kind}:${id}`]?.[dayDiff(day, v.base)] ?? 0;
}

/** Website (chế độ xem thử) ghi 1 lượt xem. */
export function addDemoView(kind: 'project' | 'news', id: number) {
  const v = demoViews();
  const i = dayDiff(vnDay(), v.base);
  if (i < 0) return;
  const arr = (v.items[`${kind}:${id}`] ??= []);
  while (arr.length <= i) arr.push(0);
  arr[i] += 1;
  saveDemoDb();
}
