// Tạo dữ liệu bản đồ thật cho mục "Vị trí đắc địa" (trang chi tiết dự án).
//   node scripts/map-data/generate.mjs
// - Tuyến đường + thời gian lái xe: OSRM (router.project-osrm.org, dữ liệu OpenStreetMap)
// - Nền bản đồ (đường lớn, sông, mặt nước): Overpass API (OpenStreetMap)
// Kết quả ghi vào src/data/projectRoutes.ts và src/data/maps/<tỉnh>.ts — web chỉ đọc dữ liệu
// tĩnh này, không gọi API khi chạy. Dữ liệu © OpenStreetMap contributors (ODbL).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { DESTINATIONS, PROJECT_ORIGINS, PROVINCE_SLUG } from './places.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '../..');
const OUT_ROUTES = path.join(ROOT, 'src/data/projectRoutes.ts');
const OUT_MAPS = path.join(ROOT, 'src/data/maps');
const UA = 'terra-site-map-data/1.0';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Douglas–Peucker trên toạ độ [lng, lat]. */
function simplify(points, tol) {
  if (points.length <= 2) return points;
  const sqTol = tol * tol;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = dx * dx + dy * dy;
    let maxD = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      let t = len ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
      t = Math.max(0, Math.min(1, t));
      const ex = ax + t * dx - px;
      const ey = ay + t * dy - py;
      const d = ex * ex + ey * ey;
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > sqTol && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const r5 = (v) => Math.round(v * 1e5) / 1e5;
const flat = (pts) => pts.flatMap(([x, y]) => [r5(x), r5(y)]);

// Gọi qua curl (dùng kho chứng chỉ của hệ điều hành) thay vì fetch của Node — mạng có proxy/
// chứng chỉ nội bộ thường khiến fetch của Node báo lỗi UNABLE_TO_GET_ISSUER_CERT_LOCALLY.
async function fetchJson(url, init, tries = 4) {
  const args = ['-sS', '--fail', '--max-time', '180', '-A', UA];
  if (init?.method === 'POST') args.push('-X', 'POST', '-H', `Content-Type: ${init.headers['Content-Type']}`, '--data-binary', '@-');
  args.push(url);
  for (let i = 0; i < tries; i++) {
    try {
      const out = execFileSync('curl', args, { input: init?.body ?? '', maxBuffer: 512 * 1024 * 1024 });
      return JSON.parse(out.toString('utf8'));
    } catch (e) {
      console.warn(`  ${String(e.message).split('\n')[0]} — thử lại`);
    }
    await sleep(2000 * (i + 1));
  }
  throw new Error(`Không tải được ${url}`);
}

async function route(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const file = path.join(CACHE, 'osrm', `${from.join('_')}-${to.join('_')}.json`);
  let data;
  if (fs.existsSync(file)) data = JSON.parse(fs.readFileSync(file, 'utf8'));
  else {
    data = await fetchJson(url);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data));
    await sleep(350);
  }
  const r = data.routes[0];
  return {
    minutes: Math.max(2, Math.round(r.duration / 60)),
    km: Math.round(r.distance / 100) / 10,
    path: simplify(r.geometry.coordinates, 0.00012),
  };
}

const CACHE = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '.cache');
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

/** Dữ liệu OSM thô cho một vùng — lưu cache (scripts/map-data/.cache) để chạy lại không phải tải
 *  lại; máy chủ quá tải thì thử máy chủ Overpass khác. */
