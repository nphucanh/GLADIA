import { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';

export interface RailItem {
  to: string;
  label: string;
  slide: string;
}

// Rail mặc định (Trang chủ) — hiện khi không có trang nào khác đăng ký bộ mục riêng.
export const DEFAULT_RAIL_ITEMS: RailItem[] = [
  { to: '/', label: 'Trang chủ', slide: 'slide-hero' },
  { to: '/gioi-thieu', label: 'Giới thiệu', slide: 'slide-about' },
  { to: '/tin-tuc', label: 'Tin tức', slide: 'slide-news' },
  { to: '/tien-ich', label: 'Tiện ích', slide: 'slide-amenities' },
  { to: '/lien-he', label: 'Liên hệ', slide: 'slide-contact' },
];

interface ActiveSectionValue {
  /** id slide đang active của trang trình chiếu (Trang chủ/Giới thiệu...) đang mount, hoặc null nếu không áp dụng */
  activeSection: string | null;
  setActiveSection: (slideId: string | null) => void;
  /** Sidebar gọi hàm này để chuyển slide trên trang trình chiếu đang mount (no-op nếu không có trang nào đăng ký) */
  goToSlide: (slideId: string) => void;
  /** Trang trình chiếu đăng ký hàm chuyển slide thật của nó vào đây khi mount */
  registerGoToSlide: (fn: ((slideId: string) => void) | null) => void;
  /** Danh sách mục hiện trong rail — mặc định là bộ của Trang chủ */
  railItems: RailItem[];
  /** Trang trình chiếu đăng ký bộ mục rail riêng khi mount, truyền null khi unmount để quay về mặc định */
  registerRailItems: (items: RailItem[] | null) => void;
}

const ActiveSectionContext = createContext<ActiveSectionValue>({
  activeSection: null,
  setActiveSection: () => {},
  goToSlide: () => {},
  registerGoToSlide: () => {},
  railItems: DEFAULT_RAIL_ITEMS,
  registerRailItems: () => {},
});

export function ActiveSectionProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [railItems, setRailItems] = useState<RailItem[]>(DEFAULT_RAIL_ITEMS);
  const goToSlideRef = useRef<((slideId: string) => void) | null>(null);

  const goToSlide = useCallback((slideId: string) => {
    goToSlideRef.current?.(slideId);
  }, []);

  const registerGoToSlide = useCallback((fn: ((slideId: string) => void) | null) => {
    goToSlideRef.current = fn;
  }, []);

  const registerRailItems = useCallback((items: RailItem[] | null) => {
    setRailItems(items ?? DEFAULT_RAIL_ITEMS);
  }, []);

  return (
    <ActiveSectionContext.Provider
      value={{ activeSection, setActiveSection, goToSlide, registerGoToSlide, railItems, registerRailItems }}
    >
      {children}
    </ActiveSectionContext.Provider>
  );
}

export function useActiveSection(): ActiveSectionValue {
  return useContext(ActiveSectionContext);
}
