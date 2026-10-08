// Màn hình chờ lúc mở web (#boot-splash trong index.html). Hiện ngay khi HTML tải xong — trước cả JS — và được
// ẩn khi trang đã sẵn sàng: ảnh nền đầu trang tải xong (HeroPhoto), trang không có ảnh nền (Site), hoặc vào trang
// quản trị (AdminApp). index.html còn tự ẩn sau tối đa 10 giây để không bao giờ kẹt.

let hidden = false;

export function hideSplash() {
  if (hidden || typeof document === 'undefined') return;
  hidden = true;
  const el = document.getElementById('boot-splash');
  if (!el) return;
  el.classList.add('is-done');
  window.setTimeout(() => el.remove(), 600);
}
