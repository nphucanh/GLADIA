-- DỮ LIỆU MẪU CHO TRANG QUẢN TRỊ — để thử các trường hợp trên Supabase thật.
-- Chạy trong Supabase › SQL Editor, SAU schema.sql và seed.sql. Chạy lại bao nhiêu lần cũng được (xoá mẫu cũ rồi tạo lại).
--
-- Gồm:
--   • Yêu cầu tư vấn: ~75 yêu cầu trải 90 ngày, đủ 4 trạng thái (mới / đang xử lý / đã xong / spam), có & không có dự án,
--     có & không có lời nhắn, ghi chú nội bộ, lời nhắn rất dài; mỗi dự án có thêm 1 yêu cầu.
--   • Hồ sơ ứng tuyển: đủ 5 trạng thái (mới / đang xem / phỏng vấn / đã tuyển / từ chối), CV dạng link / file / không có,
--     "Vị trí khác", vị trí đã bị xoá; mỗi vị trí tuyển dụng có thêm 1 hồ sơ.
--   • Lượt xem 180 ngày cho mọi dự án & bài viết đã đăng → biểu đồ Tổng quan / Thống kê có số liệu.
--   • Nội dung ở trạng thái đặc biệt: dự án bản nháp, dự án thiếu thông tin tổng quan, bài hẹn giờ, bài nháp,
--     vị trí đã đóng, vị trí bán thời gian.
--
-- Nhận diện dữ liệu mẫu: email khách / ứng viên đuôi @example.com, và các tên dự án / bài / vị trí trong mục "Nội dung".
-- XOÁ TOÀN BỘ dữ liệu mẫu: chạy riêng khối "XOÁ DỮ LIỆU MẪU" ở cuối file.
-- Người quản trị không tạo bằng SQL được (cần tài khoản đăng nhập) → thêm ở trang Người quản trị.

begin;

-- ============================================================
-- 0. Dọn mẫu cũ (để chạy lại được)
-- ============================================================
delete from public.content_views v using public.projects p
  where v.kind = 'project' and v.item_id = p.id and p.name in ('Terra Lumière Residence', 'Terra Harbor Shophouse');
delete from public.content_views v using public.news n
  where v.kind = 'news' and v.item_id = n.id and n.title in (
    'Terra khởi công dự án Lumière Residence tại Đà Nẵng',
    'Bản nháp: Tổng kết hoạt động thiện nguyện năm 2026',
    'Terra công bố chính sách bán hàng mới cho khách hàng mua căn hộ lần đầu, hỗ trợ lãi suất 0% trong 24 tháng và miễn phí quản lý 3 năm'
  );
delete from public.contact_submissions where email like '%@example.com';
delete from public.job_applications where email like '%@example.com';
delete from public.projects where name in ('Terra Lumière Residence', 'Terra Harbor Shophouse');
delete from public.news where title in (
  'Terra khởi công dự án Lumière Residence tại Đà Nẵng',
  'Bản nháp: Tổng kết hoạt động thiện nguyện năm 2026',
  'Terra công bố chính sách bán hàng mới cho khách hàng mua căn hộ lần đầu, hỗ trợ lãi suất 0% trong 24 tháng và miễn phí quản lý 3 năm'
);
delete from public.jobs where title in ('Thực tập sinh Thiết kế đồ hoạ', 'Nhân viên Kinh doanh (bán thời gian)');

-- ============================================================
-- 1. Nội dung ở trạng thái đặc biệt
-- ============================================================
-- Dự án bản nháp (không hiện trên web) + dự án đã bàn giao chưa có thông tin tổng quan / ảnh bìa
insert into public.projects (name, type, location, status, price, interest_count, popularity, building_type, description, is_published, sort_order, created_at)
values
  ('Terra Lumière Residence', 'Căn hộ', 'Đà Nẵng', 'Sắp mở bán', 3.6, 0, 40, 'apartment',
   'Dự án đang hoàn thiện hồ sơ — chưa công bố.', false, 98, now() - interval '2 days'),
  ('Terra Harbor Shophouse', 'Shophouse', 'Hải Phòng', 'Đã bàn giao', 18.9, 35, 55, 'shophouse',
   null, true, 99, now() - interval '200 days');

