-- Cập nhật cho database ĐÃ cài schema.sql trước đây: thêm phần Thống kê lượt quan tâm.
-- Chạy toàn bộ file này một lần trong Supabase Dashboard > SQL Editor (chạy lại nhiều lần cũng được).
-- Nội dung giống mục 10 của schema.sql.

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
