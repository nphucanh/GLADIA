import type { FloorPlan, FloorPlanRoom } from '../../data/projectDetails';

/* =========================================================
   Suy ra cấu trúc căn nhà 3D từ bản vẽ mặt bằng (FloorPlan — toạ độ phòng tính theo mét):
   - Cửa đi giữa các phòng liền kề: dựng "cây nối" từ phòng trung tâm (phòng khách / sảnh) bằng
     thuật toán Prim có ưu tiên (WC master, phòng thay đồ mở vào phòng ngủ master; phòng khách –
     bếp thông nhau bằng ô mở rộng; ban công / sân vườn mở bằng cửa kính lùa…), để phòng nào
     cũng đi tới được như trong thực tế.
   - Cửa chính trên tường ngoài của phòng trung tâm.
   - Cửa sổ trên các đoạn tường ngoài; ban công / sân vườn có lan can thay tường ngoài.
   Trục: x của bản vẽ → X, y của bản vẽ → Z (mét).
   ========================================================= */

export const WALL_H = 2.9; // chiều cao trần
export const WALL_T = 0.14; // độ dày tường (mỗi phòng dựng nửa tường phía trong của mình)
const EPS = 1e-6;
const MIN_SHARED = 0.9; // đoạn tường chung tối thiểu để mở cửa

/** Đoạn thẳng trên mặt bằng: 'v' = tường dọc tại x=c (chạy theo z từ s→e), 'h' = tường ngang tại z=c. */
export interface Seg {
  axis: 'v' | 'h';
  c: number;
  s: number;
  e: number;
}

export type DoorType = 'door' | 'wide' | 'slide' | 'entry';

export interface Door {
  seg: Seg; // khoảng mở cửa trên đường tường
  type: DoorType;
  rooms: [number, number]; // chỉ số 2 phòng; -1 = bên ngoài
  top: number; // cao độ đỉnh ô cửa
}

export interface Opening {
  seg: Seg;
  bottom: number;
  top: number;
  kind: 'door' | 'window';
}

export type Side = 'left' | 'right' | 'top' | 'bottom';

export interface RoomEdge {
  side: Side;
  seg: Seg;
  exterior: Array<[number, number]>; // các khoảng tường ngoài (không giáp phòng khác)
}

export interface HouseLayout {
  plan: FloorPlan;
  doors: Door[];
  openings: Opening[][]; // theo từng phòng
  edges: RoomEdge[][]; // 4 cạnh mỗi phòng
  hub: number;
  entry: { x: number; z: number; yaw: number }; // vị trí đứng ngay trong cửa chính, hướng nhìn vào nhà
}

const isIndoor = (r: FloorPlanRoom) => r.kind !== 'outdoor';
const isMaster = (r: FloorPlanRoom) => /master|chính/i.test(r.label);

export function roomEdges(r: FloorPlanRoom): { side: Side; seg: Seg }[] {
  return [
    { side: 'left', seg: { axis: 'v', c: r.x, s: r.y, e: r.y + r.h } },
    { side: 'right', seg: { axis: 'v', c: r.x + r.w, s: r.y, e: r.y + r.h } },
    { side: 'top', seg: { axis: 'h', c: r.y, s: r.x, e: r.x + r.w } },
    { side: 'bottom', seg: { axis: 'h', c: r.y + r.h, s: r.x, e: r.x + r.w } },
  ];
}

/** Đoạn tường chung của 2 phòng (nếu có). */
function sharedSeg(a: FloorPlanRoom, b: FloorPlanRoom): Seg | null {
  const ov = (s1: number, e1: number, s2: number, e2: number) => [Math.max(s1, s2), Math.min(e1, e2)] as const;
  if (Math.abs(a.x + a.w - b.x) < EPS || Math.abs(b.x + b.w - a.x) < EPS) {
    const c = Math.abs(a.x + a.w - b.x) < EPS ? b.x : a.x;
    const [s, e] = ov(a.y, a.y + a.h, b.y, b.y + b.h);
    if (e - s >= MIN_SHARED) return { axis: 'v', c, s, e };
  }
  if (Math.abs(a.y + a.h - b.y) < EPS || Math.abs(b.y + b.h - a.y) < EPS) {
    const c = Math.abs(a.y + a.h - b.y) < EPS ? b.y : a.y;
    const [s, e] = ov(a.x, a.x + a.w, b.x, b.x + b.w);
    if (e - s >= MIN_SHARED) return { axis: 'h', c, s, e };
  }
  return null;
}