/** Vùng rộng → chia thành các ô ≤ TILE độ, tải từng ô (máy chủ đỡ quá tải) rồi gộp, bỏ trùng. */
const TILE = 0.16;
const FAILED = [];
async function overpass(slug, bbox) {
  const whole = path.join(CACHE, `${slug}.json`); // cache cả vùng (từ lần tải không chia ô)
  if (fs.existsSync(whole)) return JSON.parse(fs.readFileSync(whole, 'utf8'));
  const [s, w, n, e] = bbox;
  const span = Math.max(n - s, e - w);
  const rows = Math.ceil((n - s) / TILE);
  const cols = Math.ceil((e - w) / TILE);
  const seen = new Set();
  const elements = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = [s + ((n - s) * r) / rows, w + ((e - w) * c) / cols, s + ((n - s) * (r + 1)) / rows, w + ((e - w) * (c + 1)) / cols];
      let data;
      try {
        data = await overpassTile(`${slug}-${r}-${c}`, tile, span);
      } catch (e) {
        // Ô lỗi: bỏ qua lần này (vẫn ghi phần đã có), chạy lại script sẽ tải bù nhờ cache
        console.warn(`  ! ${e.message}`);
        FAILED.push(`${slug}-${r}-${c}`);
        continue;
      }
      for (const el of data.elements) {
        const key = `${el.type}/${el.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        elements.push(el);
      }
    }
  }
  return { elements };
}

async function overpassTile(key, bbox, span) {
  const file = path.join(CACHE, `${key}.json`);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const [s, w, n, e] = bbox.map(r5);
  const b = `(${s},${w},${n},${e})`;
  const roadRe = span > 0.2 ? '^(motorway|trunk|primary)$' : '^(motorway|trunk|primary|secondary)$';
  const q = `[out:json][timeout:180];(
    way["highway"~"${roadRe}"]${b};
    way["waterway"="river"]${b};
    way["natural"="water"]["water"~"^(river|lake|reservoir|canal)$"]${b};
    relation["natural"="water"]["water"~"^(river|lake|reservoir)$"]${b};
  );out geom;`;
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const data = await fetchJson(mirror, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(q)}`,
      }, 2);
      fs.mkdirSync(CACHE, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(data));
      await sleep(1500);
      return data;
    } catch {
      console.warn(`  ${mirror} không phản hồi — thử máy chủ khác`);
    }
  }
  throw new Error(`Không tải được dữ liệu Overpass cho ô ${key}`);
}

const ROAD_CLASS = { motorway: 0, trunk: 1, primary: 2, secondary: 3 };

/** Ghép các đoạn viền "outer" của multipolygon (sông/hồ lớn trong OSM thường gồm nhiều way nối
 *  đầu–cuối) thành các vòng khép kín. Đoạn không khép được thì bỏ — tô màu một vòng hở sẽ sai. */
function joinRings(ways) {
  const same = (a, b) => Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7;
  const pool = ways.map((w) => [...w]);
  const rings = [];
  while (pool.length) {
    let ring = pool.shift();
    let grew = true;
    while (!same(ring[0], ring[ring.length - 1]) && grew) {
      grew = false;
      for (let i = 0; i < pool.length; i++) {
        const w = pool[i];
        const end = ring[ring.length - 1];
        if (same(end, w[0])) ring = ring.concat(w.slice(1));
        else if (same(end, w[w.length - 1])) ring = ring.concat([...w].reverse().slice(1));
        else if (same(ring[0], w[w.length - 1])) ring = w.concat(ring.slice(1));
        else if (same(ring[0], w[0])) ring = [...w].reverse().concat(ring.slice(1));
        else continue;
        pool.splice(i, 1);
        grew = true;
        break;
      }
    }
    if (ring.length >= 4 && same(ring[0], ring[ring.length - 1])) rings.push(ring);
  }
  return rings;
}

