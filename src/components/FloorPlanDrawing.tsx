import type { ReactNode } from 'react';
import type { FloorPlan, FloorPlanRoom } from '../data/projectDetails';

// Tỉ lệ bản vẽ: 1m = SCALE đơn vị SVG. PAD_* chừa chỗ cho đường kích thước (trên/trái) và lề.
const SCALE = 40;
const PAD_START = 64;
const PAD_END = 24;
const ROOM_INSET = 0.3; // m — khoảng cách ký hiệu nội thất tới tường

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const BED = { w: 1.6, h: 2 }; // m
const SOFA = { w: 2.4, h: 0.85 }; // m

// Giường chỉ vẽ khi dưới giường còn ≥ 1.1m cho nhãn phòng.
function hasBed(room: FloorPlanRoom): boolean {
  return room.w - ROOM_INSET * 2 >= BED.w + 0.2 && room.h - ROOM_INSET * 2 >= BED.h + 1.1;
}

function hasSofa(room: FloorPlanRoom): boolean {
  return room.w - ROOM_INSET * 2 >= SOFA.w + 0.2 && room.h - ROOM_INSET * 2 >= 2.4;
}

/** Tâm dọc (m, tính từ mép trên mặt bằng) để đặt nhãn phòng — né giường (đặt nhãn ở khoảng
 *  trống bên dưới) và sofa (đặt nhãn ở khoảng trống bên trên). */
function labelCenterY(room: FloorPlanRoom): number {
  if (room.kind === 'bed' && hasBed(room)) {
    const bedBottom = room.y + ROOM_INSET + BED.h;
    return (bedBottom + room.y + room.h) / 2;
  }
  if (room.kind === 'living' && hasSofa(room)) {
    const sofaTop = room.y + room.h - ROOM_INSET - SOFA.h;
    return (room.y + sofaTop) / 2;
  }
  return room.y + room.h / 2;
}

/** Ký hiệu nội thất đơn giản (nét mảnh) theo loại phòng, vẽ bằng đơn vị SVG. Bỏ qua khi phòng
 *  quá nhỏ để không đè lên nhãn. */
