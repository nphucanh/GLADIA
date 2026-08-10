import { useEffect, useRef, useState } from 'react';

/**
 * Điều khiển "slide" nào đang active trên Trang chủ (kiểu PowerPoint): lăn chuột, vuốt
 * chạm, hoặc phím mũi tên sẽ chuyển sang đúng 1 slide kế tiếp/trước đó. Các slide không
 * còn nằm trong luồng cuộn thật của tài liệu — chúng xếp chồng cố định toàn màn hình,
 * component gọi hook chịu trách nhiệm hiện/ẩn (CSS morph) dựa trên `activeIndex` trả về.
 *
 * `scrollableIds`: những slide được thiết kế có thể cao hơn 1 màn hình (vd Liên hệ) — CHỈ
 * các slide này mới ưu tiên cuộn nội bộ trước khi đổi slide. Các slide còn lại luôn được
 * thiết kế vừa khít 100vh, nên bất kỳ chênh lệch scrollHeight/clientHeight nào ở đó chỉ là
 * sai số box-model/bo tròn — nếu vẫn xét chung, sẽ có lúc "kẹt" không đổi được slide.
 */
export function usePresentationScroll(slideIds: string[], disabled = false, scrollableIds: string[] = []) {
  const currentIndex = useRef(0);
  const animating = useRef(false);
  const [activeIndex, setActiveIndexState] = useState(0);

  function goTo(nextIndex: number) {
    const clamped = Math.max(0, Math.min(slideIds.length - 1, nextIndex));
    if (clamped === currentIndex.current || animating.current) return;
    animating.current = true;
    currentIndex.current = clamped;
    setActiveIndexState(clamped);
    window.setTimeout(() => {
      animating.current = false;
    }, 1300);
  }

  useEffect(() => {
    if (disabled) return;
    if (typeof window === 'undefined') return;

    function menuIsOpen() {
      return document.documentElement.classList.contains('nav-open');
    }

    function activeEl() {
      return document.getElementById(slideIds[currentIndex.current]);
    }

    // Chỉ slide nằm trong scrollableIds mới được phép cuộn nội bộ trước khi đổi slide.
    function canScrollWithin(deltaY: number) {
      if (!scrollableIds.includes(slideIds[currentIndex.current])) return false;
      const el = activeEl();
      if (!el) return false;
      if (deltaY > 0) return el.scrollHeight - el.clientHeight - el.scrollTop > 4;
      return el.scrollTop > 4;
    }

    // Cộng dồn deltaY thay vì đòi 1 tick đủ lớn — chuột/trackpad độ nhạy cao thường gửi
    // nhiều tick rất nhỏ liên tiếp, nếu lọc theo từng tick sẽ không bao giờ đủ ngưỡng.
    let wheelAccum = 0;
    let wheelResetTimer: number | undefined;
    function onWheel(e: WheelEvent) {
      if (menuIsOpen()) return;
      if (canScrollWithin(e.deltaY)) {
        wheelAccum = 0;
        return;
      }
      e.preventDefault();
      if (animating.current) return;
      wheelAccum += e.deltaY;
      window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => {
        wheelAccum = 0;
      }, 220);
      if (Math.abs(wheelAccum) > 45) {
        goTo(currentIndex.current + (wheelAccum > 0 ? 1 : -1));
        wheelAccum = 0;
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (menuIsOpen()) return;
      if (['ArrowDown', 'PageDown'].includes(e.key)) {
        if (canScrollWithin(1)) return;
        e.preventDefault();
        goTo(currentIndex.current + 1);
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        if (canScrollWithin(-1)) return;
        e.preventDefault();
        goTo(currentIndex.current - 1);
      }
    }

    let touchStartY = 0;
    function onTouchStart(e: TouchEvent) {
      touchStartY = e.touches[0].clientY;
    }
    function onTouchEnd(e: TouchEvent) {
      if (menuIsOpen()) return;
      const deltaY = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) < 48) return;
      if (canScrollWithin(deltaY)) return;
      goTo(currentIndex.current + (deltaY > 0 ? 1 : -1));
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [slideIds, disabled, scrollableIds]);

  return { activeIndex, goTo };
}
