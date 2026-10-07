import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { ArrowRight, DoorOpen, Footprints, Map as MapIcon, Minus, Plus, RotateCcw, X } from 'lucide-react';
import type { FloorPlanRoom, FloorPlanSet } from '../../data/projectDetails';
import type { ProjectGalleryItem } from '../../types';
import { buildLayout, matchRoom, scoreRoom, type HouseLayout } from './planLayout';

/* =========================================================
   Tham quan 3D dựng từ ảnh "Không gian sống" (độ sâu tạo bởi scripts/depth/generate.mjs,
   bảng tra src/data/photo3d.ts). Ưu tiên ảnh SẮC NÉT, không vỡ:
   - Ảnh gốc phủ lên một lưới liền mạch đẩy ra xa theo bản đồ độ sâu. Tại điểm chụp, lưới chiếu lại
     đúng từng điểm ảnh → ảnh hiển thị nguyên vẹn như ảnh gốc.
   - Nhìn quanh = quay camera tại điểm chụp; bước tới = thu hẹp góc nhìn (tiến gần). Cả hai không làm
     biến dạng ảnh.
   - Thị sai 3D chỉ là một nhích rất nhỏ theo chuột, giới hạn theo số điểm ảnh lệch trên màn hình
     (PARALLAX_PX) nên mép vật không bị xé / kéo thành vệt; đứng yên thì camera về đúng điểm chụp.
   - Các phòng nối nhau theo cửa trên bản vẽ mặt bằng (planLayout): nút "Đi tới …" + bản đồ nhỏ.
   ========================================================= */

const PHOTO_VFOV = 50; // góc nhìn dọc giả định của ảnh render (độ) — khớp scripts/depth/generate.mjs
const NEAR_M = 1.1; // điểm gần nhất trong ảnh (m)
const FAR_M = 10; // điểm xa nhất (cửa sổ, chiều sâu phòng) (m)
const SEG = 512; // độ mịn lưới theo chiều ngang
const EXTEND = 0.03; // kéo dài mép ảnh một chút (dự phòng khi nhìn lệch)
const COVER = 0.97; // góc nhìn ban đầu so với ảnh (gần trọn ảnh)
const EDGE_PAD = 1.02; // chừa thêm khi giữ khung nhìn trong mép ảnh (góc chéo khi vừa quay vừa ngẩng)
const ZOOM_MAX = 1.8; // bước tới tối đa (độ phóng)
const FLOOR_KEY = 1000; // khoá phòng trên nhiều tầng: tầng × FLOOR_KEY + chỉ số phòng
const VIRTUAL_KEY = 1e6; // nút riêng cho ảnh không có phòng trên mặt bằng: VIRTUAL_KEY + chỉ số ảnh
const PARALLAX_PX = 14; // độ lệch tối đa (px màn hình) giữa vật gần nhất và xa nhất khi rê chuột

interface Props {
  projectName: string;
  planSet: FloorPlanSet;
  gallery: ProjectGalleryItem[];
  startIndex?: number;
  startPlanId?: string;
  onClose: () => void;
}

/** Khoảng độ sâu (m) dọc mỗi mép ảnh: trái, phải, trên, dưới. */
interface Border {
  l: [number, number];
  r: [number, number];
  t: [number, number];
  b: [number, number];
}

interface RoomMesh {
  mesh: THREE.Mesh;
  texture: THREE.Texture;
  tanH: number; // tan nửa góc ngang / dọc của ảnh
  tanV: number;
  border: Border;
  invRange: number; // chênh nghịch độ sâu gần nhất ↔ xa nhất (1/m) — quyết định độ lệch thị sai
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Đọc ảnh xám (bản đồ độ sâu) → hàm lấy độ sâu (m) tại (u, v) ∈ [0,1], nội suy song tuyến. */
function depthSampler(img: HTMLImageElement | null) {
  if (!img) return () => 4;
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, c.width, c.height).data;
  const w = c.width;
  const h = c.height;
  return (u: number, v: number) => {
    const x = THREE.MathUtils.clamp(u, 0, 1) * (w - 1);
    const y = THREE.MathUtils.clamp(v, 0, 1) * (h - 1);
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, w - 1);
    const y1 = Math.min(y0 + 1, h - 1);
    const px = (xx: number, yy: number) => data[(yy * w + xx) * 4] / 255;
    const fx = x - x0;
    const fy = y - y0;
    const d = (px(x0, y0) * (1 - fx) + px(x1, y0) * fx) * (1 - fy) + (px(x0, y1) * (1 - fx) + px(x1, y1) * fx) * fy;
    return 1 / (d * (1 / NEAR_M - 1 / FAR_M) + 1 / FAR_M); // nghịch độ sâu tương đối → mét
  };
}