-- Bài hẹn giờ (đăng sau 7 ngày), bài nháp, bài có tiêu đề rất dài
insert into public.news (category, title, content, published_at, is_featured, is_published, created_at)
values
  ('du-an', 'Terra khởi công dự án Lumière Residence tại Đà Nẵng',
   array['Bài viết hẹn giờ — sẽ tự hiện trên website vào ngày đăng.', 'Đoạn thứ hai của bài viết.'],
   current_date + 7, true, true, now()),
  ('thien-nguyen', 'Bản nháp: Tổng kết hoạt động thiện nguyện năm 2026',
   array['Bài đang soạn, chưa đăng.'], current_date, false, false, now() - interval '1 day'),
  ('cong-ty', 'Terra công bố chính sách bán hàng mới cho khách hàng mua căn hộ lần đầu, hỗ trợ lãi suất 0% trong 24 tháng và miễn phí quản lý 3 năm',
   array['Bài có tiêu đề rất dài để kiểm tra hiển thị cắt dòng trong bảng.'], current_date - 3, false, true, now() - interval '3 days');

-- Vị trí đã đóng + vị trí bán thời gian
insert into public.jobs (title, location, employment_type, summary, icon, is_open, sort_order)
values
  ('Thực tập sinh Thiết kế đồ hoạ', 'TP.HCM', 'Thực tập', 'Hỗ trợ thiết kế ấn phẩm truyền thông cho các dự án.', 'megaphone', false, 98),
  ('Nhân viên Kinh doanh (bán thời gian)', 'Hà Nội', 'Bán thời gian', 'Tư vấn khách hàng tại nhà mẫu vào cuối tuần.', 'building', true, 99);

-- ============================================================
-- 2. Yêu cầu tư vấn
--    Tắt tạm trigger tăng "lượt quan tâm" để dữ liệu mẫu không làm lệch số liệu dự án.
-- ============================================================
alter table public.contact_submissions disable trigger contact_bump_interest;

-- 2a. Các trường hợp cụ thể
insert into public.contact_submissions (full_name, phone, email, project_interest, topic, message, status, admin_note, handled_at, created_at, updated_at)
values
  ('Nguyễn Minh Anh', '0903123456', 'minhanh@example.com', 'Terra Riverside', 'Đặt lịch xem nhà mẫu',
   'Tôi muốn xem căn 2 phòng ngủ vào sáng thứ Bảy này.', 'new', null, null, now() - interval '25 minutes', now() - interval '25 minutes'),
  ('Trần Quốc Bảo', '0912888777', 'baotq@example.com', 'Terra Hills Villa', 'Chính sách vay vốn / thanh toán',
   'Cho tôi hỏi chính sách hỗ trợ lãi suất khi mua biệt thự.', 'new', null, null, now() - interval '3 hours', now() - interval '3 hours'),
  ('Lê Thu Hà', '0987654321', 'ha.le@example.com', 'Lakeview Residence', 'Thông tin dự án & bảng giá',
   null, 'in_progress', 'Đã gửi bảng giá qua email, hẹn gọi lại thứ 5.', null, now() - interval '1 day 2 hours', now() - interval '20 hours'),
  ('Phạm Đức Long', '0938111222', 'longpd@example.com', null, 'Pháp lý & sổ hồng',
   'Dự án Emerald Riverside đã có sổ hồng chưa?', 'done', 'Đã tư vấn qua điện thoại.', now() - interval '2 days', now() - interval '3 days', now() - interval '2 days'),
  ('Võ Thị Mai', '+84 909 000 111', 'maivo@example.com', 'Golden Sand Land', 'Thông tin dự án & bảng giá',
   'Gửi giúp tôi bảng giá các nền góc.', 'done', null, now() - interval '4 days', now() - interval '5 days', now() - interval '4 days'),
  ('abc', '0900000000', 'test@example.com', null, 'Khác', 'test test test', 'spam', null, null, now() - interval '8 days', now() - interval '8 days'),
  ('Hoàng Gia Huy', '0977333444', 'huyhg@example.com', 'Terra Coastal Villas', 'Đặt lịch xem nhà mẫu',
   'Gia đình tôi muốn tham quan dự án vào tháng sau.', 'done', 'Khách đã xem nhà mẫu, đang cân nhắc căn góc.', now() - interval '10 days', now() - interval '12 days', now() - interval '10 days'),
  ('Đinh Thị Phương Thảo', '0966777888', 'phuongthao@example.com', 'Terra Lumière Residence', 'Thông tin dự án & bảng giá',
   'Nghe nói Terra sắp mở bán dự án ở Đà Nẵng, cho tôi xin thông tin sớm.', 'new', null, null, now() - interval '6 hours', now() - interval '6 hours'),
  ('Trương Văn Khải', '0911222333', 'khai.truong@example.com', 'Terra Boulevard Shophouse', 'Khác',
   'Tôi là chủ doanh nghiệp, muốn thuê dài hạn 2 căn shophouse liền kề để mở chuỗi cửa hàng. ' ||
   'Mong được tư vấn về giá thuê, thời hạn hợp đồng, chính sách miễn phí thời gian setup, chi phí quản lý, ' ||
   'chỗ đậu xe cho khách, giờ hoạt động của khu thương mại, quy định về biển hiệu và phòng cháy chữa cháy. ' ||
   'Ngoài ra tôi cũng quan tâm đến khả năng mua lại sau 3 năm thuê nếu kinh doanh hiệu quả. ' ||
   'Vui lòng liên hệ ngoài giờ hành chính (sau 18h) vì ban ngày tôi bận họp. Cảm ơn!',
   'in_progress', 'Lời nhắn dài — chuyển phòng cho thuê xử lý.', null, now() - interval '2 days', now() - interval '1 day');

