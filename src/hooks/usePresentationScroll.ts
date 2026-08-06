import { useEffect, useRef } from 'react';

/**
 * Biến việc cuộn chuột/bàn phím thành chuyển động "từng trang" mượt mà (giống PowerPoint):
 * mỗi lần lăn chuột hoặc nhấn phím mũi tên sẽ trượt gọn sang đúng 1 slide kế tiếp,
 * thay vì cuộn tự do rồi "hãm" lại nửa chừng như scroll-snap thuần CSS.
 *
 * Trên thiết bị cảm ứng (điện thoại/tablet), hook này tự tắt và để CSS scroll-snap
 * (áp dụng qua class `home-snap` + `@media (pointer: coarse)`) xử lý, vì vuốt tay
 * vốn đã mượt tự nhiên hơn can thiệp bằng JS.
 */
export function usePresentationScroll(slideIds: string[], disabled = false) {
  const currentIndex = useRef(0);
  const animating = useRef(false);

  useEffect(() => {
    if (disabled) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const elements = slideIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.55) {
            const idx = elements.indexOf(entry.target as HTMLElement);
            if (idx !== -1) currentIndex.current = idx;
          }
        });
      },
      { threshold: [0.55] },
    );
    elements.forEach((el) => io.observe(el));

    function goTo(nextIndex: number) {
      const clamped = Math.max(0, Math.min(elements.length - 1, nextIndex));
      if (clamped === currentIndex.current && animating.current) return;
      animating.current = true;
      currentIndex.current = clamped;
      elements[clamped].scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => {
        animating.current = false;
      }, 750);
    }

    function menuIsOpen() {
      return document.documentElement.classList.contains('nav-open');
    }

    function onWheel(e: WheelEvent) {
      if (menuIsOpen()) return;
      if (Math.abs(e.deltaY) < 8) return;
      e.preventDefault();
      if (animating.current) return;
      goTo(currentIndex.current + (e.deltaY > 0 ? 1 : -1));
    }

    function onKeyDown(e: KeyboardEvent) {
      if (menuIsOpen()) return;
      if (['ArrowDown', 'PageDown'].includes(e.key)) {
        e.preventDefault();
        goTo(currentIndex.current + 1);
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        goTo(currentIndex.current - 1);
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      io.disconnect();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [slideIds, disabled]);
}