/** Lưới liền mạch theo tia nhìn của máy ảnh (không cắt ở mép vật → không răng cưa, không lỗ). */
function photoGrid(depthAt: (u: number, v: number) => number, tanH: number, tanV: number, aspect: number) {
  const segX = SEG;
  const segY = Math.max(40, Math.round(SEG / aspect));
  const cols = segX + 1;
  const n = cols * (segY + 1);
  const pos = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2);
  const z = new Float32Array(n);
  for (let j = 0; j <= segY; j++) {
    for (let i = 0; i <= segX; i++) {
      const u = -EXTEND + ((1 + 2 * EXTEND) * i) / segX;
      const v = -EXTEND + ((1 + 2 * EXTEND) * j) / segY;
      const k = j * cols + i;
      z[k] = depthAt(u, v);
      pos[k * 3] = (u - 0.5) * 2 * tanH * z[k];
      pos[k * 3 + 1] = (0.5 - v) * 2 * tanV * z[k];
      pos[k * 3 + 2] = -z[k];
      uv[k * 2] = THREE.MathUtils.clamp(u, 0, 1);
      uv[k * 2 + 1] = 1 - THREE.MathUtils.clamp(v, 0, 1);
    }
  }
  const index: number[] = [];
  for (let j = 0; j < segY; j++) {
    for (let i = 0; i < segX; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeBoundingSphere();

  // Độ sâu dọc 4 mép ảnh + khoảng nghịch độ sâu của cả ảnh
  const range = (ks: number[]): [number, number] => {
    const zs = ks.map((k) => z[k]);
    return [Math.min(...zs), Math.max(...zs)];
  };
  const colIdx = Array.from({ length: cols }, (_, i) => i);
  const rowIdx = Array.from({ length: segY + 1 }, (_, j) => j * cols);
  const border: Border = {
    l: range(rowIdx),
    r: range(rowIdx.map((k) => k + segX)),
    t: range(colIdx),
    b: range(colIdx.map((i) => segY * cols + i)),
  };
  let zMin = Infinity;
  let zMax = 0;
  for (const zz of z) {
    zMin = Math.min(zMin, zz);
    zMax = Math.max(zMax, zz);
  }
  return { geo, border, invRange: 1 / zMin - 1 / zMax };
}

/** Dựng không gian 3D cho một ảnh. Ảnh chưa có dữ liệu độ sâu → mặt phẳng (vẫn quay / tiến gần được). */
async function buildRoom(item: ProjectGalleryItem, anisotropy: number): Promise<RoomMesh> {
  const [photo, depthImg] = await Promise.all([loadImage(item.image), item.photo3d ? loadImage(item.photo3d.depth) : null]);
  const aspect = photo.width / photo.height;
  const tanV = Math.tan(THREE.MathUtils.degToRad(PHOTO_VFOV / 2));
  const tanH = tanV * aspect;

  // Lọc ảnh chất lượng cao: mipmap + anisotropy tối đa → nét khi thu nhỏ lẫn khi nhìn xiên
  const texture = new THREE.Texture(photo);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  const { geo, border, invRange } = photoGrid(depthSampler(depthImg), tanH, tanV, aspect);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: texture }));
  return { mesh, texture, tanH, tanV, border, invRange };
}

/**
 * Giữ camera trong vùng mà khung nhìn (nửa góc tanCamH × tanCamV, nhìn thẳng) không vượt ra ngoài mép
 * ảnh. Mép ảnh ở độ sâu z nằm tại X = ±tanH·z; camera ở (x, y, 0) còn thấy được tới đó khi
 * (tanH·z ± x) / z ≥ tanCamH — tuyến tính theo z nên chỉ cần xét 2 đầu khoảng độ sâu của mép.
 */
function fitBorder(room: RoomMesh, v: THREE.Vector3, tanCamH: number, tanCamV: number) {
  const lo = (tan: number, tanCam: number, zs: [number, number]) => Math.min(0, Math.max(...zs.map((z) => (tanCam - tan) * z)));
  const b = room.border;
  v.x = THREE.MathUtils.clamp(v.x, lo(room.tanH, tanCamH, b.l), -lo(room.tanH, tanCamH, b.r));
  v.y = THREE.MathUtils.clamp(v.y, lo(room.tanV, tanCamV, b.b), -lo(room.tanV, tanCamV, b.t));
}

