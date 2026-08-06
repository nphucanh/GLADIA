-- ============================================================
-- TERRA VIỆT — Supabase schema
-- Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Bảng dự án (đọc công khai, chỉnh sửa chỉ qua Dashboard / service role)
create table if not exists public.projects (
  id bigint generated always as identity primary key,
  name text not null,
  type text not null check (type in ('Căn hộ','Biệt thự','Đất nền','Shophouse')),
  location text not null,
  status text not null check (status in ('Đang mở bán','Sắp mở bán','Đã bàn giao')),
  price numeric not null,               -- đơn vị: tỷ VNĐ
  interest_count integer default 0,      -- lượt quan tâm, dùng để sort "Quan tâm nhiều nhất"
  popularity integer default 0,          -- điểm phổ biến 0-100, dùng để sort "Phổ biến"
  building_type text default 'apartment' check (building_type in ('apartment','villa','land','shophouse')),
  description text,
  created_at timestamptz default now()   -- dùng để sort "Mới nhất"
);

-- 2. Bảng yêu cầu tư vấn (từ form Liên hệ + form đăng ký nhanh ở footer)
create table if not exists public.contact_submissions (
  id bigint generated always as identity primary key,
  full_name text not null,
  phone text not null,
  email text not null,
  project_interest text,                 -- tên dự án khách quan tâm (có thể null)
  topic text not null,
  message text,
  created_at timestamptz default now()
);

-- 3. Bật Row Level Security
alter table public.projects enable row level security;
alter table public.contact_submissions enable row level security;

-- 4. Chính sách truy cập
-- Ai cũng đọc được danh sách dự án (hiển thị công khai trên web)
create policy "Public can read projects"
  on public.projects for select
  using (true);

-- Ai cũng gửi được form liên hệ, nhưng KHÔNG ai đọc lại được dữ liệu khách hàng
-- qua anon key (chỉ đọc được bằng service role key trong Dashboard/Backoffice)
create policy "Public can submit contact form"
  on public.contact_submissions for insert
  with check (true);

-- ============================================================
-- 5. Dữ liệu mẫu (tương ứng với bản demo trong index.html)
-- ============================================================
insert into public.projects (name, type, location, status, price, interest_count, popularity, building_type, description) values
('Terra Riverside',            'Căn hộ',    'TP.HCM',     'Đang mở bán',   4.2,  980, 92, 'apartment', 'Căn hộ ven sông, thiết kế xanh, kết nối trung tâm TP.HCM.'),
('Terra Hills Villa',          'Biệt thự',  'Bình Dương', 'Đang mở bán',   12.5, 640, 75, 'villa',     'Biệt thự sinh thái trên đồi, không gian riêng tư tuyệt đối.'),
('Golden Sand Land',           'Đất nền',   'Long An',    'Sắp mở bán',    2.1,  1120,88, 'land',      'Đất nền pháp lý rõ ràng, tiềm năng tăng giá cao.'),
('Terra Central Plaza',        'Shophouse','TP.HCM',      'Đang mở bán',   8.9,  410, 60, 'shophouse', 'Shophouse mặt tiền trung tâm, kinh doanh sầm uất.'),
('Emerald Riverside',          'Căn hộ',    'Đồng Nai',   'Đã bàn giao',   3.4,  305, 55, 'apartment', 'Căn hộ đã bàn giao, cộng đồng cư dân ổn định.'),
('Terra Coastal Villas',       'Biệt thự',  'Đà Nẵng',    'Sắp mở bán',    15.8, 870, 81, 'villa',     'Biệt thự view biển, nghỉ dưỡng bốn mùa.'),
('Sunrise Garden Land',        'Đất nền',   'Bình Dương', 'Đang mở bán',   1.8,  530, 66, 'land',      'Đất nền khu dân cư mới, hạ tầng hoàn thiện.'),
('Terra Sky Residence',        'Căn hộ',    'Hà Nội',     'Sắp mở bán',    5.6,  750, 79, 'apartment', 'Căn hộ cao tầng trung tâm Hà Nội, view thành phố.'),
('Terra Boulevard Shophouse',  'Shophouse','Long An',     'Đã bàn giao',   6.3,  220, 48, 'shophouse', 'Shophouse đã bàn giao, đang kinh doanh ổn định.'),
('Lakeview Residence',         'Căn hộ',    'TP.HCM',     'Đang mở bán',   4.9,  1300,95, 'apartment', 'Căn hộ view hồ trung tâm, tiện ích 5 sao.'),
('Terra Green Valley',         'Biệt thự',  'Đồng Nai',   'Đang mở bán',   9.4,  460, 63, 'villa',     'Biệt thự thung lũng xanh, gần cao tốc.'),
('Metro Junction Land',        'Đất nền',   'Hà Nội',     'Sắp mở bán',    3.9,  690, 72, 'land',      'Đất nền cạnh nhà ga metro tương lai.');

-- ============================================================
-- Ghi chú:
-- - "interest_count" và "popularity" nên được cập nhật định kỳ (cron job / trigger)
--   dựa trên lượt xem thực tế nếu muốn số liệu phản ánh đúng hành vi người dùng.
-- - Có thể tạo thêm bảng "project_images" (project_id, url, sort_order) nếu muốn
--   mỗi dự án có nhiều ảnh thay vì minh hoạ SVG như bản demo.
-- - Bảng contact_submissions chỉ cho INSERT qua anon key. Để xem/xử lý yêu cầu tư vấn,
--   dùng Supabase Dashboard (Table Editor) hoặc xây trang quản trị riêng dùng service role key.
-- ============================================================
