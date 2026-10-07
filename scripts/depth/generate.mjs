// Dựng dữ liệu 3D cho ảnh "Không gian sống" (dùng bởi src/components/house/PhotoTour3D.tsx):
//   1. Bản đồ độ sâu bằng Depth Anything V2 (Base, fp16; thiếu thì dùng bản Small).
//   2. Tách mép vật: chỗ độ sâu đổi đột ngột (rèm ↔ cửa kính, sofa ↔ sàn…).
//   3. Lớp nền phía sau: dải phía sau mỗi mép vật được vẽ bù màu (push-pull inpainting từ vùng nền
//      xung quanh) + độ sâu nền → khi người xem nhích tới / sang ngang, chỗ lộ ra là nền hợp lý thay
//      vì ảnh bị kéo giãn thành vệt.
//   4. Giới hạn di chuyển an toàn của từng ảnh (để phần lộ ra không vượt quá dải nền đã vẽ bù).
//
// Chạy: node scripts/depth/generate.mjs
// Mô hình đọc từ .cache/models/onnx-community/depth-anything-v2-{base,small} (tải bằng curl từ
// huggingface.co/onnx-community/…: config.json, preprocessor_config.json, onnx/model_fp16.onnx | onnx/model.onnx).
// Kết quả:
//   src/assets/depth/<khoá>.depth.png    độ sâu lớp trước (xám 8 bit, sáng = gần)
//   src/assets/depth/<khoá>.bg.webp      màu lớp nền (alpha = vùng nền vẽ bù)
//   src/assets/depth/<khoá>.bgdepth.png  độ sâu lớp nền
//   src/data/photo3d.ts                  bảng tra (import ảnh + giới hạn di chuyển)
import { env, pipeline, RawImage } from '@huggingface/transformers';
import sharp from 'sharp';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, parse } from 'node:path';

env.localModelPath = '.cache/models/';
env.allowRemoteModels = false;

// Phải khớp với PhotoTour3D.tsx
const NEAR_M = 1.1;
const FAR_M = 10;
const PHOTO_VFOV = 50;

const SOURCES = ['src/assets/house-1', 'src/assets/house-2'];
const OUT = 'src/assets/depth';
const W = 1024; // độ phân giải xử lý / xuất
const EDGE_T = 0.08; // chênh lệch nghịch-độ-sâu (1/m) qua 2 px để coi là mép vật
const BAND = 0.1; // bề rộng dải nền vẽ bù phía sau mép vật (tỉ lệ bề ngang ảnh)
const SAFE = 0.5; // phần lộ ra tối đa / bề rộng dải nền (nhỏ hơn → vùng vẽ bù chỉ hé ra một chút)
mkdirSync(OUT, { recursive: true });

const base = existsSync('.cache/models/onnx-community/depth-anything-v2-base/onnx/model_fp16.onnx');
const depthModel = await pipeline(
  'depth-estimation',
  base ? 'onnx-community/depth-anything-v2-base' : 'onnx-community/depth-anything-v2-small',
  { dtype: base ? 'fp16' : 'fp32' },
);
console.log('Mô hình:', base ? 'Depth Anything V2 Base (fp16)' : 'Depth Anything V2 Small');

const toZ = (d) => 1 / (d * (1 / NEAR_M - 1 / FAR_M) + 1 / FAR_M);
const toD = (z) => (1 / z - 1 / FAR_M) / (1 / NEAR_M - 1 / FAR_M);

/** Lấy mẫu song tuyến mảng float (w0×h0) sang (w×h). */
function resizeFloat(src, w0, h0, w, h) {
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = ((y + 0.5) * h0) / h - 0.5;
    const y0 = Math.max(0, Math.floor(fy));
    const y1 = Math.min(h0 - 1, y0 + 1);
    const ty = Math.min(1, Math.max(0, fy - y0));
    for (let x = 0; x < w; x++) {
      const fx = ((x + 0.5) * w0) / w - 0.5;
      const x0 = Math.max(0, Math.floor(fx));
      const x1 = Math.min(w0 - 1, x0 + 1);
      const tx = Math.min(1, Math.max(0, fx - x0));
      out[y * w + x] =
        (src[y0 * w0 + x0] * (1 - tx) + src[y0 * w0 + x1] * tx) * (1 - ty) +
        (src[y1 * w0 + x0] * (1 - tx) + src[y1 * w0 + x1] * tx) * ty;
    }
  }
  return out;
}

