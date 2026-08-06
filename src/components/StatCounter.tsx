import { useEffect, useRef, useState } from 'react';

interface StatCounterProps {
  target: number;
  label: string;
}

export default function StatCounter({ target, label }: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
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
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return (
    <div className="stat" ref={ref}>
      <div className="num">{value.toLocaleString('vi-VN')}</div>
      <div className="label">{label}</div>
    </div>
  );
}