-- 2b. Yêu cầu rải đều 90 ngày (cho biểu đồ "Khách để lại thông tin")
insert into public.contact_submissions (full_name, phone, email, project_interest, topic, message, status, admin_note, handled_at, created_at, updated_at)
select
  n.name,
  '09' || lpad(((i * 7919) % 100000000)::text, 8, '0'),
  n.slug || i || '@example.com',
  case when i % 5 = 0 then null else p.names[1 + (i * 7) % array_length(p.names, 1)] end,
  (array['Thông tin dự án & bảng giá', 'Đặt lịch xem nhà mẫu', 'Chính sách vay vốn / thanh toán', 'Pháp lý & sổ hồng', 'Khác'])[1 + i % 5],
  case when i % 3 = 0 then null
       else (array['Cho tôi xin bảng giá và tiến độ thanh toán.', 'Tôi muốn đặt lịch xem nhà mẫu cuối tuần.',
                   'Dự án có hỗ trợ vay ngân hàng không?', 'Gọi lại cho tôi sau 17h.', 'Căn góc còn không ạ?'])[1 + i % 5] end,
  s.status,
  case when s.status = 'in_progress' then 'Đã gọi lần 1, khách hẹn gọi lại.'
       when s.status = 'done' and i % 2 = 0 then 'Đã tư vấn, gửi tài liệu qua email.' end,
  case when s.status = 'done' then t.at + interval '1 day' end,
  t.at,
  t.at + case when s.status = 'new' then interval '0' else interval '1 day' end
from generate_series(1, 52) as i
cross join lateral (
  select (array['Nguyễn Văn An', 'Trần Thị Bích', 'Lê Hoàng Cường', 'Phạm Thu Dung', 'Hoàng Minh Đức', 'Vũ Ngọc Giang',
                'Đỗ Quang Hải', 'Bùi Thanh Hương', 'Đặng Tuấn Kiệt', 'Ngô Mỹ Linh', 'Dương Văn Lộc', 'Lý Thảo My',
                'Hồ Đức Nghĩa', 'Phan Bảo Ngọc', 'Trịnh Công Phúc', 'Mai Anh Quân', 'Tạ Thị Sương', 'Châu Minh Tâm',
                'Lâm Gia Uyên', 'Quách Văn Vinh'])[1 + i % 20] as name,
         (array['an.nguyen', 'bich.tran', 'cuong.le', 'dung.pham', 'duc.hoang', 'giang.vu', 'hai.do', 'huong.bui',
                'kiet.dang', 'linh.ngo', 'loc.duong', 'my.ly', 'nghia.ho', 'ngoc.phan', 'phuc.trinh', 'quan.mai',
                'suong.ta', 'tam.chau', 'uyen.lam', 'vinh.quach'])[1 + i % 20] as slug
) n
cross join lateral (select array_agg(name order by sort_order, id) as names from public.projects where is_published) p
cross join lateral (
  select ((public.vn_today() - (i * 89 / 52)) + make_time(8 + i % 11, (i * 13) % 60, 0)) at time zone 'Asia/Ho_Chi_Minh' as at
) t
cross join lateral (
  select case
    when i * 89 / 52 <= 3 then 'new'
    when i % 13 = 0 then 'spam'
    when i * 89 / 52 <= 14 then (array['new', 'in_progress'])[1 + i % 2]
    when i % 6 = 0 then 'in_progress'
    else 'done'
  end as status
) s;