/** Vẽ bù push-pull: điền các điểm chưa biết (known=0) bằng trung bình có trọng số từ tháp ảnh thô dần. */
function pushPull(rgb, known, w, h) {
  const levels = [{ w, h, c: Float32Array.from(rgb), k: Float32Array.from(known) }];
  while (levels[levels.length - 1].w > 1 || levels[levels.length - 1].h > 1) {
    const f = levels[levels.length - 1];
    const cw = Math.max(1, Math.ceil(f.w / 2));
    const ch = Math.max(1, Math.ceil(f.h / 2));
    const c = new Float32Array(cw * ch * 3);
    const k = new Float32Array(cw * ch);
    for (let y = 0; y < ch; y++)
      for (let x = 0; x < cw; x++) {
        let sw = 0;
        const acc = [0, 0, 0];
        for (let dy = 0; dy < 2; dy++)
          for (let dx = 0; dx < 2; dx++) {
            const fx = Math.min(f.w - 1, x * 2 + dx);
            const fy = Math.min(f.h - 1, y * 2 + dy);
            const wv = f.k[fy * f.w + fx];
            sw += wv;
            for (let ch3 = 0; ch3 < 3; ch3++) acc[ch3] += f.c[(fy * f.w + fx) * 3 + ch3] * wv;
          }
        const i = y * cw + x;
        k[i] = Math.min(1, sw);
        for (let ch3 = 0; ch3 < 3; ch3++) c[i * 3 + ch3] = sw > 0 ? acc[ch3] / sw : 0;
      }
    levels.push({ w: cw, h: ch, c, k });
  }
  for (let l = levels.length - 2; l >= 0; l--) {
    const f = levels[l];
    const g = levels[l + 1];
    for (let y = 0; y < f.h; y++)
      for (let x = 0; x < f.w; x++) {
        const i = y * f.w + x;
        const kv = f.k[i];
        if (kv >= 1) continue;
        // nội suy song tuyến từ tầng thô hơn
        const gx = Math.min(g.w - 1, Math.max(0, (x + 0.5) / 2 - 0.5));
        const gy = Math.min(g.h - 1, Math.max(0, (y + 0.5) / 2 - 0.5));
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const x1 = Math.min(g.w - 1, x0 + 1);
        const y1 = Math.min(g.h - 1, y0 + 1);
        const tx = gx - x0;
        const ty = gy - y0;
        for (let ch3 = 0; ch3 < 3; ch3++) {
          const v =
            (g.c[(y0 * g.w + x0) * 3 + ch3] * (1 - tx) + g.c[(y0 * g.w + x1) * 3 + ch3] * tx) * (1 - ty) +
            (g.c[(y1 * g.w + x0) * 3 + ch3] * (1 - tx) + g.c[(y1 * g.w + x1) * 3 + ch3] * tx) * ty;
          f.c[i * 3 + ch3] = f.c[i * 3 + ch3] * kv + v * (1 - kv);
        }
        f.k[i] = 1;
      }
  }
  return levels[0].c;
}

