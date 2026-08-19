export function fmtDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function fmtNumber(n: number): string {
  return n.toLocaleString('vi-VN');
}

export function fmtNewsDate(iso: string): { day: string; monthYear: string } {
  const [y, m, d] = iso.split('-');
  return { day: d, monthYear: `${m}-${y}` };
}

export const lotCode = (id: number | string): string =>
  `LOT-${String(id).padStart(3, '0')}`;
