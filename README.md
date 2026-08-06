# Terra Việt — Website bất động sản (React + TypeScript + Supabase)

## Cài đặt

```bash
npm install
cp .env.example .env
```

Mở `.env` và điền 2 giá trị lấy từ Supabase Dashboard → Project Settings → API:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Nếu chưa điền (hoặc chưa có project Supabase), trang **vẫn chạy bình thường** với dữ liệu mẫu
(`src/data/mockProjects.ts`) — hữu ích để xem giao diện trước khi có backend thật.

## Chạy dự án

```bash
npm run dev       # môi trường dev, có hot reload
npm run build     # build production vào thư mục dist/
npm run preview   # xem thử bản build production
```

## Thiết lập Supabase

1. Tạo project mới tại https://supabase.com.
2. Vào **SQL Editor**, chạy toàn bộ file `supabase-schema.sql` (đi kèm ở thư mục gốc) để tạo:
   - Bảng `projects` (đọc công khai, chứa dữ liệu dự án) + 12 dòng dữ liệu mẫu.
   - Bảng `contact_submissions` (chỉ cho phép **insert** qua anon key, không cho đọc lại —
     bảo vệ thông tin khách hàng).
3. Copy `Project URL` và `anon public key` vào file `.env`.
4. Chạy lại `npm run dev` — danh sách dự án sẽ tự động lấy từ Supabase thay vì dữ liệu mẫu.

## Cấu trúc thư mục

```
src/
  components/     Header, Footer, ProjectCard, ProjectModal, Reveal, StatCounter...
  pages/          Home, About, Projects, Contact — tương ứng 4 trang yêu cầu
  context/        ProjectsContext — tải dữ liệu dự án một lần, chia sẻ toàn app
  hooks/          useProjects (gọi Supabase), useProjectModal
  lib/            supabaseClient.ts — khởi tạo Supabase client
  data/           mockProjects.ts — dữ liệu mẫu dự phòng
  utils/          format.ts — định dạng ngày/giá/mã lô
  styles/         global.css — toàn bộ style, biến màu, animation
```

## Xem/xử lý yêu cầu tư vấn

Vì `contact_submissions` chỉ cho insert qua anon key (bảo mật cho khách hàng), để xem các yêu cầu
đã gửi, dùng **Table Editor** trong Supabase Dashboard, hoặc xây dựng thêm trang quản trị riêng
dùng `service role key` (không bao giờ đặt service role key trong code phía client).

## Đưa lên production

Build tĩnh (`npm run build`) tạo ra thư mục `dist/`, có thể deploy lên Vercel, Netlify, Cloudflare
Pages, hoặc bất kỳ static host nào. Nhớ khai báo `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`
trong phần Environment Variables của nền tảng deploy.
