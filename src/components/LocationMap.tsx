import { useEffect, useId, useMemo, useState, type MouseEvent } from 'react';
import { Building2 } from 'lucide-react';
import type { LocationConnection } from '../data/projectDetails';
import { REGION_LOADERS } from '../data/maps';
import type { RegionMap } from '../data/maps/types';

/* =========================================================
   Bản đồ tương tác cho mục Vị trí đắc địa — vẽ bằng SVG từ DỮ LIỆU THẬT:
   - Nền: đường lớn, sông, mặt nước thật của khu vực (OpenStreetMap, src/data/maps/*.ts)
   - Tuyến: đường lái xe thật từ dự án tới từng điểm kết nối + thời gian thật (OSRM,
     src/data/projectRoutes.ts) — dữ liệu tính sẵn bởi scripts/map-data/generate.mjs.
   Liên kết hai chiều với danh sách kết nối bên cạnh (state nằm ở ProjectLocation):
   - bấm ghim / nhãn / tuyến trên bản đồ → chọn điểm (mục trong danh sách sáng lên); bấm lại hoặc
     bấm vùng trống của bản đồ → bỏ chọn
   - rê chuột lên ghim / tuyến ↔ mục trong danh sách cùng hiện trạng thái hover
   Tuyến được chọn sáng rõ + nét đứt chạy theo hướng đi; các tuyến khác đứng yên, mờ đi.
   ========================================================= */

const VB_W = 800;
const VB_H = 520;
const PAD = { top: 100, right: 40, bottom: 40, left: 40 }; // chừa chỗ thẻ tên dự án (HUD) + ghim cao ~30px

const LABEL_H = 40;
const TAG_H = 24; // thẻ tên dự án dưới ghim dự án

/** Thẻ tên dự án: mặc định nằm dưới ghim, sát đáy khung (dòng hướng dẫn) thì chuyển lên trên. */
function originTagRect(origin: Pt, name: string): Rect {
  const w = Math.round(name.length * 6.9 + 28);
  const x = Math.min(Math.max(origin[0] - w / 2, 8), VB_W - w - 8);
  const below = origin[1] + 30;
  const y = below + TAG_H > VB_H - 36 ? origin[1] - 32 - TAG_H : below; // chừa dòng hướng dẫn ở đáy
  return { x, y, w, h: TAG_H };
}

type Pt = [number, number];

