// TỰ SINH bởi scripts/depth/generate.mjs — không sửa tay.
// Dữ liệu dựng ảnh "Không gian sống" thành không gian 3D 2 lớp (PhotoTour3D.tsx).
import type { Photo3D } from '../types';
import house1BathRoomDepth from '../assets/depth/house-1-bath-room.depth.png';
import house1BathRoomBg from '../assets/depth/house-1-bath-room.bg.webp';
import house1BathRoomBgDepth from '../assets/depth/house-1-bath-room.bgdepth.png';
import house1BedRoomDepth from '../assets/depth/house-1-bed-room.depth.png';
import house1BedRoomBg from '../assets/depth/house-1-bed-room.bg.webp';
import house1BedRoomBgDepth from '../assets/depth/house-1-bed-room.bgdepth.png';
import house1KitchenDepth from '../assets/depth/house-1-kitchen.depth.png';
import house1KitchenBg from '../assets/depth/house-1-kitchen.bg.webp';
import house1KitchenBgDepth from '../assets/depth/house-1-kitchen.bgdepth.png';
import house1LivingRoomDepth from '../assets/depth/house-1-living-room.depth.png';
import house1LivingRoomBg from '../assets/depth/house-1-living-room.bg.webp';
import house1LivingRoomBgDepth from '../assets/depth/house-1-living-room.bgdepth.png';
import house1ViewPenthouseDepth from '../assets/depth/house-1-view-penthouse.depth.png';
import house1ViewPenthouseBg from '../assets/depth/house-1-view-penthouse.bg.webp';
import house1ViewPenthouseBgDepth from '../assets/depth/house-1-view-penthouse.bgdepth.png';
import house1ViewTownDepth from '../assets/depth/house-1-view-town.depth.png';
import house1ViewTownBg from '../assets/depth/house-1-view-town.bg.webp';
import house1ViewTownBgDepth from '../assets/depth/house-1-view-town.bgdepth.png';
import house2BanCongDepth from '../assets/depth/house-2-ban_cong.depth.png';
import house2BanCongBg from '../assets/depth/house-2-ban_cong.bg.webp';
import house2BanCongBgDepth from '../assets/depth/house-2-ban_cong.bgdepth.png';
import house2PhongBepVaAnDepth from '../assets/depth/house-2-phong_bep_va_an.depth.png';
import house2PhongBepVaAnBg from '../assets/depth/house-2-phong_bep_va_an.bg.webp';
import house2PhongBepVaAnBgDepth from '../assets/depth/house-2-phong_bep_va_an.bgdepth.png';
import house2PhongKhachDepth from '../assets/depth/house-2-phong_khach.depth.png';
import house2PhongKhachBg from '../assets/depth/house-2-phong_khach.bg.webp';
import house2PhongKhachBgDepth from '../assets/depth/house-2-phong_khach.bgdepth.png';
import house2PhongNguDepth from '../assets/depth/house-2-phong_ngu.depth.png';
import house2PhongNguBg from '../assets/depth/house-2-phong_ngu.bg.webp';
import house2PhongNguBgDepth from '../assets/depth/house-2-phong_ngu.bgdepth.png';
import house2PhongTamDepth from '../assets/depth/house-2-phong_tam.depth.png';
import house2PhongTamBg from '../assets/depth/house-2-phong_tam.bg.webp';
import house2PhongTamBgDepth from '../assets/depth/house-2-phong_tam.bgdepth.png';
import house2PhongThayDoDepth from '../assets/depth/house-2-phong_thay_do.depth.png';
import house2PhongThayDoBg from '../assets/depth/house-2-phong_thay_do.bg.webp';
import house2PhongThayDoBgDepth from '../assets/depth/house-2-phong_thay_do.bgdepth.png';

export const PHOTO_3D: Record<string, Photo3D> = {
  'house-1-bath-room': { depth: house1BathRoomDepth, bg: house1BathRoomBg, bgDepth: house1BathRoomBgDepth, forward: 0.24, lateral: 0.17 },
  'house-1-bed-room': { depth: house1BedRoomDepth, bg: house1BedRoomBg, bgDepth: house1BedRoomBgDepth, forward: 0.49, lateral: 0.24 },
  'house-1-kitchen': { depth: house1KitchenDepth, bg: house1KitchenBg, bgDepth: house1KitchenBgDepth, forward: 0.74, lateral: 0.23 },
  'house-1-living-room': { depth: house1LivingRoomDepth, bg: house1LivingRoomBg, bgDepth: house1LivingRoomBgDepth, forward: 0.50, lateral: 0.32 },
  'house-1-view-penthouse': { depth: house1ViewPenthouseDepth, bg: house1ViewPenthouseBg, bgDepth: house1ViewPenthouseBgDepth, forward: 0.35, lateral: 0.18 },
  'house-1-view-town': { depth: house1ViewTownDepth, bg: house1ViewTownBg, bgDepth: house1ViewTownBgDepth, forward: 0.34, lateral: 0.14 },
  'house-2-ban_cong': { depth: house2BanCongDepth, bg: house2BanCongBg, bgDepth: house2BanCongBgDepth, forward: 0.25, lateral: 0.21 },
  'house-2-phong_bep_va_an': { depth: house2PhongBepVaAnDepth, bg: house2PhongBepVaAnBg, bgDepth: house2PhongBepVaAnBgDepth, forward: 0.53, lateral: 0.35 },
  'house-2-phong_khach': { depth: house2PhongKhachDepth, bg: house2PhongKhachBg, bgDepth: house2PhongKhachBgDepth, forward: 0.63, lateral: 0.35 },
  'house-2-phong_ngu': { depth: house2PhongNguDepth, bg: house2PhongNguBg, bgDepth: house2PhongNguBgDepth, forward: 0.72, lateral: 0.35 },
  'house-2-phong_tam': { depth: house2PhongTamDepth, bg: house2PhongTamBg, bgDepth: house2PhongTamBgDepth, forward: 0.40, lateral: 0.35 },
  'house-2-phong_thay_do': { depth: house2PhongThayDoDepth, bg: house2PhongThayDoBg, bgDepth: house2PhongThayDoBgDepth, forward: 0.60, lateral: 0.35 },
};