-- 2c. Mỗi dự án thêm 1 yêu cầu (trạng thái & chủ đề xoay vòng, kể cả dự án nháp)
insert into public.contact_submissions (full_name, phone, email, project_interest, topic, message, status, admin_note, handled_at, created_at, updated_at)
select n.name, '08' || lpad(((p.rn * 69621) % 100000000)::text, 8, '0'), n.slug || '.tuvan' || p.id || '@example.com',
       p.name,
       (array['Thông tin dự án & bảng giá', 'Đặt lịch xem nhà mẫu', 'Chính sách vay vốn / thanh toán', 'Pháp lý & sổ hồng', 'Khác'])[1 + (p.rn - 1) % 5],
       case when p.rn % 3 <> 0 then 'Tôi quan tâm dự án ' || p.name || ', vui lòng liên hệ tư vấn giúp tôi.' end,
       s.status,
       case s.status when 'in_progress' then 'Đã gửi tài liệu, chờ khách phản hồi.' when 'done' then 'Đã tư vấn xong.' end,
       case when s.status = 'done' then t.at + interval '1 day' end,
       t.at,
       t.at + case when s.status = 'new' then interval '0' else interval '1 day' end
from (select id, name, row_number() over (order by sort_order, id)::int as rn from public.projects) p
cross join lateral (
  select (array['Phùng Thị Ngân', 'Kim Văn Thắng', 'Âu Mỹ Duyên', 'Tống Đức Hiếu', 'La Thanh Bình', 'Mạc Thu Trang',
                'Khúc Văn Lâm', 'Giang Hồng Nhung', 'Ông Quốc Toàn', 'Thái Bảo Trâm'])[1 + (p.rn - 1) % 10] as name,
         (array['ngan.phung', 'thang.kim', 'duyen.au', 'hieu.tong', 'binh.la', 'trang.mac',
                'lam.khuc', 'nhung.giang', 'toan.ong', 'tram.thai'])[1 + (p.rn - 1) % 10] as slug
) n
cross join lateral (select (array['new', 'in_progress', 'done', 'new', 'done', 'spam'])[1 + (p.rn - 1) % 6] as status) s
cross join lateral (select now() - make_interval(days => (p.rn * 5) % 40, hours => 1 + p.rn) as at) t;

alter table public.contact_submissions enable trigger contact_bump_interest;

-- ============================================================
-- 3. Hồ sơ ứng tuyển
-- ============================================================
insert into public.job_applications (job_id, position, full_name, phone, email, cv_url, cv_path, message, status, admin_note, created_at, updated_at)
select j.id, coalesce(j.title, v.position), v.full_name, v.phone, v.email, v.cv_url, v.cv_path, v.message, v.status, v.admin_note,
       now() - v.age, now() - v.age + case when v.status = 'new' then interval '0' else interval '1 day' end
