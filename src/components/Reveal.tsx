import { useEffect, useRef, useState, ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  /** Khi truyền vào: bỏ qua IntersectionObserver, hiện/ẩn theo trạng thái active của slide
   * cha (dùng cho slide xếp chồng cố định trên Trang chủ). Sẽ tự "diễn lại" mỗi lần active
   * chuyển từ false → true, không chỉ lần đầu tiên. */
  active?: boolean;
  /** Hướng xuất hiện — mặc định "up". */
  variant?: 'up' | 'down' | 'left' | 'right' | 'pop';
}

/** Bọc bất kỳ nội dung nào để nó "hiện dần" khi cuộn tới (IntersectionObserver), hoặc mỗi
 * lần `active` chuyển thành true (dùng cho slide Trang chủ không còn cuộn thật). */
export default function Reveal({ children, delay = 0, className = '', as = 'div', active, variant = 'up' }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const Tag = as as any;

  useEffect(() => {
    if (active !== undefined) {
      if (!active) {
        setVisible(false);
        return;
      }
      const t = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(t);
    }

    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const t = setTimeout(() => setVisible(true), delay);
            io.unobserve(entry.target);
            return () => clearTimeout(t);
          }
        });
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay, active]);

  return (
    <Tag
      ref={ref}
      className={`reveal-wrap reveal-${variant} ${visible ? 'reveal-visible' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
}
