import { BuildingType } from '../types';

export function fmtDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function fmtNumber(n: number): string {
  return n.toLocaleString('vi-VN');
}

export const bgByBuilding: Record<BuildingType, string> = {
  apartment: '#1f3d2b',
  villa: '#2c5540',
  land: '#b8933e',
  shophouse: '#a8492c',
};

export const lotCode = (id: number | string): string =>
  `LOT-${String(id).padStart(3, '0')}`;
