import { createContext, useContext, useState, ReactNode } from 'react';

interface ActiveSectionValue {
  /** Đường dẫn nav (vd '/du-an') tương ứng với section đang cuộn tới trên Trang chủ, hoặc null nếu không áp dụng */
  activeSection: string | null;
  setActiveSection: (path: string | null) => void;
}

const ActiveSectionContext = createContext<ActiveSectionValue>({
  activeSection: null,
  setActiveSection: () => {},
});

export function ActiveSectionProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  return (
    <ActiveSectionContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </ActiveSectionContext.Provider>
  );
}

export function useActiveSection(): ActiveSectionValue {
  return useContext(ActiveSectionContext);
}
