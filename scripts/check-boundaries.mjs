// Kiểm tra ranh giới giữa website và trang quản trị — chạy tự động trước `npm run build` (prebuild),
// hoặc chạy tay: npm run check:boundaries
//
//   1. Code website (mọi thứ ngoài src/admin/) không được import API quản trị (src/api/admin/) hay mã trong src/admin/
//      → mã quản trị không bị đóng gói vào bundle website. Ngoại lệ duy nhất: App.tsx tải trang quản trị bằng
//      import() động (lazy), để mã quản trị nằm ở file riêng, chỉ tải khi vào /quan-tri.
//   2. Không biến VITE_* nào chứa khoá bí mật: mọi biến VITE_ đều bị đóng gói vào website, ai cũng đọc được.
//      Khoá service_role / mật khẩu database mà lộ ra thì vượt qua toàn bộ phân quyền (RLS).
//
// Phân quyền dữ liệu thật sự nằm ở database (RLS trong supabase/schema.sql); kiểm tra này giữ cho giao diện
// không để lộ mã / khoá không cần thiết.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const ADMIN_UI = path.join(SRC, 'admin') + path.sep;
const ADMIN_API = path.join(SRC, 'api', 'admin') + path.sep;
// import() động được phép: [file, đích]
const LAZY_ALLOWED = [[path.join(SRC, 'App.tsx'), path.join(SRC, 'admin', 'AdminApp')]];

const errors = [];
const rel = (p) => path.relative(ROOT, p).replaceAll('\\', '/');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx|js|jsx|mjs)$/.test(name) ? [p] : [];
  });
}

// ---------- 1. Ranh giới import ----------

const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

for (const file of walk(SRC)) {
  if (file.startsWith(ADMIN_UI) || file.startsWith(ADMIN_API)) continue; // mã quản trị dùng gì cũng được
  // bỏ chú thích (giữ nguyên số dòng) để không bắt nhầm ví dụ import trong comment
  const code = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
    .replace(/(^|\s)\/\/.*$/gm, '$1');
  for (const m of code.matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2] ?? m[3];
    if (!spec.startsWith('.')) continue;
    const target = path.resolve(path.dirname(file), spec).replace(/\.(ts|tsx|js|jsx)$/, '');
    const targetDir = target + path.sep;
    const intoAdminApi = targetDir.startsWith(ADMIN_API) || target === ADMIN_API.slice(0, -1);
    const intoAdminUi = targetDir.startsWith(ADMIN_UI) || target === ADMIN_UI.slice(0, -1);
    if (!intoAdminApi && !intoAdminUi) continue;
    const dynamic = m[3] !== undefined;
    if (dynamic && LAZY_ALLOWED.some(([f, t]) => f === file && t === target)) continue;
    const line = code.slice(0, m.index).split('\n').length;
    errors.push(
      `${rel(file)}:${line} import '${spec}' — website không được dùng ${intoAdminApi ? 'API quản trị (src/api/admin)' : 'mã trang quản trị (src/admin)'}.` +
        (intoAdminApi ? ' Dùng API công khai trong src/api/public/.' : ''),
    );
  }
}

// ---------- 2. Khoá bí mật trong biến VITE_* ----------

function jwtRole(value) {
  const part = value.split('.')[1];
  if (!part) return null;
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')).role ?? null;
  } catch {
    return null;
  }
}

for (const name of readdirSync(ROOT).filter((n) => /^\.env(\..+)?$/.test(n) && n !== '.env.example')) {
  const lines = readFileSync(path.join(ROOT, name), 'utf8').split(/\r?\n/);
  lines.forEach((raw, i) => {
    const m = raw.match(/^\s*(VITE_[A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) return;
    const [, key, value] = m;
    const v = value.replace(/^["']|["']$/g, '');
    if (/SERVICE_ROLE|SECRET|PASSWORD|DB_URL|PRIVATE/.test(key))
      errors.push(`${name}:${i + 1} ${key} — biến VITE_ bị đóng gói vào website; khoá bí mật không được có tiền tố VITE_.`);
    else if (jwtRole(v) === 'service_role')
      errors.push(`${name}:${i + 1} ${key} chứa khoá service_role — chỉ được dùng khoá "anon public" cho website.`);
    else if (/^postgres(ql)?:\/\//.test(v))
      errors.push(`${name}:${i + 1} ${key} chứa chuỗi kết nối database (có mật khẩu) — bỏ tiền tố VITE_.`);
  });
}

if (errors.length) {
  console.error(`\n✗ Kiểm tra ranh giới website / quản trị: ${errors.length} lỗi\n`);
  for (const e of errors) console.error('  ' + e);
  console.error('');
  process.exit(1);
}
console.log('✓ Ranh giới website / quản trị: không có lỗi.');
