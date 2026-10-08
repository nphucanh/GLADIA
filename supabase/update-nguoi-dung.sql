-- Cập nhật cho database ĐÃ cài schema.sql trước đây: hồ sơ quản trị viên + quản lý người quản trị (vai trò, khoá).
-- Chạy toàn bộ file này một lần trong Supabase Dashboard > SQL Editor (chạy lại nhiều lần cũng được).
-- Nội dung giống mục 1 của schema.sql. Admin đang có sẵn trở thành "owner" (toàn quyền).

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
