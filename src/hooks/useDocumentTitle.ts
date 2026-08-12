import { useEffect } from 'react';

const DEFAULT_TITLE = document.title;

/** Đổi tiêu đề tab trình duyệt khi vào trang, trả lại tiêu đề mặc định khi rời trang. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