from (values
  ('Chuyên viên Kinh doanh Bất động sản', null, 'Đặng Hoài Nam', '0905123123', 'namdh@example.com', 'https://drive.google.com/file/d/demo-cv-nam', null,
   'Tôi có 3 năm kinh nghiệm bán căn hộ cao cấp tại TP.HCM.', 'new', null, interval '2 hours'),
  ('Chuyên viên Kinh doanh Bất động sản', null, 'Phan Thị Yến', '0934567890', 'yen.phan@example.com', null, null,
   null, 'new', null, interval '1 day'),
  ('Trưởng phòng Marketing', null, 'Bùi Ngọc Lan', '0916222333', 'lan.bui@example.com', 'https://www.linkedin.com/in/demo-ngoclan', null,
   null, 'reviewing', null, interval '3 days'),
  ('Kỹ sư Giám sát công trình', null, 'Ngô Văn Thành', '0938444555', 'thanhnv@example.com', 'https://drive.google.com/file/d/demo-cv-thanh', null,
   'Kỹ sư xây dựng, 5 năm giám sát nhà cao tầng.', 'interview', 'Hẹn phỏng vấn 9h thứ Ba.', interval '5 days'),
  ('Chuyên viên Chăm sóc khách hàng', null, 'Lưu Thị Hồng', '0977111999', 'hong.luu@example.com', null, 'applications/demo-khong-co-file.pdf',
   'CV gửi kèm file (file mẫu không tồn tại trong kho → thử thông báo lỗi khi tải).', 'reviewing', null, interval '6 days'),
  ('Chuyên viên Pháp lý dự án', null, 'Cao Minh Trí', '0908765432', 'tri.cao@example.com', 'https://portfolio.example.com/tri', null,
   'Luật sư, 4 năm kinh nghiệm pháp lý bất động sản.', 'hired', 'Đã nhận offer, đi làm từ đầu tháng.', interval '25 days'),
  ('Kế toán tổng hợp', null, 'Mai Thanh Trúc', '0909888999', 'truc.mai@example.com', null, null,
   null, 'rejected', 'Chưa đủ kinh nghiệm kế toán thuế.', interval '12 days'),
  ('Kế toán tổng hợp', null, 'Hà Văn Sơn', '0912345678', 'son.ha@example.com', 'https://drive.google.com/file/d/demo-cv-son', null,
   'Có chứng chỉ kế toán trưởng.', 'interview', null, interval '8 days'),
  (null, 'Vị trí khác', 'Lý Minh Khôi', '0981555666', 'khoily@example.com', 'https://portfolio.example.com/khoi', null,
   'Mong muốn ứng tuyển vị trí thiết kế nội thất.', 'new', null, interval '15 days'),
  (null, 'Nhân viên Thiết kế 3D (tin đã gỡ)', 'Tôn Nữ Diễm', '0939000777', 'diem.ton@example.com', 'https://behance.net/demo-diem', null,
   'Ứng tuyển vào tin đã bị xoá — hồ sơ vẫn giữ tên vị trí lúc nộp.', 'rejected', null, interval '60 days'),
  ('Thực tập sinh Thiết kế đồ hoạ', null, 'Kiều Anh Thư', '0388123456', 'thu.kieu@example.com', 'https://behance.net/demo-anhthu', null,
   'Sinh viên năm cuối ngành thiết kế đồ hoạ.', 'reviewing', null, interval '20 days')
) as v (job_title, position, full_name, phone, email, cv_url, cv_path, message, status, admin_note, age)
left join public.jobs j on j.title = v.job_title;

-- Mỗi vị trí tuyển dụng thêm 1 hồ sơ (trạng thái xoay vòng, kể cả vị trí đã đóng)
insert into public.job_applications (job_id, position, full_name, phone, email, cv_url, cv_path, message, status, admin_note, created_at, updated_at)
select j.id, j.title, n.name, '03' || lpad(((j.rn * 48271) % 100000000)::text, 8, '0'), n.slug || '.ungvien' || j.id || '@example.com',
       case when j.rn % 3 <> 0 then 'https://drive.google.com/file/d/demo-cv-' || n.slug end, null,
       case when j.rn % 2 = 1 then 'Tôi rất quan tâm đến vị trí ' || j.title || ' và mong được trao đổi thêm.' end,
       s.status,
       case s.status when 'interview' then 'Đã hẹn lịch phỏng vấn.' when 'rejected' then 'Chưa phù hợp yêu cầu.' when 'hired' then 'Đã nhận việc.' end,
       now() - make_interval(days => (j.rn * 4) % 30, hours => j.rn),
       now() - make_interval(days => (j.rn * 4) % 30, hours => j.rn) + case when s.status = 'new' then interval '0' else interval '1 day' end