/** Phép chiếu Web Mercator → toạ độ khung hình, vừa khít vùng bao các tuyến. */
function makeProjection(points: Pt[]) {
  const merc = ([lng, lat]: Pt): Pt => [
    lng,
    (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI,
  ];
  const ms = points.map(merc);
  const xs = ms.map((p) => p[0]);
  const ys = ms.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const w = VB_W - PAD.left - PAD.right;
  const h = VB_H - PAD.top - PAD.bottom;
  const scale = Math.min(w / (x1 - x0 || 1e-6), h / (y1 - y0 || 1e-6));
  const ox = PAD.left + (w - (x1 - x0) * scale) / 2;
  const oy = PAD.top + (h - (y1 - y0) * scale) / 2;
  return (p: Pt): Pt => {
    const [mx, my] = merc(p);
    return [ox + (mx - x0) * scale, oy + (y1 - my) * scale];
  };
}

const f1 = (v: number) => v.toFixed(1);
const toPath = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${f1(x)} ${f1(y)}`).join(' ');
const pairs = (flat: number[]): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < flat.length; i += 2) out.push([flat[i], flat[i + 1]]);
  return out;
};

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w + 4 && b.x < a.x + a.w + 4 && a.y < b.y + b.h + 4 && b.y < a.y + a.h + 4;

/** Chọn vị trí nhãn quanh ghim sao cho nằm trong khung và không chồng lên nhãn/ghim đã đặt:
 *  thử sát ghim trước (dưới → trên → phải → trái), rồi xa dần ra (điểm đến gần nhau như nội
 *  đô Hà Nội, Đà Nẵng); không chỗ nào trống thì lấy vị trí ít chồng nhất. */
function placeLabel(sx: number, sy: number, w: number, placed: Rect[]): { x: number; y: number } {
  const clampX = (x: number) => Math.min(Math.max(x, 8), VB_W - w - 8);
  const candidates: { x: number; y: number }[] = [];
  for (const ring of [0, 1, 2]) {
    const dy = ring * (LABEL_H + 6);
    candidates.push(
      { x: clampX(sx - w / 2), y: sy + 12 + dy },
      { x: clampX(sx - w / 2), y: sy - 34 - LABEL_H - dy },
      { x: sx + 16, y: sy - 34 + dy },
      { x: sx - 16 - w, y: sy - 34 + dy },
      { x: sx + 16, y: sy - 34 - dy },
      { x: sx - 16 - w, y: sy - 34 - dy },
    );
  }
  let best = candidates[0];
  let bestHits = Infinity;
  for (const c of candidates) {
    const rect = { ...c, w, h: LABEL_H };
    if (c.x < 6 || c.x + w > VB_W - 6 || c.y < 6 || c.y + LABEL_H > VB_H - 6) continue;
    const hits = placed.filter((p) => overlaps(rect, p)).length;
    if (hits === 0) return c;
    if (hits < bestHits) {
      best = c;
      bestHits = hits;
    }
  }
  return best;
}

interface Stop {
  sx: number;
  sy: number;
  path: string;
  labelX: number;
  labelY: number;
  labelW: number;
  leader?: readonly [number, number, number, number]; // đường nối ghim → nhãn (x1, y1, x2, y2)
}

function layoutStops(
  connections: LocationConnection[],
  project: (p: Pt) => Pt,
  origin: Pt,
  originTag: Rect,
): Stop[] {
  const placed: Rect[] = [
    { x: 0, y: 0, w: 320, h: 56 }, // nhãn dự án góc trên
    { x: origin[0] - 28, y: origin[1] - 28, w: 56, h: 56 }, // ghim dự án (huy hiệu + vòng sáng)
    originTag, // thẻ tên dự án
  ];
  const ends = connections.map((c) =>
    c.route ? project([c.route.dest[1], c.route.dest[0]]) : origin,
  );
  // Đăng ký mọi ghim điểm đến trước → nhãn đặt sau sẽ né cả ghim của các điểm chưa duyệt tới
  for (const [ex, ey] of ends) placed.push({ x: ex - 11, y: ey - 30, w: 22, h: 32 });
  return connections.map((c, i) => {
    const pts = (c.route?.path ?? []).map(project);
    const end = ends[i];
    // Tuyến bắt đầu đúng ghim dự án, kết thúc đúng điểm đến
    const line = [origin, ...pts.slice(1, -1), end];

    const labelW = Math.max(118, c.place.length * 6.4 + 64);
    const { x: labelX, y: labelY } = placeLabel(end[0], end[1], labelW, placed);
    placed.push({ x: labelX, y: labelY, w: labelW, h: LABEL_H });
    // Nhãn bị đẩy xa ghim (khu đông điểm) → kẻ đường nối mảnh từ đầu ghim tới mép nhãn gần nhất
    const hx = end[0];
    const hy = end[1] - 18;
    const nx = Math.min(Math.max(hx, labelX), labelX + labelW);
    const ny = Math.min(Math.max(hy, labelY), labelY + LABEL_H);
    const leader = Math.hypot(nx - hx, ny - hy) > 30 ? ([hx, hy, nx, ny] as const) : undefined;
    return { sx: end[0], sy: end[1], path: toPath(line), labelX, labelY, labelW, leader };
  });
}

/** Nền bản đồ thật (đã chiếu sang toạ độ khung hình). */
function RegionBackdrop({ uid, region, project }: { uid: string; region: RegionMap; project: (p: Pt) => Pt }) {
  const shapes = useMemo(() => {
    const visible = (pts: Pt[]) =>
      pts.some(([x, y]) => x > -60 && x < VB_W + 60 && y > -60 && y < VB_H + 60);
    const water = region.water.map((w) => pairs(w.p).map(project)).filter(visible);
    const rivers = region.rivers.map((r) => ({ n: r.n, pts: pairs(r.p).map(project) })).filter((r) => visible(r.pts));
    const roads = region.roads.map((r) => ({ c: r.c, n: r.n, pts: pairs(r.p).map(project) })).filter((r) => visible(r.pts));

    // Tên đường: chọn vài đoạn đường lớn có tên, dài nhất trong khung, mỗi tên một lần
    const len = (pts: Pt[]) =>
      pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
    const named = new Map<string, Pt[]>();
    for (const r of [...roads, ...rivers.map((v) => ({ c: 1, n: v.n, pts: v.pts }))]) {
      if (!r.n || r.c > 2) continue;
      const inside = r.pts.filter(([x, y]) => x > 20 && x < VB_W - 20 && y > 60 && y < VB_H - 20);
      if (inside.length < 2 || len(inside) < 140) continue;
      if (!named.has(r.n) || len(named.get(r.n)!) < len(inside)) named.set(r.n, inside);
    }
    const labels = [...named.entries()]
      .sort((a, b) => len(b[1]) - len(a[1]))
      .slice(0, 6)
      .map(([n, pts]) => ({ n, pts: pts[0][0] > pts[pts.length - 1][0] ? [...pts].reverse() : pts }));
    return { water, rivers, roads, labels };
  }, [region, project]);

  return (
    <g className="lmv-backdrop" aria-hidden="true">
      {shapes.water.map((pts, i) => (
        <path key={`w${i}`} className="lmv-water" d={`${toPath(pts)} Z`} />
      ))}
      {shapes.rivers.map((r, i) => (
        <path key={`r${i}`} className="lmv-river" d={toPath(r.pts)} />
      ))}
      {[3, 2, 1, 0].map((c) => (
        <g key={`c${c}`} className={`lmv-casing lmv-casing-${c}`}>
          {shapes.roads.filter((r) => r.c === c).map((r, i) => (
            <path key={i} d={toPath(r.pts)} />
          ))}
        </g>
      ))}
      {[3, 2, 1, 0].map((c) => (
        <g key={`f${c}`} className={`lmv-roadfill lmv-roadfill-${c}`}>
          {shapes.roads.filter((r) => r.c === c).map((r, i) => (
            <path key={i} d={toPath(r.pts)} />
          ))}
        </g>
      ))}
      <defs>
        {shapes.labels.map((l, i) => (
          <path key={i} id={`${uid}-name${i}`} d={toPath(l.pts)} />
        ))}
      </defs>
      <g className="lmv-road-name">
        {shapes.labels.map((l, i) => (
          <text key={i} dy={-6}>
            <textPath href={`#${uid}-name${i}`} startOffset="50%" textAnchor="middle">
              {l.n}
            </textPath>
          </text>
        ))}
      </g>
    </g>
  );
}