/** Mức ưu tiên nối phòng `b` (chưa vào cây) qua phòng `a` (đã vào cây). */
function preference(b: FloorPlanRoom, a: FloorPlanRoom): number {
  if ((b.kind === 'wc' || b.kind === 'storage') && isMaster(b) && a.kind === 'bed' && isMaster(a)) return 120;
  if (b.kind === 'storage' && /thay đồ/i.test(b.label) && a.kind === 'bed') return 110;
  let p = 0;
  switch (a.kind) {
    case 'living':
      p = 60;
      break;
    case 'stair':
      p = 45;
      break;
    case 'kitchen':
      p = b.kind === 'outdoor' || b.kind === 'storage' ? 55 : 30;
      break;
    case 'shop':
      p = 40;
      break;
    case 'bed':
      p = b.kind === 'outdoor' || b.kind === 'wc' ? 25 : 5;
      break;
    case 'garage':
      p = 8;
      break;
    case 'outdoor':
      p = b.kind === 'outdoor' ? 20 : -20;
      break;
    default:
      p = -40; // không đi xuyên qua WC / kho
  }
  if (b.kind === 'kitchen' && a.kind === 'living') p += 25;
  return p;
}

function doorTypeFor(a: FloorPlanRoom, b: FloorPlanRoom): DoorType {
  const k = [a.kind, b.kind];
  // Ra ban công / sân: cửa kính lùa từ phòng ở; kho, WC, gara mở ra sân bằng cửa thường
  if (k.includes('outdoor')) return k.some((x) => x === 'storage' || x === 'wc' || x === 'garage') ? 'door' : 'slide';
  if ((k.includes('living') && k.includes('kitchen')) || (k.includes('living') && k.includes('stair'))) return 'wide';
  if (k.includes('shop') && (k.includes('stair') || k.includes('living'))) return 'wide';
  return 'door';
}

const DOOR_W: Record<DoorType, number> = { door: 0.9, wide: 1.8, slide: 2.0, entry: 1.1 };
const DOOR_TOP: Record<DoorType, number> = { door: 2.15, wide: 2.45, slide: 2.4, entry: 2.3 };

/** Đặt ô cửa rộng `w` trên đoạn chung: cửa thường lệch về một đầu (chừa chỗ kê đồ), cửa rộng ở giữa. */
function placeDoor(seg: Seg, type: DoorType): Seg {
  const len = seg.e - seg.s;
  const w = Math.min(DOOR_W[type], len - 0.3);
  if (type === 'door' && len > 2.2) {
    const s = seg.s + 0.35;
    return { ...seg, s, e: s + w };
  }
  const mid = (seg.s + seg.e) / 2;
  return { ...seg, s: mid - w / 2, e: mid + w / 2 };
}

/** Các khoảng của cạnh không giáp phòng nào (tường ngoài). */
function exteriorParts(i: number, seg: Seg, rooms: FloorPlanRoom[]): Array<[number, number]> {
  const covered: Array<[number, number]> = [];
  rooms.forEach((o, j) => {
    if (j === i) return;
    for (const { seg: os } of roomEdges(o)) {
      if (os.axis !== seg.axis || Math.abs(os.c - seg.c) > EPS) continue;
      const s = Math.max(os.s, seg.s);
      const e = Math.min(os.e, seg.e);
      if (e - s > EPS) covered.push([s, e]);
    }
  });
  covered.sort((p, q) => p[0] - q[0]);
  const out: Array<[number, number]> = [];
  let cur = seg.s;
  for (const [s, e] of covered) {
    if (s > cur + EPS) out.push([cur, s]);
    cur = Math.max(cur, e);
  }
  if (seg.e > cur + EPS) out.push([cur, seg.e]);
  return out;
}