from (select id, title, row_number() over (order by sort_order, id)::int as rn from public.jobs) j
cross join lateral (
  select (array['Nguyễn Thị Hạnh', 'Trần Đức Minh', 'Lê Bảo Châu', 'Phạm Quốc Việt', 'Võ Thanh Tùng', 'Huỳnh Ngọc Ánh',
                'Đoàn Khánh Linh', 'Vương Hải Đăng', 'Lương Thị Hoa', 'Nghiêm Gia Bảo'])[1 + (j.rn - 1) % 10] as name,
         (array['hanh.nguyen', 'minh.tran', 'chau.le', 'viet.pham', 'tung.vo', 'anh.huynh',
                'linh.doan', 'dang.vuong', 'hoa.luong', 'bao.nghiem'])[1 + (j.rn - 1) % 10] as slug
) n
cross join lateral (select (array['new', 'reviewing', 'interview', 'hired', 'rejected'])[1 + (j.rn - 1) % 5] as status) s;

-- ============================================================
-- 4. Lượt xem 180 ngày (chỉ điền những ngày chưa có số liệu thật)
--    Dự án: theo lượt quan tâm, cuối tuần đông hơn, tăng dần theo thời gian.
--    Bài viết: cao lúc mới đăng rồi giảm dần.
-- ============================================================
insert into public.content_views (kind, item_id, day, views)
select 'project', p.id, d.day,
  round(
    (3 + sqrt(greatest(p.interest_count, 1)) / 2.2)
    * case when extract(isodow from d.day) >= 6 then 1.35 else 1 end
    * (0.7 + 0.3 * (179 - (public.vn_today() - d.day)) / 179.0)
    * (0.55 + (abs(hashtext('p' || p.id || d.day)) % 1000) / 1000.0 * 0.9)
  )::int
from public.projects p
cross join lateral (select g::date as day from generate_series(public.vn_today() - 179, public.vn_today(), interval '1 day') g) d
where p.is_published
on conflict (kind, item_id, day) do nothing;

insert into public.content_views (kind, item_id, day, views)
select 'news', n.id, d.day,
  round(
    lvl * 6 / (1 + (d.day - n.published_at) / 4.0)
    + lvl * 0.25 * case when extract(isodow from d.day) >= 6 then 1.35 else 1 end
      * (0.4 + (abs(hashtext('n' || n.id || d.day)) % 1000) / 1000.0 * 1.2)
  )::int
from public.news n
cross join lateral (select case when n.is_featured then 9 else 4 + (abs(hashtext('l' || n.id)) % 400) / 100.0 end as lvl) l
cross join lateral (select g::date as day from generate_series(greatest(n.published_at, public.vn_today() - 179), public.vn_today(), interval '1 day') g) d
where n.is_published and n.published_at <= public.vn_today()
on conflict (kind, item_id, day) do nothing;

commit;

-- ============================================================
-- XOÁ DỮ LIỆU MẪU — bôi đen khối dưới rồi bấm Run (lượt xem mẫu của dự án / bài thật không tách được với lượt xem thật nên giữ lại).
-- ============================================================
-- begin;
-- delete from public.content_views v using public.projects p
--   where v.kind = 'project' and v.item_id = p.id and p.name in ('Terra Lumière Residence', 'Terra Harbor Shophouse');
-- delete from public.content_views v using public.news n
--   where v.kind = 'news' and v.item_id = n.id and n.title in (
--     'Terra khởi công dự án Lumière Residence tại Đà Nẵng',
--     'Bản nháp: Tổng kết hoạt động thiện nguyện năm 2026',
--     'Terra công bố chính sách bán hàng mới cho khách hàng mua căn hộ lần đầu, hỗ trợ lãi suất 0% trong 24 tháng và miễn phí quản lý 3 năm'
--   );
-- delete from public.contact_submissions where email like '%@example.com';
-- delete from public.job_applications where email like '%@example.com';
-- delete from public.projects where name in ('Terra Lumière Residence', 'Terra Harbor Shophouse');
-- delete from public.news where title in (
--   'Terra khởi công dự án Lumière Residence tại Đà Nẵng',
--   'Bản nháp: Tổng kết hoạt động thiện nguyện năm 2026',
--   'Terra công bố chính sách bán hàng mới cho khách hàng mua căn hộ lần đầu, hỗ trợ lãi suất 0% trong 24 tháng và miễn phí quản lý 3 năm'
-- );
-- delete from public.jobs where title in ('Thực tập sinh Thiết kế đồ hoạ', 'Nhân viên Kinh doanh (bán thời gian)');
-- commit;
