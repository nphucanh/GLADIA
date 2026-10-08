-- ============================================================
-- TERRA — Supabase schema (bảng, phân quyền RLS, kho file, trigger)
-- Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor, sau đó chạy supabase/seed.sql.
-- Chạy lại nhiều lần được (idempotent): dùng "if not exists" / "create or replace" / xoá-tạo policy.
--
-- Mô hình quyền:
--   anon / người dùng thường : ĐỌC nội dung đã xuất bản; GỬI form liên hệ + hồ sơ ứng tuyển (không đọc lại được)
--   admin (có trong bảng admin_users, đang hoạt động) : toàn quyền nội dung + xem/xử lý liên hệ, hồ sơ, CV
--     owner  : thêm cả quản lý người quản trị (trang Quản trị › Người quản trị)
--     editor : chỉ nội dung / hộp thư / thống kê
-- Admin ĐẦU TIÊN: tạo user ở Authentication > Users, rồi
--   insert into public.admin_users (user_id, email, role) select id, email, 'owner' from auth.users where email = 'admin@terra.vn';
-- Các admin sau: owner thêm ngay trên trang quản trị.
-- ============================================================

-- ---------- Tiện ích chung ----------

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1. Quản trị viên
--   admin_users : ai là quản trị viên + hồ sơ (họ tên, SĐT, ảnh) + vai trò + đang hoạt động / tạm khoá.
--   Vai trò: owner  = toàn quyền, kể cả quản lý người quản trị
--            editor = quản lý nội dung, hộp thư, thống kê; KHÔNG quản lý người quản trị
--   Tài khoản bị tạm khoá (is_active = false) mất toàn bộ quyền admin ngay (is_admin() trả false).
--   Sửa hồ sơ của chính mình: admin_update_profile(). Quản lý người khác (chỉ owner): các hàm admin_*_user().
--   Tạo tài khoản đăng nhập mới cần khoá service_role → Edge Function supabase/functions/admin-create-user.
-- ============================================================
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);
alter table public.admin_users add column if not exists full_name text;
alter table public.admin_users add column if not exists phone text;
alter table public.admin_users add column if not exists avatar_url text;
-- admin có sẵn từ trước thành owner; admin thêm mới mặc định là editor
alter table public.admin_users add column if not exists role text not null default 'owner';
alter table public.admin_users alter column role set default 'editor';
alter table public.admin_users add column if not exists is_active boolean not null default true;
alter table public.admin_users add column if not exists updated_at timestamptz not null default now();
do $$ begin
  alter table public.admin_users add constraint admin_users_role_chk check (role in ('owner', 'editor'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.admin_users add constraint admin_users_profile_chk check (
    coalesce(char_length(full_name), 0) <= 120
    and (phone is null or phone ~ '^[0-9+ ]{9,15}$')
    and coalesce(char_length(avatar_url), 0) <= 1000
  );
exception when duplicate_object then null; end $$;

-- security definer: đọc admin_users mà không bị chính RLS của bảng chặn (tránh đệ quy policy)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and is_active);
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and is_active and role = 'owner');
$$;

alter table public.admin_users enable row level security;
drop policy if exists "Admin users: read self or admin" on public.admin_users;
create policy "Admin users: read self or admin" on public.admin_users
  for select using (user_id = auth.uid() or public.is_admin());
-- Không có policy ghi: mọi thay đổi đi qua các hàm bên dưới (kiểm tra quyền + không cho tự đổi vai trò).

