import { useEffect, useState } from 'react';

// Khớp đúng breakpoint của .grid-projects (src/styles/projects.css) — dùng để tính số item/trang
// theo đúng số cột đang hiển thị, tránh dư thẻ lẻ dòng cuối khi đổi kích thước màn hình.
function getColumns(width: number): number {
  if (width <= 640) return 1;
  if (width <= 980) return 2;
  if (width >= 1400) return 4;
  return 3;
}

export function useGridColumns(): number {
  const [columns, setColumns] = useState(() => getColumns(typeof window === 'undefined' ? 1200 : window.innerWidth));

  useEffect(() => {
    function onResize() {
      setColumns(getColumns(window.innerWidth));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return columns;
}
