import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Cuộn về đầu trang mỗi khi chuyển route, giống hành vi điều hướng SPA thông thường */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}
