# API website Terra (Supabase)

Website gọi thẳng Supabase (Postgres + Auth + Storage) qua lớp API typed trong `src/api/`. Không có server riêng:
phân quyền nằm trong database (Row Level Security), nên dù ai gọi trực tiếp Supabase bằng anon key cũng chỉ làm
được đúng những gì bảng dưới đây cho phép.

```
src/api/
  index.ts          điểm vào: export API công khai + `admin`
  public.ts         API công khai cho các trang (đọc nội dung, gửi form)
  admin/            API quản trị (cần đăng nhập admin)
    auth.ts  projects.ts  floorPlans.ts  news.ts  jobs.ts  inbox.ts  media.ts
  client.ts         ApiError, phân trang, tự rơi về dữ liệu mẫu khi lỗi
  rows.ts           kiểu dữ liệu từng bảng + chuyển sang kiểu giao diện
  validate.ts       kiểm tra dữ liệu (dùng chung với form)
src/hooks/useApiData.ts   hook React: useProjectList, useNewsList, useJobs, useFloorPlanSet
supabase/schema.sql       bảng, RLS, kho file, trigger
supabase/seed.sql         dữ liệu mẫu (sinh bởi scripts/seed/generate.mjs)
```

## Cài đặt

1. Tạo project trên [supabase.com](https://supabase.com), chép `.env.example` thành `.env` rồi điền
   `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
2. Supabase Dashboard → SQL Editor: chạy **`supabase/schema.sql`**, rồi **`supabase/seed.sql`**.
   Cả hai chạy lại nhiều lần được; chạy đè lên schema cũ (`supabase-schema.sql` trước đây) cũng được, dữ liệu cũ giữ nguyên.
3. Tạo tài khoản admin: Authentication → Users → *Add user* (email + mật khẩu), rồi trong SQL Editor:
   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email = 'admin@terra.vn';
   ```
4. Nên tắt tự đăng ký: Authentication → Providers → Email → bỏ chọn *Allow new users to sign up*. Không bắt buộc,
   vì user thường không có quyền gì thêm, nhưng tắt đi cho gọn.

Chưa cấu hình (thiếu `.env`) thì website vẫn chạy bằng dữ liệu mẫu trong `src/data/`; form báo gửi thành công
nhưng **không lưu** (`stored: false`).

## Dữ liệu

| Bảng | Nội dung | Khách (anon) | Admin |
|---|---|---|---|
| `projects` | Dự án + thông tin tổng quan (`overview` JSON), ảnh đại diện | đọc dự án `is_published` | toàn quyền |
| `project_gallery` | Ảnh "Không gian sống" (+ bản đồ độ sâu cho tham quan 3D) | đọc (của dự án đã xuất bản) | toàn quyền |
| `floor_plan_sets` / `floor_plans` | Mặt bằng: bộ mặc định theo loại hình, hoặc bộ riêng của một dự án | đọc | toàn quyền |
| `news` | Tin tức (`content` = mảng đoạn văn) | đọc bài `is_published` và đã tới `published_at` | toàn quyền |
| `jobs` | Vị trí tuyển dụng | đọc vị trí `is_open` | toàn quyền |
| `contact_submissions` | Yêu cầu tư vấn | **chỉ gửi**, không đọc lại được | đọc, đổi trạng thái, xoá |
| `job_applications` | Hồ sơ ứng tuyển | **chỉ gửi**, không đọc lại được | đọc, đổi trạng thái, xoá |
| `admin_users` | Danh sách admin | — | chỉ đọc (thêm qua SQL Editor) |

| Kho file | Nội dung | Khách | Admin |
|---|---|---|---|
| `media` (công khai) | Ảnh dự án / không gian sống / tin tức, ≤ 10MB, JPG/PNG/WebP/AVIF | xem | tải lên, xoá |
| `cv` (riêng tư) | File CV, ≤ 5MB, PDF/Word | chỉ tải lên vào `applications/` | xem (link có hạn), xoá |

Ràng buộc trong database (khách gửi thẳng từ trình duyệt cũng không vượt qua được):
- Họ tên 2–120 ký tự; SĐT 9–15 ký tự gồm số, `+`, khoảng trắng; email đúng dạng; nội dung ≤ 5000 ký tự.
- Khách không tự đặt được trạng thái hay ghi chú admin.
- Link CV phải là `http(s)://`.

Tự động:
- Gửi yêu cầu tư vấn kèm tên dự án → `projects.interest_count` của dự án đó +1 (sắp xếp "Quan tâm nhiều nhất").
- `updated_at` tự cập nhật khi sửa.
- Xoá dự án thì ảnh không gian sống và mặt bằng riêng của nó bị xoá theo.
- Xoá vị trí tuyển dụng thì hồ sơ vẫn giữ (`job_id` → null, tên vị trí lưu sẵn trong hồ sơ).

**Ảnh mẫu:** ảnh đang có trong web là file đóng gói nên không nằm trong database. Cột ảnh để trống thì web dùng ảnh
mẫu cùng id, hoặc ảnh minh hoạ theo loại hình. Dự án chưa có ảnh không gian sống trên database cũng dùng bộ ảnh mẫu
cùng id (kèm dữ liệu 3D), để chuyển nội dung sang database dần dần được.

## API công khai (`src/api/public.ts`)

Các hàm đọc trả về `{ data, source }`, với `source` là `'supabase'` hoặc `'mock'`. Gặp lỗi hoặc quá 5 giây thì tự
dùng dữ liệu mẫu, và cả phiên sau đó không chờ lại nữa.

| Hàm | Dùng ở | Trả về |
|---|---|---|
| `listProjects()` | Dự án, Trang chủ, Liên hệ | `Project[]` kèm `gallery`, `overview`, `image` |
| `getProject(id)` | — (Chi tiết dự án lấy từ danh sách) | `Project \| null` |
| `getFloorPlanSet(project)` | Chi tiết dự án (mặt bằng, tham quan 3D) | `FloorPlanSet`: bộ riêng → bộ theo loại hình → bộ mẫu |
| `listNews(category?)` | Tin tức, Chi tiết tin, Trang chủ | `NewsItem[]` mới nhất trước |
| `getNews(id)` | — | `NewsItem \| null` |
| `listJobs()` | Tuyển dụng | `Job[]` |
| `submitContact(payload)` | Liên hệ | `{ stored }` |
| `submitApplication(payload)` | Tuyển dụng | `{ stored }`; `cv_file` (File) được tải lên kho `cv` |

Trong component, dùng hook thay vì gọi trực tiếp. Mỗi loại dữ liệu chỉ tải một lần, các trang dùng chung:

```tsx
const { data: news, loading, source } = useNewsList();
const { data: jobs } = useJobs();
const planSet = useFloorPlanSet(project); // null khi đang tải
```

Lỗi luôn là `ApiError` với `message` tiếng Việt hiển thị được cho người dùng, và `code` là một trong:
`not_configured | validation | unauthorized | not_found | network | unknown`.

```ts
try {
  await submitApplication({ position: 'Kế toán tổng hợp', full_name, phone, email, cv_file: file });
} catch (e) {
  if (e instanceof ApiError && e.code === 'validation') showError(e.message);
}
```

## Trang quản trị (`/quan-tri`)

Giao diện cho API quản trị bên dưới, mã nguồn ở `src/admin/`, tách khỏi khung website và chỉ tải khi vào `/quan-tri`.

| Đường dẫn | Trang |
|---|---|
| `/quan-tri/dang-nhap` | Đăng nhập (email + mật khẩu của tài khoản có trong `admin_users`) |
| `/quan-tri` | Tổng quan: số yêu cầu / hồ sơ mới, yêu cầu và hồ sơ gần đây, thao tác nhanh |
| `/quan-tri/du-an`, `/du-an/moi`, `/du-an/:id` | Dự án: danh sách (tìm, lọc, ẩn/hiện), sửa thông tin + tổng quan + ảnh đại diện, ảnh không gian sống (tải nhiều ảnh, sắp xếp), mặt bằng riêng |
| `/quan-tri/mat-bang` | Bộ mặt bằng mặc định theo loại hình: sửa phòng theo mét, xem trước bản vẽ ngay bên cạnh |
| `/quan-tri/tin-tuc`, `/tin-tuc/moi`, `/tin-tuc/:id` | Tin tức: danh sách, soạn bài (ảnh bìa, nháp, hẹn giờ đăng, nhãn "Mới") |
| `/quan-tri/tuyen-dung` | Vị trí tuyển dụng: thêm / sửa / đóng / sắp xếp thứ tự |
| `/quan-tri/lien-he` | Yêu cầu tư vấn: lọc theo trạng thái, xem chi tiết, đổi trạng thái, ghi chú nội bộ |
| `/quan-tri/ung-tuyen` | Hồ sơ ứng tuyển: lọc theo trạng thái / vị trí, tải CV, đổi trạng thái, ghi chú |

**Chế độ xem thử:** chưa có `.env` thì trang quản trị chạy bằng `src/api/admin/demo.ts` (cùng các hàm và cùng quy tắc
kiểm tra với API thật), đăng nhập bằng email bất kỳ.
- Dữ liệu nằm trong kho `src/api/demoStore.ts`, khởi tạo từ dữ liệu mẫu và lưu trong localStorage của trình duyệt.
- Website đọc cùng kho này, nên nội dung thêm / sửa ở trang quản trị hiện ngay trên website. Form Liên hệ / Ứng tuyển
  gửi ở chế độ xem thử cũng vào hộp thư quản trị.
- Chỉ lưu trên trình duyệt đang dùng. Nút "Khôi phục dữ liệu mẫu" trên thanh báo đưa kho về ban đầu.
- Có `.env` thì tự chuyển sang Supabase thật.

## API quản trị (`admin.*`)

```ts
import { admin } from '../api';
await admin.auth.signIn('admin@terra.vn', '••••••••'); // không phải admin → ApiError 'unauthorized'
```

| Nhóm | Hàm |
|---|---|
| `admin.auth` | `signIn`, `signOut`, `getAdminSession`, `onAuthChange`, `requestPasswordReset`, `updatePassword` |
| `admin.projects` | `listProjects({ search, status, type, published, page, pageSize })`, `getProject`, `createProject`, `updateProject`, `deleteProject`; ảnh không gian sống: `listGallery`, `addGalleryItem`, `updateGalleryItem`, `deleteGalleryItem`, `reorderGallery` |
| `admin.floorPlans` | `listFloorPlanSets`, `saveFloorPlanSet({ building_type } \| { project_id }, …)`, `deleteFloorPlanSet`, `createFloorPlan`, `updateFloorPlan`, `deleteFloorPlan` (kiểm tra phòng nằm trong khung mặt bằng) |
| `admin.news` | `listNews({ search, category, published, page })`, `getNews`, `createNews`, `updateNews`, `deleteNews`. `published_at` ở tương lai = hẹn giờ đăng |
| `admin.jobs` | `listJobs`, `createJob`, `updateJob`, `deleteJob`, `reorderJobs` |
| `admin.inbox` | Liên hệ: `listContactSubmissions({ status, search, project, from, to, page })`, `updateContactSubmission(id, { status, admin_note })`, `deleteContactSubmission`. Hồ sơ: `listJobApplications({ status, jobId, search, page })`, `updateJobApplication`, `deleteJobApplication` (xoá cả file CV), `getCvDownloadUrl(cv_path)` (link 10 phút). `getInboxStats()` cho bảng điều khiển |
| `admin.media` | `uploadMedia(file, 'projects' \| 'gallery' \| 'news')` → `{ path, url }`, `deleteMedia(pathOrUrl)` |

Các hàm danh sách trả về `Page<T>`: `{ items, total, page, pageSize, totalPages }`.

Trạng thái xử lý:
- Liên hệ: `new → in_progress → done` (hoặc `spam`). Chuyển sang `done` thì tự ghi `handled_at`.
- Hồ sơ: `new → reviewing → interview → hired | rejected`.

Ví dụ: đăng tin kèm ảnh.

```ts
const { url } = await admin.media.uploadMedia(file, 'news');
await admin.news.createNews({ category: 'du-an', title: 'Mở bán đợt 2', content: ['Đoạn 1', 'Đoạn 2'], image_url: url });
```

## Cập nhật dữ liệu mẫu

Sửa `src/data/mockProjects.ts`, `mockNews.ts`, `mockJobs.ts` hoặc mặt bằng trong `projectDetails.ts`, rồi chạy:

```
node scripts/seed/generate.mjs
```

và chạy lại `supabase/seed.sql`. Seed upsert theo id, nên ghi đè nội dung mẫu nhưng không xoá dữ liệu admin đã thêm.

## Còn nằm trong code (chưa đưa lên database)

Đây là dữ liệu sinh tự động hoặc nội dung mẫu chung theo loại hình / tỉnh thành, không phải nội dung admin nhập theo
từng dự án:
- "Vị trí đắc địa" (kết nối, tuyến đường OSRM) và bản đồ vùng: `src/data/projectDetails.ts`, `projectRoutes.ts`, `maps/`.
- Tiện ích theo loại hình, ảnh hero, nội dung trang Giới thiệu.
- Dữ liệu độ sâu 3D của bộ ảnh mẫu: `src/data/photo3d.ts`.