async function main() {
  // 1) Tuyến đường từng dự án → từng điểm kết nối
  const routes = {};
  for (const [id, proj] of Object.entries(PROJECT_ORIGINS)) {
    console.log(`Tuyến: ${proj.name}`);
    const list = [];
    for (const dest of DESTINATIONS[proj.province]) {
      const r = await route(proj.coord, dest.coord);
      list.push({ place: dest.place, dest: dest.coord, ...r });
      console.log(`  → ${dest.place}: ${r.minutes} phút, ${r.km} km, ${r.path.length} điểm`);
    }
    routes[id] = { origin: proj.coord, routes: list };
  }

  const routesTs = `// TỰ SINH bởi scripts/map-data/generate.mjs — không sửa tay.
// Tuyến lái xe thật (OSRM, dữ liệu © OpenStreetMap contributors). path: [lng, lat][].
export interface ProjectRoute {
  place: string;
  dest: [number, number]; // [lat, lng]
  minutes: number;
  km: number;
  path: [number, number][];
}

export interface ProjectRouteSet {
  origin: [number, number]; // [lat, lng]
  routes: ProjectRoute[];
}

export const PROJECT_ROUTES: Record<string, ProjectRouteSet> = ${JSON.stringify(
    Object.fromEntries(
      Object.entries(routes).map(([id, v]) => [
        id,
        { origin: v.origin, routes: v.routes.map((r) => ({ ...r, path: r.path.map(([x, y]) => [r5(x), r5(y)]) })) },
      ]),
    ),
  )};
`;
  fs.writeFileSync(OUT_ROUTES, routesTs);
  console.log(`Đã ghi ${path.relative(ROOT, OUT_ROUTES)} (${(routesTs.length / 1024).toFixed(1)} KB)`);

  // 2) Nền bản đồ theo tỉnh: vùng bao các tuyến của mọi dự án trong tỉnh
  fs.mkdirSync(OUT_MAPS, { recursive: true });
  for (const [province, slug] of Object.entries(PROVINCE_SLUG)) {
    const pts = Object.entries(PROJECT_ORIGINS)
      .filter(([, p]) => p.province === province)
      .flatMap(([id]) => routes[id].routes.flatMap((r) => r.path));
    if (!pts.length) continue;
    const lngs = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    const padLat = (Math.max(...lats) - Math.min(...lats)) * 0.35 + 0.01;
    const padLng = (Math.max(...lngs) - Math.min(...lngs)) * 0.35 + 0.01;
    const bbox = [Math.min(...lats) - padLat, Math.min(...lngs) - padLng, Math.max(...lats) + padLat, Math.max(...lngs) + padLng];
    console.log(`Nền bản đồ: ${province} bbox ${bbox.map(r5).join(',')}`);
    const data = await overpass(slug, bbox);
    const span = Math.max(bbox[2] - bbox[0], bbox[3] - bbox[1]);
    const tol = span / 1400; // ~ độ phân giải hiển thị (khung ~800px)
    // Vùng rộng: bỏ đường cấp "secondary" để dữ liệu gọn; luôn bỏ ao hồ / đoạn đường quá nhỏ
    const maxRoadClass = span > 0.2 ? 2 : 3;
    const extent = (pts) => {
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    };
    const roads = [];
    const rivers = [];
    const water = [];
    for (const el of data.elements) {
      const tags = el.tags ?? {};
      const toPts = (g) => g.map((p) => [p.lon, p.lat]);
      let lines;
      if (el.type === 'way') lines = el.geometry ? [toPts(el.geometry)] : [];
      else {
        const outers = (el.members ?? []).filter((m) => m.role === 'outer' && m.geometry).map((m) => toPts(m.geometry));
        lines = joinRings(outers);
      }
      for (const raw of lines) {
        if (raw.length < 2) continue;
        // Mặt nước chỉ tô khi là vòng khép kín
        if (tags.natural === 'water' && el.type === 'way') {
          const [a, b] = [raw[0], raw[raw.length - 1]];
          if (a[0] !== b[0] || a[1] !== b[1]) continue;
        }
        const size = extent(raw);
        const simp = simplify(raw, tol);
        if (simp.length < 2) continue;
        if (tags.highway in ROAD_CLASS) {
          const c = ROAD_CLASS[tags.highway];
          if (c > maxRoadClass || (c >= 2 && size < span / 200)) continue;
          roads.push({ c, n: tags.name, p: flat(simp) });
        } else if (tags.waterway === 'river') {
          if (size < span / 40) continue;
          rivers.push({ n: tags.name, p: flat(simp) });
        } else if (tags.natural === 'water') {
          if (simp.length < 4 || size < span / 35) continue;
          water.push({ p: flat(simp) });
        }
      }
    }
    roads.sort((a, b) => b.c - a.c); // vẽ đường nhỏ trước, cao tốc sau cùng
    const out = `// TỰ SINH bởi scripts/map-data/generate.mjs — không sửa tay.
// Nền bản đồ ${province} (dữ liệu © OpenStreetMap contributors). p: [lng, lat, lng, lat, ...].
// Lưu dạng chuỗi JSON + JSON.parse: TypeScript không phải suy luận kiểu cho literal khổng lồ
// (lỗi TS2590) và trình duyệt parse JSON nhanh hơn parse object literal JS.
import type { RegionMap } from './types';

const map: RegionMap = JSON.parse(${JSON.stringify(JSON.stringify({ bbox: bbox.map(r5), roads, rivers, water }))});

export default map;
`;
    fs.writeFileSync(path.join(OUT_MAPS, `${slug}.ts`), out);
    console.log(`  ${roads.length} đường, ${rivers.length} sông, ${water.length} mặt nước — ${(out.length / 1024).toFixed(0)} KB`);
    await sleep(3000);
  }
  if (FAILED.length) {
    console.warn(`Còn ${FAILED.length} ô chưa tải được: ${FAILED.join(", ")} — chạy lại script để tải bù.`);
    process.exitCode = 2;
  } else console.log("Hoàn tất: đủ dữ liệu mọi vùng.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