-- Hồ sơ của chính mình (chỉ họ tên / SĐT / ảnh — không đổi được vai trò hay trạng thái)
create or replace function public.admin_update_profile(p_full_name text, p_phone text, p_avatar_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized' using errcode = '42501'; end if;
  update public.admin_users
     set full_name = nullif(trim(p_full_name), ''),
         phone = nullif(regexp_replace(coalesce(p_phone, ''), '\s', '', 'g'), ''),
         avatar_url = nullif(trim(p_avatar_url), ''),
         updated_at = now()
   where user_id = auth.uid();
end;
$$;

-- Danh sách người quản trị (chỉ owner) — kèm lần đăng nhập gần nhất từ auth.users
create or replace function public.admin_list_users()
returns table (
  user_id uuid, email text, full_name text, phone text, avatar_url text, role text, is_active boolean,
  created_at timestamptz, last_sign_in_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select a.user_id, coalesce(u.email, a.email)::text, a.full_name, a.phone, a.avatar_url, a.role, a.is_active,
         a.created_at, u.last_sign_in_at
    from public.admin_users a
    left join auth.users u on u.id = a.user_id
   where public.is_owner()
   order by (a.role = 'owner') desc, a.created_at;
$$;

-- Cấp quyền quản trị cho một tài khoản ĐÃ CÓ (theo email). Trả về user_id; không có tài khoản → lỗi P0002.
create or replace function public.admin_grant_user(p_email text, p_role text, p_full_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_email text;
begin
  if not public.is_owner() then raise exception 'not authorized' using errcode = '42501'; end if;
  if p_role not in ('owner', 'editor') then raise exception 'invalid role' using errcode = '22023'; end if;
  select id, email into v_id, v_email from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_id is null then raise exception 'user not found' using errcode = 'P0002'; end if;
  insert into public.admin_users (user_id, email, full_name, role, is_active)
  values (v_id, v_email, nullif(trim(p_full_name), ''), p_role, true)
  on conflict (user_id) do update
    set role = excluded.role, is_active = true,
        full_name = coalesce(excluded.full_name, public.admin_users.full_name), updated_at = now();
  return v_id;
end;
$$;

-- Đổi vai trò / khoá - mở khoá. Không tự đổi chính mình; luôn giữ ít nhất 1 owner đang hoạt động.
create or replace function public.admin_set_user(p_user_id uuid, p_role text, p_is_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'not authorized' using errcode = '42501'; end if;
  if p_user_id = auth.uid() then raise exception 'cannot change yourself' using errcode = '22023'; end if;
  if p_role not in ('owner', 'editor') then raise exception 'invalid role' using errcode = '22023'; end if;
  update public.admin_users set role = p_role, is_active = p_is_active, updated_at = now() where user_id = p_user_id;
  if not found then raise exception 'user not found' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.admin_users where role = 'owner' and is_active) then
    raise exception 'need at least one owner' using errcode = '22023';
  end if;
end;
$$;

-- Gỡ quyền quản trị (tài khoản đăng nhập vẫn còn, chỉ mất quyền). Không tự gỡ chính mình.
create or replace function public.admin_revoke_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'not authorized' using errcode = '42501'; end if;
  if p_user_id = auth.uid() then raise exception 'cannot change yourself' using errcode = '22023'; end if;
  delete from public.admin_users where user_id = p_user_id;
  if not found then raise exception 'user not found' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.admin_users where role = 'owner' and is_active) then
    raise exception 'need at least one owner' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.admin_update_profile(text, text, text) from public;
revoke all on function public.admin_list_users() from public;
revoke all on function public.admin_grant_user(text, text, text) from public;
revoke all on function public.admin_set_user(uuid, text, boolean) from public;
revoke all on function public.admin_revoke_user(uuid) from public;
grant execute on function public.admin_update_profile(text, text, text) to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_grant_user(text, text, text) to authenticated;
grant execute on function public.admin_set_user(uuid, text, boolean) to authenticated;
grant execute on function public.admin_revoke_user(uuid) to authenticated;

-- ============================================================
-- 2. Dự án
-- ============================================================
create table if not exists public.projects (
  id bigint generated by default as identity primary key,
  name text not null,
  type text not null check (type in ('Căn hộ', 'Biệt thự', 'Đất nền', 'Shophouse')),
  location text not null,
  status text not null check (status in ('Đang mở bán', 'Sắp mở bán', 'Đã bàn giao')),
  price numeric not null check (price >= 0), -- tỷ VNĐ
  interest_count integer not null default 0, -- lượt quan tâm (sort "Quan tâm nhiều nhất"), tự tăng khi có yêu cầu tư vấn
  popularity integer not null default 0 check (popularity between 0 and 100), -- sort "Phổ biến"
  building_type text not null default 'apartment' check (building_type in ('apartment', 'villa', 'land', 'shophouse')),
  description text,
  created_at timestamptz not null default now() -- sort "Mới nhất"
);
-- Cột bổ sung (thêm được vào bảng projects tạo từ schema cũ)
alter table public.projects add column if not exists overview jsonb; -- { developer, scale[], landArea, buildingDensity, ownership, amenities, handover }
alter table public.projects add column if not exists cover_image_url text; -- trống → ảnh minh hoạ theo loại hình
alter table public.projects add column if not exists is_published boolean not null default true;
alter table public.projects add column if not exists sort_order integer not null default 0;
alter table public.projects add column if not exists updated_at timestamptz not null default now();

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- Ảnh "Không gian sống" của dự án (mục ảnh thực tế + tham quan 3D)
create table if not exists public.project_gallery (
  id bigint generated by default as identity primary key,
  project_id bigint not null references public.projects (id) on delete cascade,
  room text not null, -- tên phòng, vd "Phòng khách" (dùng để ghép với mặt bằng trong tham quan 3D)
  description text not null default '',
  image_url text not null,
  depth_url text, -- bản đồ độ sâu (tuỳ chọn) — có thì tham quan 3D có chiều sâu
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists project_gallery_project_idx on public.project_gallery (project_id, sort_order);

-- ============================================================
-- 3. Mặt bằng
--    Mỗi bộ mặt bằng gắn với MỘT loại hình (mặc định cho mọi dự án loại đó)
--    hoặc MỘT dự án cụ thể (ghi đè bộ mặc định).
-- ============================================================
create table if not exists public.floor_plan_sets (
  id bigint generated by default as identity primary key,
  building_type text check (building_type in ('apartment', 'villa', 'land', 'shophouse')),
  project_id bigint references public.projects (id) on delete cascade,
  title text not null,
  intro text not null default '',
  updated_at timestamptz not null default now(),
  constraint floor_plan_sets_one_scope check ((building_type is null) <> (project_id is null))
);
create unique index if not exists floor_plan_sets_building_uq on public.floor_plan_sets (building_type) where project_id is null;
create unique index if not exists floor_plan_sets_project_uq on public.floor_plan_sets (project_id) where project_id is not null;

drop trigger if exists floor_plan_sets_updated_at on public.floor_plan_sets;
create trigger floor_plan_sets_updated_at before update on public.floor_plan_sets
  for each row execute function public.set_updated_at();

create table if not exists public.floor_plans (
  id bigint generated by default as identity primary key,
  set_id bigint not null references public.floor_plan_sets (id) on delete cascade,
  slug text not null, -- mã tab dùng trong web, vd "t1", "b2"
  name text not null, -- tên tab, vd "Tầng 1", "2 phòng ngủ"
  code text not null, -- mã căn / tầng, vd "T1"
  area numeric not null check (area > 0), -- m²
  bedrooms integer check (bedrooms >= 0),
  bathrooms integer check (bathrooms >= 0),
  note text not null default '',
  width numeric not null check (width > 0), -- m
  depth numeric not null check (depth > 0), -- m
  rooms jsonb not null default '[]' check (jsonb_typeof(rooms) = 'array'), -- [{ label, kind, x, y, w, h }] (mét)
  sort_order integer not null default 0,
  unique (set_id, slug)
);
create index if not exists floor_plans_set_idx on public.floor_plans (set_id, sort_order);

-- ============================================================
-- 4. Tin tức
-- ============================================================
create table if not exists public.news (
  id bigint generated by default as identity primary key,
  category text not null check (category in ('du-an', 'cong-ty', 'thien-nguyen')),
  title text not null,
  content text[] not null default '{}', -- mỗi phần tử là một đoạn văn
  image_url text, -- trống → ảnh minh hoạ mặc định
  published_at date not null default current_date,
  is_featured boolean not null default false, -- nhãn "Mới"
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists news_published_idx on public.news (published_at desc);

drop trigger if exists news_updated_at on public.news;
create trigger news_updated_at before update on public.news
  for each row execute function public.set_updated_at();

-- ============================================================
-- 5. Tuyển dụng
-- ============================================================
create table if not exists public.jobs (
  id bigint generated by default as identity primary key,
  title text not null,
  location text not null,
  employment_type text not null default 'Toàn thời gian',
  summary text not null default '',
  icon text not null default 'building' check (icon in ('building', 'megaphone', 'engineer', 'support', 'legal', 'finance')),
  is_open boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists jobs_updated_at on public.jobs;
create trigger jobs_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();

-- ============================================================
-- 6. Yêu cầu tư vấn (form Liên hệ)
-- ============================================================
create table if not exists public.contact_submissions (
  id bigint generated by default as identity primary key,
  full_name text not null,
  phone text not null,
  email text not null,
  project_interest text, -- tên dự án khách quan tâm
  topic text not null,
  message text,
  created_at timestamptz not null default now()
);
alter table public.contact_submissions add column if not exists status text not null default 'new';
alter table public.contact_submissions add column if not exists admin_note text;
alter table public.contact_submissions add column if not exists handled_at timestamptz;
alter table public.contact_submissions add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table public.contact_submissions add constraint contact_status_chk check (status in ('new', 'in_progress', 'done', 'spam'));
exception when duplicate_object then null; end $$;
do $$ begin
  -- chặn dữ liệu rác / quá dài gửi thẳng từ trình duyệt
  alter table public.contact_submissions add constraint contact_input_chk check (
    char_length(full_name) between 2 and 120
    and phone ~ '^[0-9+ ]{9,15}$'
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' and char_length(email) <= 200
    and char_length(topic) <= 200
    and coalesce(char_length(project_interest), 0) <= 200
    and coalesce(char_length(message), 0) <= 5000
  ) not valid; -- not valid: không kiểm tra lại dữ liệu cũ, chỉ áp cho dữ liệu mới
exception when duplicate_object then null; end $$;
create index if not exists contact_submissions_status_idx on public.contact_submissions (status, created_at desc);

drop trigger if exists contact_submissions_updated_at on public.contact_submissions;
create trigger contact_submissions_updated_at before update on public.contact_submissions
  for each row execute function public.set_updated_at();

-- Khách gửi yêu cầu tư vấn cho một dự án → tăng lượt quan tâm của dự án đó
create or replace function public.bump_project_interest() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.project_interest is not null then
    update public.projects set interest_count = interest_count + 1 where name = new.project_interest;
  end if;
  return new;
end;
$$;
drop trigger if exists contact_bump_interest on public.contact_submissions;
create trigger contact_bump_interest after insert on public.contact_submissions
  for each row execute function public.bump_project_interest();

-- ============================================================
-- 7. Hồ sơ ứng tuyển
-- ============================================================
create table if not exists public.job_applications (
  id bigint generated by default as identity primary key,
  job_id bigint references public.jobs (id) on delete set null,
  position text not null, -- tên vị trí tại thời điểm nộp (giữ lại kể cả khi tin tuyển dụng bị xoá)
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (phone ~ '^[0-9+ ]{9,15}$'),
  email text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' and char_length(email) <= 200),
  cv_url text check (cv_url is null or (cv_url ~* '^https?://' and char_length(cv_url) <= 500)), -- link CV / portfolio
  cv_path text check (cv_path is null or cv_path ~ '^applications/[A-Za-z0-9._-]+$'), -- file CV trong kho "cv"
  message text check (message is null or char_length(message) <= 5000),
  status text not null default 'new' check (status in ('new', 'reviewing', 'interview', 'hired', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists job_applications_status_idx on public.job_applications (status, created_at desc);

drop trigger if exists job_applications_updated_at on public.job_applications;
create trigger job_applications_updated_at before update on public.job_applications
  for each row execute function public.set_updated_at();

-- ============================================================
-- 8. Phân quyền (Row Level Security)
-- ============================================================
alter table public.projects enable row level security;
alter table public.project_gallery enable row level security;
alter table public.floor_plan_sets enable row level security;
alter table public.floor_plans enable row level security;
alter table public.news enable row level security;
alter table public.jobs enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.job_applications enable row level security;

-- Dự án: công khai đọc dự án đã xuất bản
drop policy if exists "Public can read projects" on public.projects;
drop policy if exists "Projects: public read published" on public.projects;
create policy "Projects: public read published" on public.projects
  for select using (is_published or public.is_admin());
drop policy if exists "Projects: admin write" on public.projects;
create policy "Projects: admin write" on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Gallery: public read" on public.project_gallery;
create policy "Gallery: public read" on public.project_gallery
  for select using (
    public.is_admin() or exists (select 1 from public.projects p where p.id = project_id and p.is_published)
  );
drop policy if exists "Gallery: admin write" on public.project_gallery;
create policy "Gallery: admin write" on public.project_gallery
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Floor plan sets: public read" on public.floor_plan_sets;
create policy "Floor plan sets: public read" on public.floor_plan_sets for select using (true);
drop policy if exists "Floor plan sets: admin write" on public.floor_plan_sets;
create policy "Floor plan sets: admin write" on public.floor_plan_sets
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Floor plans: public read" on public.floor_plans;
create policy "Floor plans: public read" on public.floor_plans for select using (true);
drop policy if exists "Floor plans: admin write" on public.floor_plans;
create policy "Floor plans: admin write" on public.floor_plans
  for all using (public.is_admin()) with check (public.is_admin());

-- Tin tức: chỉ bài đã xuất bản và đã tới ngày đăng
drop policy if exists "News: public read published" on public.news;
create policy "News: public read published" on public.news
  for select using ((is_published and published_at <= current_date) or public.is_admin());
drop policy if exists "News: admin write" on public.news;
create policy "News: admin write" on public.news
  for all using (public.is_admin()) with check (public.is_admin());

-- Tuyển dụng: chỉ vị trí còn mở
drop policy if exists "Jobs: public read open" on public.jobs;
create policy "Jobs: public read open" on public.jobs
  for select using (is_open or public.is_admin());
drop policy if exists "Jobs: admin write" on public.jobs;
create policy "Jobs: admin write" on public.jobs
  for all using (public.is_admin()) with check (public.is_admin());

-- Liên hệ: ai cũng gửi được (không tự đặt trạng thái / ghi chú), chỉ admin đọc & xử lý
drop policy if exists "Public can submit contact form" on public.contact_submissions;
drop policy if exists "Contact: public insert" on public.contact_submissions;
create policy "Contact: public insert" on public.contact_submissions
  for insert with check (status = 'new' and admin_note is null and handled_at is null);
drop policy if exists "Contact: admin read" on public.contact_submissions;
create policy "Contact: admin read" on public.contact_submissions for select using (public.is_admin());
drop policy if exists "Contact: admin update" on public.contact_submissions;
create policy "Contact: admin update" on public.contact_submissions
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Contact: admin delete" on public.contact_submissions;
create policy "Contact: admin delete" on public.contact_submissions for delete using (public.is_admin());

-- Hồ sơ ứng tuyển: tương tự liên hệ
drop policy if exists "Applications: public insert" on public.job_applications;
create policy "Applications: public insert" on public.job_applications
  for insert with check (status = 'new' and admin_note is null);
drop policy if exists "Applications: admin read" on public.job_applications;
create policy "Applications: admin read" on public.job_applications for select using (public.is_admin());
drop policy if exists "Applications: admin update" on public.job_applications;
create policy "Applications: admin update" on public.job_applications
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Applications: admin delete" on public.job_applications;
create policy "Applications: admin delete" on public.job_applications for delete using (public.is_admin());

-- ============================================================
-- 9. Kho file (Supabase Storage)
--   media : ảnh dự án / tin tức — công khai đọc, admin tải lên
--   cv    : file CV ứng viên — riêng tư; khách chỉ tải lên vào thư mục applications/, admin đọc qua link ký tạm
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('cv', 'cv', false, 5242880, array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Media: public read" on storage.objects;
create policy "Media: public read" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "Media: admin write" on storage.objects;
create policy "Media: admin write" on storage.objects
  for all using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "CV: public upload" on storage.objects;
create policy "CV: public upload" on storage.objects
  for insert with check (bucket_id = 'cv' and (storage.foldername(name))[1] = 'applications');
drop policy if exists "CV: admin read" on storage.objects;
create policy "CV: admin read" on storage.objects for select using (bucket_id = 'cv' and public.is_admin());
drop policy if exists "CV: admin delete" on storage.objects;
create policy "CV: admin delete" on storage.objects for delete using (bucket_id = 'cv' and public.is_admin());

-- ============================================================
-- 10. Thống kê lượt quan tâm
--   content_views : số lượt xem mỗi dự án / bài viết theo ngày (giờ Việt Nam).
--   Website gọi track_view() khi khách mở trang chi tiết; khách không đọc / sửa được bảng này.
--   Trang quản trị đọc qua các hàm admin_*_stats() — trả về rỗng nếu người gọi không phải admin.
-- ============================================================
create table if not exists public.content_views (
  kind text not null check (kind in ('project', 'news')),
  item_id bigint not null,
  day date not null,
  views integer not null default 0 check (views >= 0),
  primary key (kind, item_id, day)
);
create index if not exists content_views_day_idx on public.content_views (day);

alter table public.content_views enable row level security;
drop policy if exists "Views: admin read" on public.content_views;
create policy "Views: admin read" on public.content_views for select using (public.is_admin());
-- Không có policy ghi: chỉ ghi qua track_view().

create or replace function public.vn_today() returns date
language sql stable as $$
  select (now() at time zone 'Asia/Ho_Chi_Minh')::date;
$$;

-- Ghi nhận 1 lượt xem. Bỏ qua (không báo lỗi) nếu dự án / bài viết không tồn tại hoặc chưa xuất bản.
create or replace function public.track_view(p_kind text, p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_kind = 'project' then
    if not exists (select 1 from public.projects where id = p_id and is_published) then return; end if;
  elsif p_kind = 'news' then
    if not exists (select 1 from public.news where id = p_id and is_published and published_at <= public.vn_today()) then return; end if;
  else
    return;
  end if;
  insert into public.content_views (kind, item_id, day, views) values (p_kind, p_id, public.vn_today(), 1)
  on conflict (kind, item_id, day) do update set views = public.content_views.views + 1;
end;
$$;
revoke all on function public.track_view(text, bigint) from public;
grant execute on function public.track_view(text, bigint) to anon, authenticated;

-- Số liệu từng ngày của 2 × p_days ngày gần nhất (nửa đầu = kỳ trước, để so sánh).
create or replace function public.admin_daily_stats(p_days integer)
returns table (day date, project_views bigint, news_views bigint, leads bigint, applications bigint)
language sql stable security definer set search_path = public as $$
  with d as (
    select g::date as day
    from generate_series(public.vn_today() - (2 * least(greatest(p_days, 1), 366) - 1), public.vn_today(), interval '1 day') g
  ),
  v as (
    select cv.day,
      sum(cv.views) filter (where cv.kind = 'project') as pv,
      sum(cv.views) filter (where cv.kind = 'news') as nv
    from public.content_views cv where cv.day >= (select min(day) from d) group by cv.day
  ),
  c as (
    select (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day, count(*) as n
    from public.contact_submissions where status <> 'spam' group by 1
  ),
  a as (
    select (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day, count(*) as n
    from public.job_applications group by 1
  )
  select d.day, coalesce(v.pv, 0)::bigint, coalesce(v.nv, 0)::bigint, coalesce(c.n, 0)::bigint, coalesce(a.n, 0)::bigint
  from d left join v using (day) left join c using (day) left join a using (day)
  where public.is_admin()
  order by d.day;
$$;

-- Lượt xem / yêu cầu tư vấn của TỪNG dự án và bài viết: kỳ này (p_days ngày gần nhất), kỳ trước, tổng từ trước tới nay.
create or replace function public.admin_item_stats(p_days integer)
returns table (
  kind text, item_id bigint, title text, image_url text, label text, building_type text, is_published boolean,
  views bigint, prev_views bigint, total_views bigint, leads bigint, prev_leads bigint, total_leads bigint
)
language sql stable security definer set search_path = public as $$
  with s as (
    select public.vn_today() - (least(greatest(p_days, 1), 366) - 1) as cur,
           public.vn_today() - (2 * least(greatest(p_days, 1), 366) - 1) as prev
  ),
  v as (
    select cv.kind, cv.item_id,
      coalesce(sum(cv.views) filter (where cv.day >= s.cur), 0) as cur,
      coalesce(sum(cv.views) filter (where cv.day >= s.prev and cv.day < s.cur), 0) as prev,
      sum(cv.views) as total
    from public.content_views cv cross join s group by cv.kind, cv.item_id
  ),
  l as (
    select c.project_interest as name,
      count(*) filter (where (c.created_at at time zone 'Asia/Ho_Chi_Minh')::date >= s.cur) as cur,
      count(*) filter (where (c.created_at at time zone 'Asia/Ho_Chi_Minh')::date >= s.prev
                         and (c.created_at at time zone 'Asia/Ho_Chi_Minh')::date < s.cur) as prev,
      count(*) as total
    from public.contact_submissions c cross join s
    where c.project_interest is not null and c.status <> 'spam'
    group by c.project_interest
  )
  select 'project', p.id, p.name, p.cover_image_url, p.location, p.building_type, p.is_published,
    coalesce(v.cur, 0)::bigint, coalesce(v.prev, 0)::bigint, coalesce(v.total, 0)::bigint,
    coalesce(l.cur, 0)::bigint, coalesce(l.prev, 0)::bigint, coalesce(l.total, 0)::bigint
  from public.projects p
  left join v on v.kind = 'project' and v.item_id = p.id
  left join l on l.name = p.name
  where public.is_admin()
  union all
  select 'news', n.id, n.title, n.image_url, n.category, null, n.is_published and n.published_at <= public.vn_today(),
    coalesce(v.cur, 0)::bigint, coalesce(v.prev, 0)::bigint, coalesce(v.total, 0)::bigint, 0, 0, 0
  from public.news n
  left join v on v.kind = 'news' and v.item_id = n.id
  where public.is_admin();
$$;

-- Lượt xem (và yêu cầu tư vấn, với dự án) từng ngày của MỘT dự án / bài viết, p_days ngày gần nhất.
create or replace function public.admin_item_daily(p_kind text, p_id bigint, p_days integer)
returns table (day date, views bigint, leads bigint)
language sql stable security definer set search_path = public as $$
  with d as (
    select g::date as day
    from generate_series(public.vn_today() - (least(greatest(p_days, 1), 366) - 1), public.vn_today(), interval '1 day') g
  ),
  c as (
    select (c.created_at at time zone 'Asia/Ho_Chi_Minh')::date as day, count(*) as n
    from public.contact_submissions c
    join public.projects p on p.name = c.project_interest
    where p_kind = 'project' and p.id = p_id and c.status <> 'spam'
    group by 1
  )
  select d.day, coalesce(cv.views, 0)::bigint, coalesce(c.n, 0)::bigint
  from d
  left join public.content_views cv on cv.kind = p_kind and cv.item_id = p_id and cv.day = d.day
  left join c on c.day = d.day
  where public.is_admin()
  order by d.day;
$$;

revoke all on function public.admin_daily_stats(integer) from public;
revoke all on function public.admin_item_stats(integer) from public;
revoke all on function public.admin_item_daily(text, bigint, integer) from public;
grant execute on function public.admin_daily_stats(integer) to authenticated;
grant execute on function public.admin_item_stats(integer) to authenticated;
grant execute on function public.admin_item_daily(text, bigint, integer) to authenticated;

-- Báo API (PostgREST) nạp lại danh sách bảng / hàm vừa tạo
notify pgrst, 'reload schema';