/** Tan góc còn thấy được ảnh về mỗi phía khi camera ở c (nhìn thẳng). */
function borderReach(room: RoomMesh, c: THREE.Vector3) {
  const side = (tan: number, zs: [number, number], off: number) => Math.min(...zs.map((z) => (tan * z + off) / z));
  const b = room.border;
  return {
    l: side(room.tanH, b.l, c.x),
    r: side(room.tanH, b.r, -c.x),
    t: side(room.tanV, b.t, -c.y),
    b: side(room.tanV, b.b, c.y),
  };
}

function disposeRoom(r: RoomMesh) {
  r.mesh.geometry.dispose();
  (r.mesh.material as THREE.Material).dispose();
  r.texture.dispose();
}

/**
 * Phòng chủ cho ảnh không có phòng tương ứng trên mặt bằng: phòng thay đồ / phòng tắm → phòng ngủ (ưu tiên
 * master), ban công / sân → phòng khách, … ; không đoán được (vd. "Toàn cảnh dự án") → sảnh tầng dưới cùng.
 */
function hostKey(floors: HouseLayout[], name: string) {
  const n = name.toLowerCase();
  const prefer: FloorPlanRoom['kind'][] = /thay đồ|kho|tắm|wc|vệ sinh/.test(n)
    ? ['bed', 'living']
    : /ban công|sân|vườn|lô gia/.test(n)
      ? ['living', 'kitchen']
      : /ngủ|bếp|ăn/.test(n)
        ? ['living']
        : [];
  for (const kind of prefer) {
    let found = -1;
    floors.forEach((L, f) =>
      L.plan.rooms.forEach((r, i) => {
        if (r.kind !== kind) return;
        if (found < 0 || /master|chính/i.test(r.label)) found = f * FLOOR_KEY + i;
      }),
    );
    if (found >= 0) return found;
  }
  return floors[0].hub;
}