function Furniture({ room, box }: { room: FloorPlanRoom; box: Box }): ReactNode {
  const inset = ROOM_INSET * SCALE;
  const ix = box.x + inset;
  const iy = box.y + inset;
  const iw = box.w - inset * 2;
  const ih = box.h - inset * 2;
  const m = (v: number) => v * SCALE;

  switch (room.kind) {
    case 'bed': {
      if (!hasBed(room)) return null;
      const bw = m(BED.w);
      const bh = m(BED.h);
      const bx = ix + (iw - bw) / 2;
      return (
        <g className="fp-furniture">
          <rect x={bx} y={iy} width={bw} height={bh} rx={4} />
          <rect x={bx + 8} y={iy + 8} width={bw / 2 - 12} height={m(0.45)} rx={3} />
          <rect x={bx + bw / 2 + 4} y={iy + 8} width={bw / 2 - 12} height={m(0.45)} rx={3} />
          <line x1={bx} y1={iy + m(0.75)} x2={bx + bw} y2={iy + m(0.75)} />
        </g>
      );
    }
    case 'living': {
      if (!hasSofa(room)) return null;
      const sw = m(SOFA.w);
      const sh = m(SOFA.h);
      const sx = ix + (iw - sw) / 2;
      const sy = iy + ih - sh;
      return (
        <g className="fp-furniture">
          <rect x={sx} y={sy} width={sw} height={sh} rx={6} />
          <line x1={sx + 6} y1={sy + 10} x2={sx + sw - 6} y2={sy + 10} />
        </g>
      );
    }
    case 'kitchen': {
      if (iw < m(1.6) || ih < m(1.4)) return null;
      const depth = m(0.6);
      const big = iw >= m(3.5) && ih >= m(3.8);
      return (
        <g className="fp-furniture">
          <rect x={ix} y={iy} width={iw} height={depth} />
          <rect x={ix + iw - m(0.9)} y={iy + 6} width={m(0.6)} height={depth - 12} rx={4} />
          <circle cx={ix + m(0.45)} cy={iy + depth / 2} r={7} />
          <circle cx={ix + m(0.95)} cy={iy + depth / 2} r={7} />
          {big && <ellipse cx={ix + iw / 2} cy={iy + ih - m(0.7)} rx={m(0.9)} ry={m(0.5)} />}
        </g>
      );
    }
    case 'wc': {
      if (iw < m(0.9) || ih < m(1.2)) return null;
      // Bồn cầu sát góc dưới-trái, vòi sen góc trên-phải — chừa giữa phòng cho nhãn.
      const shower = m(0.7);
      return (
        <g className="fp-furniture">
          <ellipse cx={ix + m(0.25)} cy={iy + ih - m(0.35)} rx={m(0.18)} ry={m(0.25)} />
          <rect x={ix + m(0.07)} y={iy + ih - m(0.12)} width={m(0.36)} height={m(0.12)} />
          <rect x={ix + iw - shower} y={iy} width={shower} height={shower} />
          <line x1={ix + iw - shower} y1={iy} x2={ix + iw} y2={iy + shower} />
        </g>
      );
    }
    case 'garage': {
      const vertical = ih >= iw;
      const cw = vertical ? m(1.8) : m(4.2);
      const ch = vertical ? m(4.2) : m(1.8);
      if (iw < cw || ih < ch) return null;
      const cx = ix + (iw - cw) / 2;
      const cy = iy + (ih - ch) / 2;
      return (
        <g className="fp-furniture">
          <rect x={cx} y={cy} width={cw} height={ch} rx={14} />
          {vertical ? (
            <>
              <line x1={cx + 8} y1={cy + m(1.1)} x2={cx + cw - 8} y2={cy + m(1.1)} />
              <line x1={cx + 8} y1={cy + ch - m(1)} x2={cx + cw - 8} y2={cy + ch - m(1)} />
            </>
          ) : (
            <>
              <line x1={cx + m(1.1)} y1={cy + 8} x2={cx + m(1.1)} y2={cy + ch - 8} />
              <line x1={cx + cw - m(1)} y1={cy + 8} x2={cx + cw - m(1)} y2={cy + ch - 8} />
            </>
          )}
        </g>
      );
    }
    case 'stair': {
      // Bậc thang chạy theo chiều dài hơn của ô cầu thang.
      const alongY = box.h >= box.w;
      const run = alongY ? box.h : box.w;
      const steps = Math.floor(run / 12);
      return (
        <g className="fp-furniture">
          {Array.from({ length: steps - 1 }, (_, i) =>
            alongY ? (
              <line key={i} x1={box.x + 4} y1={box.y + (i + 1) * 12} x2={box.x + box.w - 4} y2={box.y + (i + 1) * 12} />
            ) : (
              <line key={i} x1={box.x + (i + 1) * 12} y1={box.y + 4} x2={box.x + (i + 1) * 12} y2={box.y + box.h - 4} />
            ),
          )}
          {alongY ? (
            <line className="fp-arrow" x1={box.x + box.w / 2} y1={box.y + box.h - 10} x2={box.x + box.w / 2} y2={box.y + 14} />
          ) : (
            <line className="fp-arrow" x1={box.x + 10} y1={box.y + box.h / 2} x2={box.x + box.w - 14} y2={box.y + box.h / 2} />
          )}
        </g>
      );
    }
    case 'outdoor': {
      // Chậu cây ở 2 góc chéo — chỉ vẽ khi khoảng sân đủ rộng để không đè lên nhãn.
      if (iw < m(2.2) || ih < m(1.6)) return null;
      const r = m(0.25);
      return (
        <g className="fp-furniture">
          <circle cx={ix + r + 4} cy={iy + r + 4} r={r} />
          <circle cx={ix + iw - r - 4} cy={iy + ih - r - 4} r={r} />
        </g>
      );
    }
    case 'shop': {
      if (iw < m(3) || ih < m(4)) return null;
      const shelf = m(0.5);
      return (
        <g className="fp-furniture">
          <rect x={ix} y={iy + m(1.5)} width={shelf} height={ih - m(3)} />
          <rect x={ix + iw - shelf} y={iy + m(1.5)} width={shelf} height={ih - m(3)} />
          <rect x={ix + iw / 2 - m(1)} y={iy + ih - m(1.2)} width={m(2)} height={m(0.7)} rx={4} />
        </g>
      );
    }
    case 'storage': {
      if (iw < m(0.8) || ih < m(0.8)) return null;
      return (
        <g className="fp-furniture">
          <line x1={ix} y1={iy} x2={ix + iw} y2={iy + ih} />
          <line x1={ix + iw} y1={iy} x2={ix} y2={iy + ih} />
        </g>
      );
    }
    default:
      return null;
  }
}

function transpose(plan: FloorPlan): FloorPlan {
  return {
    ...plan,
    width: plan.depth,
    depth: plan.width,
    rooms: plan.rooms.map((r) => ({ ...r, x: r.y, y: r.x, w: r.h, h: r.w })),
  };
}