/** `upper`: tầng trên (lên bằng cầu thang) — không có cửa chính ra ngoài, xuất phát ở cầu thang. */
export function buildLayout(plan: FloorPlan, opts: { upper?: boolean } = {}): HouseLayout {
  const rooms = plan.rooms;
  const n = rooms.length;
  const edges: RoomEdge[][] = rooms.map((r, i) =>
    roomEdges(r).map(({ side, seg }) => ({ side, seg, exterior: exteriorParts(i, seg, rooms) })),
  );

  // Phòng trung tâm: phòng khách / sảnh lớn nhất (không có thì phòng trong nhà lớn nhất)
  const area = (r: FloorPlanRoom) => r.w * r.h;
  const byArea = rooms.map((r, i) => i).sort((a, b) => area(rooms[b]) - area(rooms[a]));
  const stair = rooms.findIndex((r) => r.kind === 'stair');
  const hub =
    (opts.upper && stair >= 0 ? stair : undefined) ??
    byArea.find((i) => rooms[i].kind === 'living') ??
    byArea.find((i) => rooms[i].kind === 'shop') ??
    byArea.find((i) => isIndoor(rooms[i])) ??
    0;

  // ---- Cửa giữa các phòng: Prim có ưu tiên ----
  const doors: Door[] = [];
  const inTree = new Set([hub]);
  while (inTree.size < n) {
    let best: { a: number; b: number; seg: Seg; score: number } | null = null;
    for (const a of inTree) {
      for (let b = 0; b < n; b++) {
        if (inTree.has(b)) continue;
        const seg = sharedSeg(rooms[a], rooms[b]);
        if (!seg) continue;
        const score = preference(rooms[b], rooms[a]) + Math.min(seg.e - seg.s, 4);
        if (!best || score > best.score) best = { a, b, seg, score };
      }
    }
    if (!best) break; // phòng tách rời (không giáp phòng nào) — bỏ qua
    const type = doorTypeFor(rooms[best.a], rooms[best.b]);
    doors.push({ seg: placeDoor(best.seg, type), type, rooms: [best.a, best.b], top: DOOR_TOP[type] });
    inTree.add(best.b);
  }
  // Bếp mở thêm ra sân vườn / lô gia liền kề (nếu cây nối chưa có)
  rooms.forEach((r, i) => {
    if (r.kind !== 'kitchen') return;
    rooms.forEach((o, j) => {
      if (o.kind !== 'outdoor' || doors.some((d) => d.rooms.includes(i) && d.rooms.includes(j))) return;
      const seg = sharedSeg(r, o);
      if (seg) doors.push({ seg: placeDoor(seg, 'slide'), type: 'slide', rooms: [i, j], top: DOOR_TOP.slide });
    });
  });

  // ---- Cửa chính: đoạn tường ngoài dài nhất của phòng trung tâm ----
  let entry: HouseLayout['entry'] = {
    x: rooms[hub].x + rooms[hub].w / 2,
    z: rooms[hub].y + rooms[hub].h / 2,
    yaw: 0,
  };
  const pickEntry = (i: number) => {
    let bestPart: { edge: RoomEdge; s: number; e: number } | null = null;
    for (const edge of edges[i]) {
      for (const [s, e] of edge.exterior) {
        if (e - s >= 1.4 && (!bestPart || e - s > bestPart.e - bestPart.s)) bestPart = { edge, s, e };
      }
    }
    return bestPart;
  };
  const entryRoom = opts.upper
    ? undefined
    : [hub, ...byArea.filter((i) => isIndoor(rooms[i]) && rooms[i].kind !== 'wc')].find((i) => pickEntry(i));
  if (opts.upper) {
    // Tầng trên: đứng ở cầu thang / phòng trung tâm, nhìn về giữa mặt bằng
    const r = rooms[hub];
    const cx = r.x + r.w / 2;
    const cz = r.y + r.h / 2;
    entry = { x: cx, z: cz, yaw: Math.atan2(plan.width / 2 - cx, -(plan.depth / 2 - cz)) };
  } else if (entryRoom !== undefined) {
    const part = pickEntry(entryRoom)!;
    const mid = (part.s + part.e) / 2;
    const seg: Seg = { ...part.edge.seg, s: mid - DOOR_W.entry / 2, e: mid + DOOR_W.entry / 2 };
    doors.push({ seg, type: 'entry', rooms: [entryRoom, -1], top: DOOR_TOP.entry });
    // Đứng lùi vào trong 0.9m, nhìn vào giữa phòng
    const inward = { left: [1, 0], right: [-1, 0], top: [0, 1], bottom: [0, -1] }[part.edge.side];
    const px = seg.axis === 'v' ? seg.c + inward[0] * 0.9 : mid;
    const pz = seg.axis === 'h' ? seg.c + inward[1] * 0.9 : mid;
    entry = { x: px, z: pz, yaw: Math.atan2(inward[0], -inward[1]) };
  }

  // ---- Ô mở trên từng phòng: cửa (thuộc cạnh của phòng) + cửa sổ trên tường ngoài ----
  const openings: Opening[][] = rooms.map((r, i) => {
    const list: Opening[] = [];
    for (const d of doors) {
      if (!d.rooms.includes(i)) continue;
      list.push({ seg: d.seg, bottom: 0, top: d.top, kind: 'door' });
    }
    if (!isIndoor(r) || r.kind === 'storage' || r.kind === 'stair') return list;
    for (const edge of edges[i]) {
      for (const [s0, e0] of edge.exterior) {
        // Chừa phần đã mở cửa chính
        const parts: Array<[number, number]> = [[s0, e0]];
        for (const d of doors) {
          if (d.type !== 'entry' || !d.rooms.includes(i) || d.seg.axis !== edge.seg.axis || Math.abs(d.seg.c - edge.seg.c) > EPS)
            continue;
          const [ps, pe] = parts.pop()!;
          if (d.seg.s - ps > 0) parts.push([ps, d.seg.s - 0.25]);
          if (pe - d.seg.e > 0) parts.push([d.seg.e + 0.25, pe]);
        }
        for (const [s, e] of parts) {
          const len = e - s;
          const spec =
            r.kind === 'wc'
              ? { min: 0.8, w: 0.6, bottom: 1.5, top: 2.05 }
              : r.kind === 'kitchen'
                ? { min: 1.2, w: Math.min(len * 0.5, 2.2), bottom: 1.05, top: 2.25 }
                : r.kind === 'garage'
                  ? { min: 1.6, w: Math.min(len * 0.35, 1.4), bottom: 1.6, top: 2.2 }
                  : r.kind === 'living' || r.kind === 'shop'
                    ? { min: 1.2, w: Math.min(len * 0.6, 3.4), bottom: 0.35, top: 2.5 }
                    : { min: 1.2, w: Math.min(len * 0.55, 2.4), bottom: 0.75, top: 2.35 };
          if (len < spec.min) continue;
          const mid = (s + e) / 2;
          list.push({
            seg: { ...edge.seg, s: mid - spec.w / 2, e: mid + spec.w / 2 },
            bottom: spec.bottom,
            top: spec.top,
            kind: 'window',
          });
        }
      }
    }
    return list;
  });

  return { plan, doors, openings, edges, hub, entry };
}