export default function PhotoTour3D({ projectName, planSet, gallery, startIndex, startPlanId, onClose }: Props) {
  // ---- Ghép ảnh với phòng trên mặt bằng ----
  // Nhà nhiều tầng (các mặt bằng là "Tầng 1", "Tầng 2"…): dùng tất cả các tầng, mỗi ảnh vào tầng có phòng
  // khớp nhất (vd. "Phòng thay đồ" lên Tầng 2 chứ không rơi vào "Kho" Tầng 1). Các loại căn hộ khác nhau:
  // chọn một mặt bằng (đang xem, không thì mặt bằng khớp nhiều ảnh nhất).
  // Mỗi phòng được đánh khoá nút = tầng × FLOOR_KEY + chỉ số phòng; −1 = ảnh không thuộc phòng nào.
  const { floors, roomOf, hostOf, startFloor } = useMemo(() => {
    const plans = planSet.plans;
    const multi = plans.length > 1 && /^tầng/i.test(plans[0].name);
    const startAt = startPlanId ? Math.max(0, plans.findIndex((p) => p.id === startPlanId)) : 0;
    let chosen: number[];
    if (multi) chosen = plans.map((_, k) => k);
    else {
      let best = startAt;
      if (!startPlanId) {
        let bestCount = -1;
        plans.forEach((p, k) => {
          const n = gallery.filter((g) => matchRoom(p, g.room) >= 0).length;
          if (n > bestCount) {
            bestCount = n;
            best = k;
          }
        });
      }
      chosen = [best];
    }
    const floors = chosen.map((k) => buildLayout(plans[k], { upper: k > 0 && /^tầng/i.test(plans[0].name) }));
    const roomOf = gallery.map((g) => {
      let best = { key: -1, score: 0 };
      floors.forEach((L, f) => {
        const m = scoreRoom(L.plan, g.room);
        if (m.score > best.score) best = { key: f * FLOOR_KEY + m.room, score: m.score };
      });
      return best.key;
    });
    // Ảnh không có phòng tương ứng trên mặt bằng (vd. "Phòng thay đồ" ở nhà phố không có phòng này):
    // gắn vào phòng hợp lý nhất để vẫn đi tới / đi ra được.
    const hostOf = gallery.map((g, k) => (roomOf[k] >= 0 ? roomOf[k] : hostKey(floors, g.room)));
    return { floors, roomOf, hostOf, startFloor: multi ? startAt : 0 };
  }, [planSet, gallery, startPlanId]);

  /** Các phòng có ảnh đi tới được qua cửa từ phòng hiện tại (gần nhất theo đường đi, lên xuống tầng qua sảnh). */
  const neighborsOf = useCallback(
    (gi: number) => {
      // Nút của mỗi ảnh: phòng của nó, hoặc một nút riêng gắn vào phòng chủ nếu ảnh không có phòng trên mặt bằng
      const nodeOf = (k: number) => (roomOf[k] >= 0 ? roomOf[k] : VIRTUAL_KEY + k);
      const start = nodeOf(gi);
      const adj = new Map<number, number[]>();
      const link = (a: number, b: number) => {
        adj.set(a, [...(adj.get(a) ?? []), b]);
        adj.set(b, [...(adj.get(b) ?? []), a]);
      };
      floors.forEach((L, f) => {
        for (const d of L.doors) {
          const [a, b] = d.rooms;
          if (b >= 0) link(f * FLOOR_KEY + a, f * FLOOR_KEY + b);
        }
        // Cầu thang: phòng trung tâm tầng dưới ↔ phòng trung tâm tầng trên
        if (f > 0) link((f - 1) * FLOOR_KEY + floors[f - 1].hub, f * FLOOR_KEY + L.hub);
      });
      gallery.forEach((_, k) => {
        if (roomOf[k] < 0) link(VIRTUAL_KEY + k, hostOf[k]);
      });
      const found: number[] = [];
      const seen = new Set([start]);
      const queue = [start];
      while (queue.length) {
        const r = queue.shift()!;
        for (const n of adj.get(r) ?? []) {
          if (seen.has(n)) continue;
          seen.add(n);
          const photos = gallery.map((_, k) => k).filter((k) => nodeOf(k) === n && k !== gi);
          if (photos.length) found.push(...photos);
          else queue.push(n); // phòng không có ảnh → đi xuyên qua để tìm tiếp
        }
      }
      return found;
    },
    [gallery, floors, roomOf, hostOf],
  );

  // Ảnh mở đầu: ảnh được bấm, không thì ảnh phòng trung tâm của tầng đang xem → ảnh bất kỳ trên tầng đó
  const [index, setIndex] = useState(() => {
    if (startIndex !== undefined) return startIndex;
    const f = startFloor;
    const hubPhoto = roomOf.findIndex((r) => r === f * FLOOR_KEY + floors[f].hub);
    const floorPhoto = roomOf.findIndex((r) => r >= 0 && Math.floor(r / FLOOR_KEY) === f);
    const anyPhoto = roomOf.findIndex((r) => r >= 0);
    return hubPhoto >= 0 ? hubPhoto : floorPhoto >= 0 ? floorPhoto : Math.max(0, anyPhoto);
  });
  // Tầng đang hiện trên bản đồ nhỏ — theo ảnh hiện tại, có thể chuyển tay để xem tầng khác
  const hereKey = roomOf[index];
  const floorOfPhoto = Math.floor(hostOf[index] / FLOOR_KEY); // ảnh không có phòng → tầng của phòng chủ
  const [mapFloor, setMapFloor] = useState(floorOfPhoto);
  useEffect(() => {
    setMapFloor(floorOfPhoto);
  }, [floorOfPhoto]);
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);
  const [hint, setHint] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const item = gallery[index];
  const neighbors = useMemo(() => neighborsOf(index), [neighborsOf, index]);

  const mountRef = useRef<HTMLDivElement>(null);
  const joyRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const zoomRef = useRef<HTMLSpanElement>(null); // vạch mức bước tới — cập nhật trực tiếp mỗi khung hình
  const st = useRef({
    pos: new THREE.Vector3(), // độ nhích thị sai của camera so với điểm chụp (m)
    zoom: 1, // bước tới = độ phóng (1 = trọn ảnh)
    tZoom: 1,
    yaw: 0,
    pitch: 0,
    tYaw: 0,
    tPitch: 0,
    mouse: new THREE.Vector2(), // vị trí chuột chuẩn hoá — thị sai nhẹ khi rê
    mouseAt: 0, // lần rê chuột gần nhất — đứng yên thì camera về đúng điểm chụp (ảnh nét tuyệt đối)
    keys: new Set<string>(),
    joy: new THREE.Vector2(),
    interacted: false,
    room: null as RoomMesh | null,
    fade: 0, // độ hiện của phòng (0 → 1)
  });
  const ctxRef = useRef<{ scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer } | null>(null);
  const touched = useCallback(() => {
    st.current.interacted = true;
    setHint(false);
  }, []);

  // ---- Renderer + vòng lặp ----
  useEffect(() => {
    const mount = mountRef.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#14100d');
    const camera = new THREE.PerspectiveCamera(PHOTO_VFOV, 1, 0.05, 60);
    camera.rotation.order = 'YXZ';
    ctxRef.current = { scene, camera, renderer };

    const resize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix(); // góc nhìn được tính lại mỗi khung hình theo ảnh hiện tại
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = st.current;
      const room = s.room;
      if (!room) {
        renderer.render(scene, camera);
        return;
      }
      // ---- Bàn phím / cần điều khiển: W–S / ↑↓ bước tới–lùi, A–D / ←→ quay nhìn ----
      const k = s.keys;
      let f = -s.joy.y;
      let turn = -s.joy.x;
      if (k.has('w') || k.has('arrowup')) f += 1;
      if (k.has('s') || k.has('arrowdown')) f -= 1;
      if (k.has('a') || k.has('arrowleft')) turn += 1;
      if (k.has('d') || k.has('arrowright')) turn -= 1;
      s.tZoom *= Math.exp(f * 0.9 * dt);
      s.tYaw += turn * 0.5 * dt;
      // Chưa thao tác: tiến gần một chút và đảo nhìn chậm sang hai bên (chỉ quay → ảnh không biến dạng)
      if (!s.interacted && s.fade > 0.9) {
        s.tZoom = 1.18;
        s.tYaw = Math.sin(now / 5200) * 1e3; // bị giới hạn ngay bên dưới → lướt từ mép này sang mép kia
      }
      s.tZoom = THREE.MathUtils.clamp(s.tZoom, 1, ZOOM_MAX);

      const kk = 1 - Math.pow(0.004, dt);
      s.zoom += (s.tZoom - s.zoom) * kk;
      if (zoomRef.current) zoomRef.current.style.transform = `scaleY(${(s.zoom - 1) / (ZOOM_MAX - 1)})`;

      // ---- Góc nhìn ----
      // Vừa khít trong ảnh theo tỉ lệ màn hình (màn rộng hơn ảnh → cắt bớt trên/dưới), thu hẹp khi bước tới
      const tanCamV = Math.min(room.tanV * COVER, (room.tanH * COVER) / camera.aspect) / s.zoom;
      const fov = THREE.MathUtils.radToDeg(2 * Math.atan(tanCamV));
      if (Math.abs(fov - camera.fov) > 1e-4) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      const tanCamH = tanCamV * camera.aspect;
      const padH = tanCamH * EDGE_PAD;
      const padV = tanCamV * EDGE_PAD;

      // ---- Thị sai theo chuột ----
      // Nhích x (m) làm vật gần và xa lệch nhau fpx·x·invRange điểm ảnh → giới hạn trong PARALLAX_PX để
      // mép vật chỉ giãn vài px (không thấy vệt). Thôi rê chuột → về đúng điểm chụp.
      const fpx = renderer.domElement.clientHeight / (2 * tanCamV);
      const reachM = room.invRange > 0 ? PARALLAX_PX / 2 / (fpx * room.invRange) : 0;
      const live = now - s.mouseAt < 1800;
      const target = new THREE.Vector3(live ? s.mouse.x * reachM : 0, live ? -s.mouse.y * reachM * 0.6 : 0, 0);
      s.pos.lerp(target, 1 - Math.pow(0.02, dt));
      const cam = s.pos.clone();
      fitBorder(room, cam, padH, padV);
      camera.position.copy(cam);

      // Phần ảnh còn dư quanh khung nhìn tại vị trí hiện tại → biên độ quay nhìn mỗi phía
      const reach = borderReach(room, cam);
      const yawL = Math.max(0, Math.atan(reach.l) - Math.atan(padH));
      const yawR = Math.max(0, Math.atan(reach.r) - Math.atan(padH));
      const pitchU = Math.max(0, Math.atan(reach.t) - Math.atan(padV));
      const pitchD = Math.max(0, Math.atan(reach.b) - Math.atan(padV));
      s.tYaw = THREE.MathUtils.clamp(s.tYaw, -yawR, yawL);
      s.tPitch = THREE.MathUtils.clamp(s.tPitch, -pitchD, pitchU);
      s.yaw += (s.tYaw - s.yaw) * kk;
      s.pitch += (s.tPitch - s.pitch) * kk;
      camera.rotation.set(THREE.MathUtils.clamp(s.pitch, -pitchD, pitchU), THREE.MathUtils.clamp(s.yaw, -yawR, yawL), 0);

      s.fade += ((fadingRef.current ? 0 : 1) - s.fade) * Math.min(1, dt * 5);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (st.current.room) disposeRoom(st.current.room);
      st.current.room = null;
      renderer.dispose();
      renderer.domElement.remove();
      ctxRef.current = null;
    };
  }, []);

  const fadingRef = useRef(false);
  fadingRef.current = fading;

  // ---- Tải / dựng phòng khi đổi ảnh ----
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const anisotropy = ctxRef.current?.renderer.capabilities.getMaxAnisotropy() ?? 8;
    buildRoom(item, anisotropy).then((room) => {
      const ctx = ctxRef.current;
      if (!alive || !ctx) {
        disposeRoom(room);
        return;
      }
      const s = st.current;
      if (s.room) {
        ctx.scene.remove(s.room.mesh);
        disposeRoom(s.room);
      }
      ctx.scene.add(room.mesh);
      s.room = room;
      s.fade = 0;
      // Vào phòng: từ trọn ảnh, tiến gần nhẹ
      s.pos.set(0, 0, 0);
      s.zoom = 1;
      s.tZoom = s.interacted ? 1.08 : 1;
      s.yaw = s.tYaw = 0;
      s.pitch = s.tPitch = 0;
      setLoading(false);
      setFading(false);
    });
    return () => {
      alive = false;
    };
  }, [item]);

  // Tải trước ảnh các phòng kế bên (chuyển phòng nhanh hơn)
  useEffect(() => {
    for (const k of neighbors) {
      const g = gallery[k];
      for (const src of [g.image, g.photo3d?.depth]) if (src) loadImage(src).catch(() => undefined);
    }
  }, [neighbors, gallery]);

  // ---- Chuyển phòng: bước tới + mờ dần rồi vào phòng mới ----
  const goTo = useCallback(
    (k: number) => {
      if (k === index) return;
      touched();
      const s = st.current;
      s.tZoom = ZOOM_MAX; // bước tới trước khi sang phòng
      setFading(true);
      window.setTimeout(() => setIndex(k), 420);
    },
    [index, touched],
  );

  // ---- Chuột / chạm: kéo để nhìn, rê để thị sai, cuộn để bước tới, bấm để đi tới điểm ----
  useEffect(() => {
    const el = mountRef.current!;
    let drag: { id: number; x: number; y: number; moved: number } | null = null;
    const down = (e: PointerEvent) => {
      if (drag) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
      el.setPointerCapture(e.pointerId);
      touched();
    };
    const move = (e: PointerEvent) => {
      const s = st.current;
      const rect = el.getBoundingClientRect();
      if (e.pointerType === 'mouse') {
        s.mouse.set(((e.clientX - rect.left) / rect.width) * 2 - 1, ((e.clientY - rect.top) / rect.height) * 2 - 1);
        s.mouseAt = performance.now();
      }
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      drag.x = e.clientX;
      drag.y = e.clientY;
      // Kéo ảnh theo tay: lượng quay tỉ lệ với góc nhìn hiện tại (bước tới càng gần thì quay càng chậm)
      const cam = ctxRef.current?.camera;
      const perPx = cam ? THREE.MathUtils.degToRad(cam.fov) / rect.height : 0.0025;
      s.tYaw += dx * perPx;
      s.tPitch += dy * perPx;
    };
    const up = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return;
      const tap = drag.moved < 6;
      drag = null;
      const cam = ctxRef.current?.camera;
      if (!tap || !cam) return;
      // Bấm vào một điểm: quay về phía điểm đó và bước tới
      const rect = el.getBoundingClientRect();
      const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const s = st.current;
      s.tYaw -= Math.atan(nx * tanV * cam.aspect);
      s.tPitch += Math.atan(ny * tanV);
      s.tZoom *= 1.35;
    };
    const leave = () => st.current.mouse.set(0, 0);
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      touched();
      st.current.tZoom *= Math.exp(-e.deltaY * 0.0015);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('wheel', wheel);
    };
  }, [touched]);

  // ---- Bàn phím ----
  useEffect(() => {
    const keys = st.current.keys;
    const MOVE = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
    const dn = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'escape') return onClose();
      if (k === 'm') return setShowMap((v) => !v);
      if (k === 'pagedown') return goTo((index + 1) % gallery.length);
      if (k === 'pageup') return goTo((index - 1 + gallery.length) % gallery.length);
      if (MOVE.includes(k)) {
        keys.add(k);
        e.preventDefault();
        touched();
      }
    };
    const upk = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const blur = () => keys.clear();
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', upk);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup', upk);
      window.removeEventListener('blur', blur);
    };
  }, [onClose, touched, goTo, index, gallery.length]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ---- Cần điều khiển ảo (điện thoại) ----
  const joyMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const base = joyRef.current!.getBoundingClientRect();
    const r = base.width / 2;
    let x = (e.clientX - (base.left + r)) / r;
    let y = (e.clientY - (base.top + r)) / r;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    st.current.joy.set(x, y);
    if (knobRef.current) knobRef.current.style.transform = `translate(${x * r * 0.6}px, ${y * r * 0.6}px)`;
  };
  const joyEnd = () => {
    st.current.joy.set(0, 0);
    if (knobRef.current) knobRef.current.style.transform = '';
  };

  const layout = floors[mapFloor];
  const plan = layout.plan;
  const base = mapFloor * FLOOR_KEY;
  const here = hereKey >= 0 && Math.floor(hereKey / FLOOR_KEY) === mapFloor ? hereKey - base : -1;
  const s = st.current;

  return createPortal(
    <div className="hw3d" role="dialog" aria-modal="true" aria-label={`Tham quan 3D ${projectName} — ${item.room}`}>
      <div ref={mountRef} className="hw3d-stage" />
      <div className={`hw3d-fade${fading || loading ? ' on' : ''}`} aria-hidden="true" />
      {loading && <div className="hw3d-loading">Đang dựng không gian 3D…</div>}

      <header className="hw3d-top">
        <div className="hw3d-title">
          <span className="hw3d-eyebrow">
            <Footprints size={14} aria-hidden="true" /> Không gian 3D · {projectName}
          </span>
          <h2>{item.room}</h2>
        </div>
        <div className="hw3d-bar is-top">
          <span className="hw3d-count" aria-label={`Ảnh ${index + 1} trên ${gallery.length}`}>
            <b>{String(index + 1).padStart(2, '0')}</b>
            <span aria-hidden="true">/</span>
            {String(gallery.length).padStart(2, '0')}
          </span>
          <span className="hw3d-sep" aria-hidden="true" />
          <button
            type="button"
            className="hw3d-ico"
            onClick={() => setShowMap((v) => !v)}
            aria-pressed={showMap}
            aria-label="Bản đồ mặt bằng"
            data-tip={showMap ? 'Ẩn bản đồ (M)' : 'Hiện bản đồ (M)'}
          >
            <MapIcon size={17} strokeWidth={1.5} />
          </button>
          <button type="button" className="hw3d-ico is-close" onClick={onClose} aria-label="Đóng" data-tip="Đóng (Esc)">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {showMap && (
        <figure className="hw3d-map" aria-label="Bản đồ mặt bằng — bấm phòng có ảnh để chuyển tới">
          {floors.length > 1 && (
            <div className="hw3d-floors" role="tablist" aria-label="Chọn tầng">
              {floors.map((L, f) => (
                <button
                  key={L.plan.id}
                  type="button"
                  role="tab"
                  aria-selected={f === mapFloor}
                  className={`hw3d-floor${f === mapFloor ? ' active' : ''}`}
                  onClick={() => setMapFloor(f)}
                >
                  {L.plan.name}
                  {hereKey >= 0 && Math.floor(hereKey / FLOOR_KEY) === f && <i title="Bạn đang ở tầng này" />}
                </button>
              ))}
            </div>
          )}
          <svg viewBox={`-0.3 -0.3 ${plan.width + 0.6} ${plan.depth + 0.6}`}>
            {plan.rooms.map((r, i) => {
              const photo = roomOf.findIndex((key) => key === base + i);
              return (
                <g
                  key={`${r.label}-${i}`}
                  className={`hw3d-map-room k-${r.kind}${i === here ? ' here' : ''}${photo < 0 ? ' no-photo' : ''}`}
                  onClick={() => photo >= 0 && goTo(photo)}
                >
                  <rect x={r.x} y={r.y} width={r.w} height={r.h} />
                  <text x={r.x + r.w / 2} y={r.y + r.h / 2}>
                    {r.label}
                  </text>
                </g>
              );
            })}
            {layout.doors.map((d, i) => (
              <line
                key={i}
                className={`hw3d-map-door${d.type === 'entry' ? ' entry' : ''}`}
                x1={d.seg.axis === 'v' ? d.seg.c : d.seg.s}
                y1={d.seg.axis === 'v' ? d.seg.s : d.seg.c}
                x2={d.seg.axis === 'v' ? d.seg.c : d.seg.e}
                y2={d.seg.axis === 'v' ? d.seg.e : d.seg.c}
              />
            ))}
            {here >= 0 && (
              <circle
                className="hw3d-map-here"
                cx={plan.rooms[here].x + plan.rooms[here].w / 2}
                cy={plan.rooms[here].y + plan.rooms[here].h / 2 + 0.7}
                r={0.32}
              />
            )}
          </svg>
          <figcaption>
            {plan.code} · {plan.name}
          </figcaption>
        </figure>
      )}

      <div className="hw3d-bar hw3d-tools" role="group" aria-label="Điều khiển">
        <button type="button" className="hw3d-ico" onClick={() => (touched(), (s.tZoom *= 1.25))} aria-label="Bước tới" data-tip="Bước tới (W)">
          <Plus size={17} strokeWidth={1.5} />
        </button>
        <span className="hw3d-zoom" aria-hidden="true">
          <span ref={zoomRef} />
        </span>
        <button type="button" className="hw3d-ico" onClick={() => (touched(), (s.tZoom /= 1.25))} aria-label="Lùi lại" data-tip="Lùi lại (S)">
          <Minus size={17} strokeWidth={1.5} />
        </button>
        <span className="hw3d-sep" aria-hidden="true" />
        <button
          type="button"
          className="hw3d-ico"
          onClick={() => {
            touched();
            s.tZoom = 1;
            s.tYaw = s.tPitch = 0;
          }}
          aria-label="Về điểm nhìn ban đầu"
          data-tip="Về điểm nhìn ban đầu"
        >
          <RotateCcw size={16} strokeWidth={1.5} />
        </button>
      </div>

      {hint && (
        <p className="hw3d-hint" aria-hidden="true">
          Kéo để nhìn quanh · Cuộn chuột hoặc W–S để bước tới · Bấm vào một điểm để tiến lại gần · Chọn cửa bên dưới để sang phòng khác
        </p>
      )}

      <footer className="hw3d-bottom">
        {neighbors.length > 0 && (
          <nav className="hw3d-doors" aria-label="Đi tới phòng kế bên">
            <span className="hw3d-doors-label" aria-hidden="true">
              <DoorOpen size={14} strokeWidth={1.5} />
              Phòng kế bên
            </span>
            {neighbors.map((k) => (
              <button key={k} type="button" className="hw3d-door" onClick={() => goTo(k)} aria-label={`Đi tới ${gallery[k].room}`}>
                <img src={gallery[k].image} alt="" loading="lazy" />
                <span className="hw3d-door-text">
                  <small>Đi tới</small>
                  <b>{gallery[k].room}</b>
                </span>
                <span className="hw3d-door-go" aria-hidden="true">
                  <ArrowRight size={14} strokeWidth={1.5} />
                </span>
              </button>
            ))}
          </nav>
        )}
        <div className="hw3d-strip">
          {gallery.map((g, k) => (
            <button
              key={g.room + k}
              type="button"
              className={`hw3d-thumb${k === index ? ' active' : ''}`}
              onClick={() => goTo(k)}
              aria-label={g.room}
              aria-current={k === index}
            >
              <img src={g.image} alt="" loading="lazy" />
              <span>{g.room}</span>
            </button>
          ))}
        </div>
      </footer>

      <div
        ref={joyRef}
        className="hw3d-joy"
        aria-hidden="true"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          joyMove(e);
          touched();
        }}
        onPointerMove={(e) => e.buttons && joyMove(e)}
        onPointerUp={joyEnd}
        onPointerCancel={joyEnd}
      >
        <span ref={knobRef} />
      </div>
    </div>,
    document.body,
  );
}