/** Bản vẽ mặt bằng dạng blueprint (SVG thuần) — nét Cream trên nền Cocoa, lưới mờ, tường ngoài
 *  dày, vách trong mảnh, nhãn phòng + diện tích, đường kích thước tổng và mũi tên chỉ hướng Bắc. */
export default function FloorPlanDrawing({ plan: source }: { plan: FloorPlan }) {
  // Mặt bằng quá dài (vd nhà phố 5 × 20m) xoay ngang (hoán đổi trục x/y) để bản vẽ vừa khung
  // ngang và chữ không bị thu quá nhỏ.
  const plan = source.depth > source.width * 1.3 ? transpose(source) : source;
  const W = plan.width * SCALE;
  const D = plan.depth * SCALE;
  const vbW = PAD_START + W + PAD_END;
  const vbH = PAD_START + D + PAD_END;
  const ox = PAD_START;
  const oy = PAD_START;
  const patternId = `fp-hatch-${plan.id}`;
  const gridId = `fp-grid-${plan.id}`;

  return (
    <svg
      className="fp-svg"
      viewBox={`0 0 ${vbW} ${vbH}`}
      role="img"
      aria-label={`Bản vẽ mặt bằng ${plan.code} — ${plan.name}, ${plan.area}m²`}
    >
      <defs>
        <pattern id={gridId} width={SCALE / 2} height={SCALE / 2} patternUnits="userSpaceOnUse">
          <path d={`M ${SCALE / 2} 0 L 0 0 0 ${SCALE / 2}`} className="fp-grid-line" />
        </pattern>
        <pattern id={patternId} width={10} height={10} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={10} className="fp-hatch-line" />
        </pattern>
      </defs>

      <rect width={vbW} height={vbH} fill={`url(#${gridId})`} />

      {/* Đường kích thước: chiều ngang (trên) và chiều sâu (trái) */}
      <g className="fp-dim">
        <line x1={ox} y1={oy - 30} x2={ox + W} y2={oy - 30} />
        <line x1={ox} y1={oy - 38} x2={ox} y2={oy - 22} />
        <line x1={ox + W} y1={oy - 38} x2={ox + W} y2={oy - 22} />
        <text x={ox + W / 2} y={oy - 38} textAnchor="middle">
          {plan.width} m
        </text>
        <line x1={ox - 30} y1={oy} x2={ox - 30} y2={oy + D} />
        <line x1={ox - 38} y1={oy} x2={ox - 22} y2={oy} />
        <line x1={ox - 38} y1={oy + D} x2={ox - 22} y2={oy + D} />
        <text
          x={ox - 38}
          y={oy + D / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${ox - 38} ${oy + D / 2})`}
        >
          {plan.depth} m
        </text>
      </g>

      {/* Hướng Bắc */}
      <g className="fp-north" transform={`translate(${ox + W - 14} ${oy - 44})`}>
        <path d="M 0 -10 L 6 8 L 0 4 L -6 8 Z" />
        <text x={14} y={6}>
          N
        </text>
      </g>

      {plan.rooms.map((room) => {
        const box = { x: ox + room.x * SCALE, y: oy + room.y * SCALE, w: room.w * SCALE, h: room.h * SCALE };
        const area = Math.round(room.w * room.h * 10) / 10;
        const labelSize = Math.max(8, Math.min(14, box.w / (room.label.length * 0.58)));
        const cx = box.x + box.w / 2;
        const cy = oy + labelCenterY(room) * SCALE;
        return (
          <g key={`${room.label}-${room.x}-${room.y}`} className={`fp-room fp-room-${room.kind}`}>
            <rect
              x={box.x}
              y={box.y}
              width={box.w}
              height={box.h}
              className="fp-room-fill"
              fill={room.kind === 'outdoor' ? `url(#${patternId})` : undefined}
            />
            <Furniture room={room} box={box} />
            <text x={cx} y={cy - 2} textAnchor="middle" className="fp-label" style={{ fontSize: labelSize }}>
              {room.label}
            </text>
            {box.h >= 48 && (
              <text x={cx} y={cy + labelSize + 2} textAnchor="middle" className="fp-area">
                {area} m²
              </text>
            )}
          </g>
        );
      })}

      {/* Tường ngoài vẽ sau cùng để đè lên mép các phòng */}
      <rect x={ox} y={oy} width={W} height={D} className="fp-outer-wall" />
    </svg>
  );
}
