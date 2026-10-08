# API website Terra (Supabase)

Website gọi thẳng Supabase (Postgres + Auth + Storage) qua lớp API typed trong `src/api/`. Không có server riêng:
phân quyền nằm trong database (Row Level Security), nên dù ai gọi trực tiếp Supabase bằng anon key cũng chỉ làm
được đúng những gì bảng dưới đây cho phép.

```
src/api/
  index.ts          điểm vào: export API công khai + `admin`
  public/           API công khai cho website, chia theo trang (không cần đăng nhập)
    projects.ts       Trang chủ, Dự án, Chi tiết dự án, Liên hệ
    news.ts           Trang chủ, Tin tức, Chi tiết tin
    careers.ts        Tuyển dụng (danh sách vị trí + nộp hồ sơ)
    contact.ts        Liên hệ (gửi yêu cầu tư vấn)
    tracking.ts       Chi tiết dự án / tin (đếm lượt xem)
    shared.ts         tiện ích dùng chung
  admin/            API quản trị (cần đăng nhập admin), chia theo trang quản trị — CHỈ src/admin/ được import
    auth.ts           Đăng nhập
    stats.ts          Tổng quan, Thống kê
    projects.ts       Dự án (+ ảnh không gian sống)
    floorPlans.ts     Mặt bằng (bộ mặc định + bộ riêng của dự án)
    news.ts           Tin tức
    jobs.ts           Tuyển dụng
    contacts.ts       Yêu cầu tư vấn
    applications.ts   Hồ sơ ứng tuyển (+ link tải CV)
    inbox.ts          số yêu cầu / hồ sơ mới (Tổng quan, thanh bên)
    account.ts        Tài khoản của tôi (hồ sơ, đổi mật khẩu)
    users.ts          Người quản trị (chỉ chủ sở hữu)
    media.ts          tải ảnh (dùng chung)
    demo/             bản xem thử (khi chưa có .env) — mỗi file ứng với file cùng tên ở trên
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
3. Tạo admin ĐẦU TIÊN (chủ sở hữu): Authentication → Users → *Add user* (email + mật khẩu), rồi trong SQL Editor:
   ```sql
   insert into public.admin_users (user_id, email, role)
   select id, email, 'owner' from auth.users where email = 'admin@terra.vn';
   ```
   Các admin sau: chủ sở hữu thêm ngay ở **Quản trị › Người quản trị**. Database đã cài từ trước: chạy thêm
   **`supabase/update-nguoi-dung.sql`** (admin có sẵn thành chủ sở hữu).
   Muốn tạo tài khoản mới ngay trên trang quản trị (kèm mật khẩu tạm), deploy Edge Function một lần:
   ```
   npx supabase login
   npx supabase functions deploy admin-create-user --project-ref <ref> --no-verify-jwt
   ```
   (`<ref>` là phần đầu của `VITE_SUPABASE_URL`.) Function dùng khoá `service_role` do Supabase tự cấp trên máy chủ,
   không bao giờ nằm ở trình duyệt. Chưa deploy thì vẫn "cấp quyền cho tài khoản có sẵn" được.
   Tạo bằng Dashboard › Edge Functions › *Via Editor* thì Supabase có thể tự đặt đường dẫn khác tên (vd. tên
   `admin-create-user` nhưng URL `…/functions/v1/smooth-processor`): khai báo `VITE_ADMIN_CREATE_USER_FN=smooth-processor`
   trong `.env` rồi chạy lại `npm run dev` / build lại. Nhớ tắt *Enforce JWT verification* của function.
4. Nên tắt tự đăng ký: Authentication → Providers → Email → bỏ chọn *Allow new users to sign up*. Không bắt buộc,
   vì user thường không có quyền gì thêm, nhưng tắt đi cho gọn.

### Tự đồng bộ schema khi sửa code

Không cần dán SQL vào SQL Editor mỗi lần sửa. Thêm vào `.env` (chỉ trên máy lập trình, **không** có tiền tố `VITE_`):

```
SUPABASE_DB_URL=postgresql://postgres.<ref>:<mật-khẩu-database>@aws-0-<vùng>.pooler.supabase.com:5432/postgres
```

Lấy ở Project Settings → Database → Connection string → **Session pooler** (mật khẩu đặt lại được ở cùng trang).

| Lệnh | Việc |
|---|---|
| `npm run dev` | Ngoài chạy website: tự áp `supabase/schema.sql` khi khởi động (nếu file đã đổi) và **mỗi lần lưu file** |
| `npm run db:push` | Áp `schema.sql` một lần (bỏ qua nếu không đổi; `-- --force` để áp lại) |
| `npm run db:watch` | Chỉ theo dõi `schema.sql`, không chạy website |
| `npm run db:seed -- --yes` | Nạp `seed.sql`. **Ghi đè** dự án / bài / vị trí mẫu theo id, nên không bao giờ tự chạy |

- Cả file chạy trong một giao dịch: câu nào lỗi thì **không thay đổi gì**, terminal (và trình duyệt khi đang `npm run dev`)
  báo đúng dòng lỗi kèm đoạn mã.
- `schema.sql` phải luôn chạy lại được (`if not exists`, `create or replace`, `drop policy if exists`…). Xoá một bảng /
  cột khỏi file **không** xoá nó trên database. Muốn xoá thì viết rõ `drop … if exists` trong file.
- Không có `SUPABASE_DB_URL` thì mọi thứ chạy như cũ, chỉ không tự đồng bộ.

Chưa cấu hình (thiếu `.env`) thì website vẫn chạy bằng dữ liệu mẫu trong `src/data/`; form báo gửi thành công
nhưng **không lưu** (`stored: false`).

## API theo từng trang

Bảng tra nhanh: mở trang nào thì gọi hàm nào, nằm ở file nào, đụng tới bảng nào trên database.
Muốn sửa dữ liệu của một trang, tìm trang đó ở đây rồi mở đúng file.

### Website

Danh sách dự án được tải **một lần cho cả website** (`ProjectsProvider` trong `App.tsx` → `useProjectList`), các trang
dùng chung qua `useProjectsContext()`. Tin tức và vị trí tuyển dụng cũng chỉ tải một lần rồi dùng lại (`src/hooks/useApiData.ts`).

| Trang | Đường dẫn | Đọc | Ghi | File API | Bảng / hàm database |
|---|---|---|---|---|---|
| Trang chủ | `/` | `listProjects`, `listNews` | — | `public/projects.ts`, `public/news.ts` | `projects`, `project_gallery`, `news` |
| Giới thiệu | `/gioi-thieu` | — (nội dung trong code) | — | — | — |
| Dự án | `/du-an` | `listProjects` | — | `public/projects.ts` | `projects`, `project_gallery` |
| Chi tiết dự án | `/du-an/:id` | `listProjects`, `getProject` (khi dự án chưa có trong danh sách), `getFloorPlanSet` | `trackView('project', id)` | `public/projects.ts`, `public/tracking.ts` | `projects`, `project_gallery`, `floor_plan_sets`, `floor_plans`, hàm `track_view` |
| Tin tức | `/tin-tuc` | `listNews` | — | `public/news.ts` | `news` |
| Chi tiết tin | `/tin-tuc/:id` | `listNews` | `trackView('news', id)` | `public/news.ts`, `public/tracking.ts` | `news`, hàm `track_view` |
| Tuyển dụng | `/tuyen-dung` | `listJobs` | `submitApplication` | `public/careers.ts` | `jobs`, `job_applications`, kho `cv` |
| Liên hệ | `/lien-he` | `listProjects` (ô chọn dự án) | `submitContact` | `public/projects.ts`, `public/contact.ts` | `projects`, `contact_submissions` |

### Trang quản trị (`/quan-tri`)

Mọi hàm gọi qua `admin.<nhóm>.<hàm>`; file nằm ở `src/api/admin/<nhóm>.ts` (chế độ xem thử: `src/api/admin/demo/<nhóm>.ts`).

| Trang | Đường dẫn | Đọc | Ghi | Bảng / hàm database |
|---|---|---|---|---|
| Đăng nhập | `/quan-tri/dang-nhap` | `auth.getAdminSession`, `auth.onAuthChange` | `auth.signIn`, `auth.signOut` | Supabase Auth, `admin_users` |
| Khung quản trị (thanh bên) | mọi trang | `inbox.getInboxStats` (số mới ở Hộp thư) | — | `contact_submissions`, `job_applications` |
| Tổng quan | `/quan-tri` | `stats.getInterestStats`, `contacts.listContactSubmissions`, `applications.listJobApplications` | — | hàm `admin_*_stats`, `contact_submissions`, `job_applications` |
| Thống kê | `/quan-tri/thong-ke` | `stats.getInterestStats`, `stats.getItemDaily` | — | hàm `admin_*_stats` (bảng `content_views`) |
| Dự án – danh sách | `/quan-tri/du-an` | `projects.listProjects` | `projects.updateProject` (ẩn / hiện), `projects.deleteProject` | `projects` |
| Dự án – thêm / sửa | `/quan-tri/du-an/moi`, `/du-an/:id` | `projects.getProject`, `projects.listGallery`, `floorPlans.listFloorPlanSets` | `projects.createProject` / `updateProject` / `deleteProject`; ảnh: `media.uploadMedia`, `projects.addGalleryItem` / `updateGalleryItem` / `deleteGalleryItem` / `reorderGallery`; mặt bằng riêng: `floorPlans.saveFloorPlanSet` / `deleteFloorPlanSet` / `createFloorPlan` / `updateFloorPlan` / `deleteFloorPlan` | `projects`, `project_gallery`, `floor_plan_sets`, `floor_plans`, kho `media` |
| Mặt bằng mặc định | `/quan-tri/mat-bang` | `floorPlans.listFloorPlanSets`, `projects.listProjects` | `floorPlans.saveFloorPlanSet`, `createFloorPlan` / `updateFloorPlan` / `deleteFloorPlan` | `floor_plan_sets`, `floor_plans` |
| Tin tức – danh sách | `/quan-tri/tin-tuc` | `news.listNews` | `news.deleteNews` | `news` |
| Tin tức – soạn bài | `/quan-tri/tin-tuc/moi`, `/tin-tuc/:id` | `news.getNews` | `news.createNews` / `updateNews` / `deleteNews`, `media.uploadMedia` (ảnh bìa) | `news`, kho `media` |
| Tuyển dụng | `/quan-tri/tuyen-dung` | `jobs.listJobs` | `jobs.createJob` / `updateJob` / `deleteJob` / `reorderJobs` | `jobs` |
| Yêu cầu tư vấn | `/quan-tri/lien-he` | `contacts.listContactSubmissions` | `contacts.updateContactSubmission` (trạng thái, ghi chú), `contacts.deleteContactSubmission` | `contact_submissions` |
| Tài khoản của tôi | `/quan-tri/tai-khoan` | `account.getMyProfile` | `account.updateMyProfile` (họ tên, SĐT, ảnh), `media.uploadMedia` (ảnh đại diện), `account.changePassword` (kiểm tra mật khẩu cũ trước) | `admin_users` (hàm `admin_update_profile`), Supabase Auth, kho `media` |
| Người quản trị (chỉ chủ sở hữu) | `/quan-tri/nguoi-quan-tri` | `users.listUsers` | `users.addUser` (tạo mới qua Edge Function / cấp quyền tài khoản có sẵn), `users.setUser` (vai trò, khoá - mở khoá), `users.revokeUser` | hàm `admin_list_users`, `admin_grant_user`, `admin_set_user`, `admin_revoke_user`; Edge Function `admin-create-user` |
| Hồ sơ ứng tuyển | `/quan-tri/ung-tuyen` | `applications.listJobApplications`, `jobs.listJobs` (bộ lọc vị trí), `applications.getCvDownloadUrl` | `applications.updateJobApplication`, `applications.deleteJobApplication` | `job_applications`, `jobs`, kho `cv` |

Thêm trang mới: thêm hàm vào đúng file theo bảng trên (website: `src/api/public/<trang>.ts` rồi export trong
`public/index.ts`; quản trị: `src/api/admin/<nhóm>.ts` **và** bản xem thử `admin/demo/<nhóm>.ts`, rồi thêm nhóm vào `admin/index.ts`), rồi thêm một dòng vào bảng.

### Ranh giới website / quản trị (bảo mật)

- **Phân quyền dữ liệu nằm ở database** (RLS + `is_admin()` trong `supabase/schema.sql`). Tách file ở giao diện không thay được
  RLS; nó giữ cho website không mang theo mã và khoá không cần thiết.
- Website chỉ dùng `src/api/public/`. `src/api/index.ts` **không** export `admin`; chỉ code trong `src/admin/` được import
  `src/api/admin/`. Trang quản trị tải bằng `import()` động trong `App.tsx`, nên mã quản trị nằm ở file riêng, chỉ tải khi vào `/quan-tri`.
- `scripts/check-boundaries.mjs` chạy tự động trước `npm run build` (hoặc `npm run check:boundaries`), **dừng build** nếu:
  - code website import `src/api/admin/` hay `src/admin/` (trừ `import()` trang quản trị trong `App.tsx`);
  - file `.env*` có biến `VITE_*` chứa khoá `service_role`, chuỗi kết nối database, hoặc tên kiểu `*SECRET*` / `*PASSWORD*`
    (mọi biến `VITE_` đều bị đóng gói vào website, ai cũng đọc được).
- Mọi hàm xoá của quản trị dùng `deleteById` (`src/api/client.ts`): RLS chặn thì Supabase không báo lỗi mà chỉ xoá 0 dòng,
  nên hàm kiểm tra số dòng đã xoá và báo lỗi "không có quyền" thay vì báo xoá thành công.

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
| `admin_users` | Quản trị viên: hồ sơ (họ tên, SĐT, ảnh), vai trò `owner` / `editor`, đang hoạt động / tạm khoá | — | đọc; tự sửa hồ sơ của mình; chủ sở hữu thêm / đổi vai trò / khoá / gỡ quyền người khác (qua hàm; không tự đổi chính mình; luôn còn ≥ 1 chủ sở hữu) |
| `content_views` | Lượt xem mỗi dự án / bài viết theo ngày (giờ Việt Nam) | chỉ ghi qua hàm `track_view` | đọc qua các hàm `admin_*_stats` |

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
- Mở trang chi tiết dự án / bài viết → `track_view` cộng 1 lượt xem cho ngày hôm nay. Mỗi trình duyệt tính tối đa 1 lượt / mục / ngày; dự án đang ẩn hoặc bài chưa tới ngày đăng không được tính.
- Xoá dự án thì ảnh không gian sống và mặt bằng riêng của nó bị xoá theo.
- Xoá vị trí tuyển dụng thì hồ sơ vẫn giữ (`job_id` → null, tên vị trí lưu sẵn trong hồ sơ).

**Ảnh mẫu:** ảnh đang có trong web là file đóng gói nên không nằm trong database. Cột ảnh để trống thì web dùng ảnh
mẫu cùng id, hoặc ảnh minh hoạ theo loại hình. Dự án chưa có ảnh không gian sống trên database cũng dùng bộ ảnh mẫu
cùng id (kèm dữ liệu 3D), để chuyển nội dung sang database dần dần được.

## API công khai (`src/api/public/`)

Các hàm đọc trả về `{ data, source }`, với `source` là `'supabase'` hoặc `'mock'`. Gặp lỗi hoặc quá 5 giây thì tự
dùng dữ liệu mẫu, và cả phiên sau đó không chờ lại nữa.

| Hàm | Dùng ở | Trả về |
|---|---|---|
| `listProjects()` | Dự án, Trang chủ, Liên hệ | `Project[]` kèm `gallery`, `overview`, `image` |
| `getProject(id)` | Chi tiết dự án (khi dự án chưa có trong danh sách đã tải) | `Project \| null` |
| `getFloorPlanSet(project)` | Chi tiết dự án (mặt bằng, tham quan 3D) | `FloorPlanSet`: bộ riêng → bộ theo loại hình → bộ mẫu |
| `listNews(category?)` | Tin tức, Chi tiết tin, Trang chủ | `NewsItem[]` mới nhất trước |
| `getNews(id)` | — | `NewsItem \| null` |
| `listJobs()` | Tuyển dụng | `Job[]` |
| `submitContact(payload)` | Liên hệ | `{ stored }` |
| `submitApplication(payload)` | Tuyển dụng | `{ stored }`; `cv_file` (File) được tải lên kho `cv` |
| `trackView(kind, id)` | Chi tiết dự án, Chi tiết tin | Không trả gì, không báo lỗi. Ghi 1 lượt xem cho trang Thống kê |

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
| `/quan-tri` | Tổng quan (7 / 30 / 90 ngày, so với kỳ trước): lượt xem dự án, lượt đọc tin, yêu cầu tư vấn, hồ sơ ứng tuyển; biểu đồ theo ngày; top dự án / bài viết; việc cần xử lý; yêu cầu và hồ sơ gần đây |
| `/quan-tri/thong-ke` | Thống kê từng dự án / bài viết: lượt xem trong kỳ, so với kỳ trước, tổng từ trước, yêu cầu tư vấn và tỉ lệ chuyển đổi; sắp xếp, tìm, xem biểu đồ từng mục, xuất CSV |
| `/quan-tri/du-an`, `/du-an/moi`, `/du-an/:id` | Dự án: danh sách (tìm, lọc, ẩn/hiện), sửa thông tin + tổng quan + ảnh đại diện, ảnh không gian sống (tải nhiều ảnh, sắp xếp), mặt bằng riêng |
| `/quan-tri/mat-bang` | Bộ mặt bằng mặc định theo loại hình: sửa phòng theo mét, xem trước bản vẽ ngay bên cạnh |
| `/quan-tri/tin-tuc`, `/tin-tuc/moi`, `/tin-tuc/:id` | Tin tức: danh sách, soạn bài (ảnh bìa, nháp, hẹn giờ đăng, nhãn "Mới") |
| `/quan-tri/tuyen-dung` | Vị trí tuyển dụng: thêm / sửa / đóng / sắp xếp thứ tự |
| `/quan-tri/lien-he` | Yêu cầu tư vấn: lọc theo trạng thái, xem chi tiết, đổi trạng thái, ghi chú nội bộ |
| `/quan-tri/ung-tuyen` | Hồ sơ ứng tuyển: lọc theo trạng thái / vị trí, tải CV, đổi trạng thái, ghi chú |
| `/quan-tri/tai-khoan` | Tài khoản của tôi: họ tên, SĐT, ảnh đại diện; đổi mật khẩu (nhập mật khẩu cũ) |
| `/quan-tri/nguoi-quan-tri` | Người quản trị (chỉ chủ sở hữu): thêm (tạo tài khoản mới / cấp quyền tài khoản có sẵn), đổi vai trò, tạm khoá, gỡ quyền |

**Chế độ xem thử:** chưa có `.env` thì trang quản trị chạy bằng `src/api/admin/demo/` (cùng các hàm và cùng quy tắc
kiểm tra với API thật), đăng nhập bằng email bất kỳ.
- Dữ liệu nằm trong kho `src/api/demoStore.ts`, khởi tạo từ dữ liệu mẫu và lưu trong localStorage của trình duyệt.
- Website đọc cùng kho này, nên nội dung thêm / sửa ở trang quản trị hiện ngay trên website. Form Liên hệ / Ứng tuyển
  gửi ở chế độ xem thử cũng vào hộp thư quản trị.
- Lượt xem trong chế độ xem thử là số liệu mẫu (180 ngày), cộng thêm lượt xem thật khi mở trang chi tiết trên website.
- Chỉ lưu trên trình duyệt đang dùng. Nút "Khôi phục dữ liệu mẫu" trên thanh báo đưa kho về ban đầu.
- Có `.env` thì tự chuyển sang Supabase thật.

## API quản trị (`admin.*`)

```ts
import { admin } from '../api/admin'; // chỉ dùng trong src/admin/
await admin.auth.signIn('admin@terra.vn', '••••••••'); // không phải admin → ApiError 'unauthorized'
```

| Nhóm | Hàm |
|---|---|
| `admin.auth` | `signIn`, `signOut`, `getAdminSession`, `onAuthChange`, `requestPasswordReset`, `updatePassword` |
| `admin.projects` | `listProjects({ search, status, type, published, page, pageSize })`, `getProject`, `createProject`, `updateProject`, `deleteProject`; ảnh không gian sống: `listGallery`, `addGalleryItem`, `updateGalleryItem`, `deleteGalleryItem`, `reorderGallery` |
| `admin.floorPlans` | `listFloorPlanSets`, `saveFloorPlanSet({ building_type } \| { project_id }, …)`, `deleteFloorPlanSet`, `createFloorPlan`, `updateFloorPlan`, `deleteFloorPlan` (kiểm tra phòng nằm trong khung mặt bằng) |
| `admin.news` | `listNews({ search, category, published, page })`, `getNews`, `createNews`, `updateNews`, `deleteNews`. `published_at` ở tương lai = hẹn giờ đăng |
| `admin.jobs` | `listJobs`, `createJob`, `updateJob`, `deleteJob`, `reorderJobs` |
| `admin.contacts` | `listContactSubmissions({ status, search, project, from, to, page })`, `updateContactSubmission(id, { status, admin_note })`, `deleteContactSubmission` |
| `admin.applications` | `listJobApplications({ status, jobId, search, page })`, `updateJobApplication`, `deleteJobApplication` (xoá cả file CV), `getCvDownloadUrl(cv_path)` (link 10 phút) |
| `admin.inbox` | `getInboxStats()`: số yêu cầu / hồ sơ mới cho Tổng quan và thanh bên |
| `admin.stats` | `getInterestStats(days)` → số liệu từng ngày (2 × days ngày, nửa đầu là kỳ trước) + số liệu từng dự án / bài viết; `getItemDaily(kind, id, days)` → lượt xem từng ngày của một mục |
| `admin.account` | `getMyProfile()`, `updateMyProfile({ full_name, phone, avatar_url })`, `changePassword(current, next, captchaToken?)` |
| `admin.users` | Chỉ chủ sở hữu: `listUsers()`, `addUser({ email, full_name, role, password? })` (có `password` = tạo tài khoản mới qua Edge Function), `setUser(id, { role, is_active })`, `revokeUser(id)` |
| `admin.media` | `uploadMedia(file, 'projects' \| 'gallery' \| 'news' \| 'avatars')` → `{ path, url }`, `deleteMedia(pathOrUrl)` |

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
