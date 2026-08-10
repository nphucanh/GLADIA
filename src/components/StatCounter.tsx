import { useEffect, useRef, useState } from 'react';

interface StatCounterProps {
  target: number;
  label: string;
  /** Khi truyền vào: bỏ qua IntersectionObserver, đếm lại mỗi lần active chuyển thành true
   * (dùng cho slide nằm trong slide xếp chồng cố định — luôn "chạm" viewport). */
  active?: boolean;
  /** Trễ trước khi bắt đầu đếm — để đồng bộ với hiệu ứng xuất hiện của thẻ chứa nó. */
  delay?: number;
}

export default function StatCounter({ target, label, active, delay = 0 }: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    function count() {
      const step = Math.max(1, Math.round(target / 50));
      const timer = setInterval(() => {
        setValue((cur) => {
          const next = cur + step;
          if (next >= target) {
            clearInterval(timer);
            return target;
          }
          return next;
        });
      }, 25);
      return () => clearInterval(timer);
    }

    if (active !== undefined) {
      if (!active) {
        setValue(0);
        return;
      }
      setValue(0);
      const t = setTimeout(count, delay);
      return () => clearTimeout(t);
    }

    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            count();
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, active, delay]);

  return (
    <div className="stat" ref={ref}>
      <div className="num">{value.toLocaleString('vi-VN')}</div>
      <div className="label">{label}</div>
    </div>
  );
}