/** Phòng chứa điểm (x, z), -1 nếu ở ngoài. */
export function roomAt(plan: FloorPlan, x: number, z: number): number {
  return plan.rooms.findIndex((r) => x >= r.x && x <= r.x + r.w && z >= r.y && z <= r.y + r.h);
}

/** Chọn phòng ứng với tên ảnh thực tế (vd "Phòng ngủ chính" → phòng ngủ master). */
export function matchRoom(plan: FloorPlan, name: string): number {
  return scoreRoom(plan, name).room;
}

/** Loại phòng ứng với tên ảnh (vd. "Phòng thay đồ" → storage). */
function kindOf(n: string): FloorPlanRoom['kind'] | null {
  if (/ngủ/.test(n)) return 'bed';
  if (/khách/.test(n)) return 'living';
  if (/bếp|ăn/.test(n)) return 'kitchen';
  if (/tắm|wc|vệ sinh/.test(n)) return 'wc';
  if (/thay đồ|kho/.test(n)) return 'storage';
  if (/ban công|sân|vườn|lô gia/.test(n)) return 'outdoor';
  if (/kinh doanh|cửa hàng/.test(n)) return 'shop';
  return null;
}

/**
 * Ghép tên ảnh với phòng trên mặt bằng, kèm điểm khớp để so giữa các tầng: 0 = không khớp, 1 = cùng loại
 * phòng, +1 khi trùng cả tên (vd. "Phòng thay đồ" ↔ "Phòng thay đồ" chứ không phải "Kho"; "Ban công" ↔
 * "Ban công" chứ không phải "Sân vườn"), +1 khi ảnh phòng ngủ "chính" gặp phòng master, +0.5 cho WC master.
 */
export function scoreRoom(plan: FloorPlan, name: string): { room: number; score: number } {
  const n = name.toLowerCase();
  const core = n.replace(/^phòng\s+/, '');
  const kind = kindOf(n);
  let best = { room: -1, score: 0 };
  if (!kind) return best;
  plan.rooms.forEach((r, i) => {
    if (r.kind !== kind) return;
    const label = r.label.toLowerCase();
    let score = 1;
    if (label.includes(core) || n.includes(label)) score += 1;
    if (isMaster(r)) {
      if (kind === 'bed' && /chính|master/.test(n)) score += 1;
      if (kind === 'wc') score += 0.5;
    }
    if (score > best.score) best = { room: i, score };
  });
  return best;
}
