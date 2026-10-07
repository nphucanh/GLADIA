// Kiểu dữ liệu nền bản đồ thật (sinh bởi scripts/map-data/generate.mjs).
// Toạ độ phẳng [lng, lat, lng, lat, ...] để file dữ liệu gọn.
export interface RegionMap {
  bbox: [number, number, number, number]; // [south, west, north, east]
  roads: { c: 0 | 1 | 2 | 3; n?: string; p: number[] }[]; // c: 0 cao tốc, 1 quốc lộ, 2 trục chính, 3 đường lớn
  rivers: { n?: string; p: number[] }[];
  water: { p: number[] }[];
}