interface LocationMapProps {
  projectName: string;
  locationName: string;
  origin: [number, number]; // [lat, lng]
  connections: LocationConnection[];
  selected: number; // điểm đang chọn (-1 = không chọn)
  hovered: number; // điểm đang rê chuột (-1 = không)
  onSelect: (index: number) => void; // -1 = bỏ chọn
  onHover: (index: number) => void;
}

export default function LocationMap({
  projectName,
  locationName,
  origin,
  connections,
  selected,
  hovered,
  onSelect,
  onHover,
}: LocationMapProps) {
  // id duy nhất cho defs (useId sinh ":r0:" — bỏ dấu ":" để dùng được trong url(#...))
  const uid = `lmv${useId().replace(/:/g, '')}`;
  const originLngLat: Pt = [origin[1], origin[0]];

  const project = useMemo(() => {
    const pts: Pt[] = [originLngLat];
    for (const c of connections) {
      if (c.route) pts.push(...c.route.path, [c.route.dest[1], c.route.dest[0]]);
    }
    return makeProjection(pts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections, origin[0], origin[1]]);
  const originXY = useMemo(() => project(originLngLat), [project]); // eslint-disable-line react-hooks/exhaustive-deps
  const originTag = useMemo(() => originTagRect(originXY, projectName), [originXY, projectName]);
  const stops = useMemo(
    () => layoutStops(connections, project, originXY, originTag),
    [connections, project, originXY, originTag],
  );

  // Nền bản đồ thật của tỉnh/thành — tải động
  const [region, setRegion] = useState<RegionMap | null>(null);
  useEffect(() => {
    let alive = true;
    setRegion(null);
    REGION_LOADERS[locationName]?.().then((m) => alive && setRegion(m.default));
    return () => {
      alive = false;
    };
  }, [locationName]);

  const state = (i: number) => `${i === selected ? ' is-selected' : ''}${i === hovered ? ' is-hovered' : ''}`;
  const toggle = (i: number) => onSelect(i === selected ? -1 : i);
  // Thao tác chung cho ghim / nhãn / tuyến của một điểm
  const pointerProps = (i: number) => ({
    onClick: (e: MouseEvent) => {
      e.stopPropagation();
      toggle(i);
    },
    onMouseEnter: () => onHover(i),
    onMouseLeave: () => onHover(-1),
  });

  return (
    <div className={`lmv${selected >= 0 ? ' has-selection' : ''}${hovered >= 0 ? ' has-hover' : ''}`}>
      <svg
        className="lmv-svg"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        aria-label={`Bản đồ tuyến đường từ ${projectName}`}
        onClick={() => selected >= 0 && onSelect(-1)}
      >
        <defs>
          <radialGradient id={`${uid}-vignette`} cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="#2a1f19" stopOpacity={0} />
            <stop offset="100%" stopColor="#2a1f19" stopOpacity={0.7} />
          </radialGradient>
        </defs>

        <rect width={VB_W} height={VB_H} className="lmv-land" />
        {region && <RegionBackdrop uid={uid} region={region} project={project} />}

        {stops.map((s, i) => (
          <g key={`route-${i}`} className={`lmv-route-group${state(i)}`} {...pointerProps(i)}>
            {/* Nét trong suốt rộng để dễ bấm / rê chuột trúng tuyến */}
            <path className="lmv-route-hit" d={s.path} />
            <path className="lmv-route-glow" d={s.path} />
            <path className="lmv-route" d={s.path} />
          </g>
        ))}

        {stops.map((s, i) => {
          const { icon: Icon, place, minutes } = connections[i];
          return (
            <g
              key={`stop-${i}`}
              className={`lmv-stop${state(i)}`}
              role="button"
              tabIndex={0}
              aria-pressed={i === selected}
              aria-label={`${place}, ${minutes} phút lái xe`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggle(i);
                }
              }}
              onFocus={() => onHover(i)}
              onBlur={() => onHover(-1)}
              {...pointerProps(i)}
            >
              {s.leader && (
                <line className="lmv-leader" x1={s.leader[0]} y1={s.leader[1]} x2={s.leader[2]} y2={s.leader[3]} />
              )}
              <ellipse className="lmv-stop-shadow" cx={s.sx} cy={s.sy} rx={7} ry={2.5} />
              {/* Lớp ngoài chỉ đặt vị trí (đầu nhọn ghim = gốc toạ độ 0,0); lớp trong chứa ghim +
                  chấm giữa, phóng to quanh gốc 0,0 khi được chọn → ghim không bị lệch khỏi điểm */}
              <g transform={`translate(${s.sx} ${s.sy})`}>
                <g className="lmv-stop-marker">
                  <path
                    className="lmv-stop-pin"
                    d="M 0 0 C -3 -6, -10 -11, -10 -18 A 10 10 0 1 1 10 -18 C 10 -11, 3 -6, 0 0 Z"
                  />
                  <circle className="lmv-stop-dot" cx={0} cy={-18} r={3.6} />
                </g>
              </g>
              <g className="lmv-label" transform={`translate(${s.labelX} ${s.labelY})`}>
                <rect width={s.labelW} height={LABEL_H} rx={20} />
                <circle cx={20} cy={20} r={13} className="lmv-label-ic-bg" />
                <Icon x={12} y={12} width={16} height={16} className="lmv-label-ic" />
                <text x={40} y={17} className="lmv-label-place">
                  {place}
                </text>
                <text x={40} y={31} className="lmv-label-time">
                  {minutes} phút
                </text>
              </g>
            </g>
          );
        })}

        {/* Ghim dự án: huy hiệu hình thoi màu kem + biểu tượng toà nhà + vòng sáng nét đứt xoay chậm
            + thẻ tên — khác hẳn ghim giọt nước màu vàng của các điểm kết nối */}
        <g className="lmv-pin">
          <g transform={`translate(${originXY[0]} ${originXY[1]})`}>
            <circle className="lmv-pulse" r={20} />
            <circle className="lmv-pulse lmv-pulse-2" r={20} />
            <circle className="lmv-pin-halo" r={27} />
            <circle className="lmv-pin-orbit" r={27} />
            <ellipse className="lmv-pin-shadow" cx={0} cy={24} rx={14} ry={3.5} />
            <rect className="lmv-pin-core" x={-15} y={-15} width={30} height={30} rx={7} transform="rotate(45)" />
            <rect className="lmv-pin-inner" x={-10.5} y={-10.5} width={21} height={21} rx={4.5} transform="rotate(45)" />
            <Building2 x={-8.5} y={-8.5} width={17} height={17} className="lmv-pin-ic" />
          </g>
          <g className="lmv-pin-tag" transform={`translate(${originTag.x} ${originTag.y})`}>
            <rect width={originTag.w} height={TAG_H} rx={TAG_H / 2} />
            <text x={originTag.w / 2} y={TAG_H / 2 + 4} textAnchor="middle">
              {projectName}
            </text>
          </g>
        </g>

        <rect width={VB_W} height={VB_H} fill={`url(#${uid}-vignette)`} pointerEvents="none" />
      </svg>

      <div className="lmv-hud">
        <span className="lmv-tag">
          <span className="lmv-tag-dot" aria-hidden="true" />
          <strong>{projectName}</strong> · {locationName}
        </span>
      </div>
      <span className="lmv-hint" aria-hidden="true">
        Bấm vào điểm trên bản đồ hoặc danh sách để xem tuyến đường
      </span>
      <span className="lmv-attrib">© OpenStreetMap · OSRM</span>
    </div>
  );
}
