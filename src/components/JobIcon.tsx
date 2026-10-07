import type { ReactNode } from 'react';
import type { JobIcon } from '../types';

/** Biểu tượng tin tuyển dụng theo khoá jobs.icon — dùng ở trang Tuyển dụng và trang quản trị. */
export const JOB_ICONS: Record<JobIcon, ReactNode> = {
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 21V9l9-6 9 6v12" strokeLinejoin="round" />
      <path d="M9 21v-8h6v8" strokeLinejoin="round" />
    </svg>
  ),
  megaphone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 11l18-7-7 18-2-8-9-3Z" strokeLinejoin="round" />
    </svg>
  ),
  engineer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M14 3l7 7-9 9-7-7 9-9Z" strokeLinejoin="round" />
      <path d="M4 20l3-3" strokeLinecap="round" />
    </svg>
  ),
  support: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" strokeLinecap="round" />
    </svg>
  ),
  legal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 3h9l5 5v13H6V3Z" strokeLinejoin="round" />
      <path d="M15 3v5h5" strokeLinejoin="round" />
      <path d="M9 12h6M9 16h6" strokeLinecap="round" />
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h5" strokeLinecap="round" />
    </svg>
  ),
};

export const JOB_ICON_LABEL: Record<JobIcon, string> = {
  building: 'Kinh doanh',
  megaphone: 'Marketing',
  engineer: 'Kỹ thuật',
  support: 'Chăm sóc khách hàng',
  legal: 'Pháp lý',
  finance: 'Tài chính',
};