const entries = [];
for (const dir of SOURCES) {
  const folder = dir.split('/').pop();
  for (const file of readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f))) {
    const src = join(dir, file);
    const key = `${folder}-${parse(file).name}`;
    const t0 = Date.now();

    // ---- 1. Độ sâu ----
    const image = await RawImage.read(src);
    const { predicted_depth: pd } = await depthModel(image);
    const [ph, pw] = pd.dims.slice(-2);
    const sorted = Float32Array.from(pd.data).sort();
    const lo = sorted[Math.floor(sorted.length * 0.01)];
    const hi = sorted[Math.floor(sorted.length * 0.99)];
    const norm = new Float32Array(pw * ph);
    for (let i = 0; i < norm.length; i++) norm[i] = Math.min(1, Math.max(0, (pd.data[i] - lo) / (hi - lo)));
    const H = Math.round((W * image.height) / image.width);
    const d = resizeFloat(norm, pw, ph, W, H); // 0 xa … 1 gần
    const s = new Float32Array(W * H); // nghịch độ sâu (1/m)
    for (let i = 0; i < s.length; i++) s[i] = 1 / toZ(d[i]);

    // ---- 2. Mép vật: phía gần + nghịch độ sâu của nền ngay sau mép ----
    const farS = new Float32Array(W * H).fill(-1);
    const seeds = [];
    const farSide = new Uint8Array(W * H); // điểm phía cảnh xa ngay tại mép (phủ khe hở mảnh khi cắt lưới)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        for (const [dx, dy] of [
          [2, 0],
          [0, 2],
          [2, 2],
          [2, -2],
        ]) {
          const x2 = x + dx;
          const y2 = y + dy;
          if (x2 >= W || y2 < 0 || y2 >= H) continue;
          const j = y2 * W + x2;
          const diff = s[i] - s[j];
          if (Math.abs(diff) < EDGE_T) continue;
          const near = diff > 0 ? i : j;
          const far = diff > 0 ? j : i;
          farSide[far] = 1;
          if (farS[near] < 0 || s[far] < farS[near]) {
            if (farS[near] < 0) seeds.push(near);
            farS[near] = s[far];
          }
        }
      }

    // ---- 3. Dải nền phía sau mép vật (BFS lan vào phía vật gần) ----
    const R = Math.round(W * BAND);
    const dist = new Int32Array(W * H).fill(-1);
    const bgS = new Float32Array(W * H);
    let queue = seeds.slice();
    for (const i of queue) {
      dist[i] = 0;
      bgS[i] = farS[i];
    }
    for (let step = 0; queue.length && step < 2 * R; step++) {
      const next = [];
      for (const i of queue) {
        const x = i % W;
        const y = (i - x) / W;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const n = ny * W + nx;
          if (dist[n] >= 0) continue;
          if (s[n] < bgS[i] + EDGE_T * 0.5) continue; // đã sang phần nền → dừng lan
          dist[n] = dist[i] + 1;
          bgS[n] = bgS[i];
          next.push(n);
        }
      }
      queue = next;
    }
    // Nới phía cảnh xa của mép thêm FAR_PAD px → lớp nền phủ kín khe hở mảnh ở ngay đường cắt
    const FAR_PAD = 4;
    const farPad = new Uint8Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!farSide[y * W + x]) continue;
        for (let dy = -FAR_PAD; dy <= FAR_PAD; dy++)
          for (let dx = -FAR_PAD; dx <= FAR_PAD; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < W && ny < H && dist[ny * W + nx] < 0) farPad[ny * W + nx] = 1;
          }
      }
    const inBand = (i) => dist[i] >= 0 && dist[i] <= R;

    // ---- 4. Màu nền vẽ bù (chỉ lấy mẫu từ vùng nền, tránh dải 2R quanh vật) ----
    const { data: rgb } = await sharp(src).resize(W, H).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const known = new Float32Array(W * H);
    const rgbF = new Float32Array(W * H * 3);
    for (let i = 0; i < W * H; i++) {
      known[i] = dist[i] < 0 ? 1 : 0;
      rgbF[i * 3] = rgb[i * 3];
      rgbF[i * 3 + 1] = rgb[i * 3 + 1];
      rgbF[i * 3 + 2] = rgb[i * 3 + 2];
    }
    const filled = pushPull(rgbF, known, W, H);
    const bg = Buffer.alloc(W * H * 4);
    for (let i = 0; i < W * H; i++) {
      const band = inBand(i);
      bg[i * 4] = band ? filled[i * 3] : rgb[i * 3];
      bg[i * 4 + 1] = band ? filled[i * 3 + 1] : rgb[i * 3 + 1];
      bg[i * 4 + 2] = band ? filled[i * 3 + 2] : rgb[i * 3 + 2];
      bg[i * 4 + 3] = band || farPad[i] ? 255 : 0;
    }
    // Độ sâu nền: nền ngay sau mép, làm mượt nhẹ trong dải
    const bgD = Buffer.alloc(W * H);
    const bgSmooth = Float32Array.from(bgS);
    for (let pass = 0; pass < 2; pass++)
      for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          if (!inBand(i)) continue;
          let sum = 0;
          let cnt = 0;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const j = i + dy * W + dx;
              if (inBand(j)) {
                sum += bgSmooth[j];
                cnt++;
              }
            }
          bgSmooth[i] = sum / cnt;
        }
    for (let i = 0; i < W * H; i++) bgD[i] = Math.round(Math.min(1, Math.max(0, toD(1 / (inBand(i) ? bgSmooth[i] : s[i])))) * 255);

    // ---- 5. Giới hạn di chuyển an toàn ----
    const tanV = Math.tan(((PHOTO_VFOV / 2) * Math.PI) / 180);
    const f = H / (2 * tanV); // tiêu cự (px)
    const fwd = [];
    const lat = [];
    for (const i of seeds) {
      const ds = s[i] - farS[i];
      if (ds <= 0) continue;
      const x = i % W;
      const y = (i - x) / W;
      const r = Math.hypot(x - W / 2, y - H / 2);
      fwd.push((SAFE * R) / Math.max(1, r * ds));
      lat.push((SAFE * R) / (f * ds));
    }
    const pct = (arr, p) => (arr.length ? arr.sort((a, b) => a - b)[Math.floor(arr.length * p)] : 1);
    const forward = Math.min(1.2, Math.max(0.15, pct(fwd, 0.02)));
    const lateral = Math.min(0.35, Math.max(0.04, pct(lat, 0.02)));

    // ---- Ghi file ----
    const depthBuf = Buffer.alloc(W * H);
    for (let i = 0; i < W * H; i++) depthBuf[i] = Math.round(d[i] * 255);
    await sharp(depthBuf, { raw: { width: W, height: H, channels: 1 } }).png({ compressionLevel: 9 }).toFile(join(OUT, `${key}.depth.png`));
    await sharp(bgD, { raw: { width: W, height: H, channels: 1 } }).png({ compressionLevel: 9 }).toFile(join(OUT, `${key}.bgdepth.png`));
    await sharp(bg, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 82, alphaQuality: 60 }).toFile(join(OUT, `${key}.bg.webp`));
    entries.push({ key, forward, lateral });
    console.log(`${key}: mép=${seeds.length}, đi tới ≤ ${forward.toFixed(2)} m, sang ngang ≤ ${lateral.toFixed(2)} m (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
}

// ---- Bảng tra cho ứng dụng ----
const ident = (k) => k.replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[^a-zA-Z]/, '_');
let ts = `// TỰ SINH bởi scripts/depth/generate.mjs — không sửa tay.
// Dữ liệu dựng ảnh "Không gian sống" thành không gian 3D 2 lớp (PhotoTour3D.tsx).
import type { Photo3D } from '../types';
`;
for (const { key } of entries) {
  const id = ident(key);
  ts += `import ${id}Depth from '../assets/depth/${key}.depth.png';\nimport ${id}Bg from '../assets/depth/${key}.bg.webp';\nimport ${id}BgDepth from '../assets/depth/${key}.bgdepth.png';\n`;
}
ts += `\nexport const PHOTO_3D: Record<string, Photo3D> = {\n`;
for (const { key, forward, lateral } of entries) {
  const id = ident(key);
  ts += `  '${key}': { depth: ${id}Depth, bg: ${id}Bg, bgDepth: ${id}BgDepth, forward: ${forward.toFixed(2)}, lateral: ${lateral.toFixed(2)} },\n`;
}
ts += `};\n`;
writeFileSync('src/data/photo3d.ts', ts);
console.log('Đã ghi src/data/photo3d.ts');
