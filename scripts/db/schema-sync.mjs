// Đồng bộ supabase/schema.sql lên database Supabase — khỏi phải dán tay vào SQL Editor.
//
//   npm run db:push           áp schema.sql (bỏ qua nếu file không đổi từ lần áp trước)
//   npm run db:push -- --force  áp lại kể cả khi không đổi
//   npm run db:watch          theo dõi supabase/schema.sql, lưu file là tự áp
//   npm run db:seed -- --yes  nạp supabase/seed.sql (GHI ĐÈ dự án / bài mẫu theo id — không tự chạy)
//   npm run dev               cũng tự áp schema.sql khi khởi động và mỗi lần lưu file (plugin trong vite.config.ts)
//
// Cần SUPABASE_DB_URL trong .env (chuỗi kết nối Postgres, có mật khẩu database — KHÔNG thêm tiền tố VITE_,
// để không bị đóng gói vào website). Lấy ở Supabase › Project Settings › Database › Connection string ›
// "Session pooler" (chạy được trên mạng không có IPv6):
//   SUPABASE_DB_URL=postgresql://postgres.<ref>:<mật-khẩu>@aws-0-<vùng>.pooler.supabase.com:5432/postgres
//
// Cả file chạy trong MỘT giao dịch: lỗi ở câu nào thì không thay đổi gì, báo đúng dòng lỗi trong file.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, watch, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const SCHEMA_FILE = path.join(ROOT, 'supabase/schema.sql');
const SEED_FILE = path.join(ROOT, 'supabase/seed.sql');
const HASH_FILE = path.join(ROOT, '.cache/supabase-schema.sha1');

/** Đọc SUPABASE_DB_URL từ biến môi trường hoặc file .env / .env.local. */
export function readDbUrl(env = process.env) {
  if (env.SUPABASE_DB_URL) return env.SUPABASE_DB_URL.trim();
  for (const name of ['.env.local', '.env']) {
    const file = path.join(ROOT, name);
    if (!existsSync(file)) continue;
    const m = readFileSync(file, 'utf8').match(/^\s*SUPABASE_DB_URL\s*=\s*(.+?)\s*$/m);
    if (m) return m[1].replace(/^["']|["']$/g, '');
  }
  return null;
}

const sha1 = (s) => createHash('sha1').update(s).digest('hex');
const lastHash = () => (existsSync(HASH_FILE) ? readFileSync(HASH_FILE, 'utf8').trim() : null);
function saveHash(h) {
  mkdirSync(path.dirname(HASH_FILE), { recursive: true });
  writeFileSync(HASH_FILE, h);
}

/** Che mật khẩu khi in chuỗi kết nối. */
export const maskUrl = (url) => url.replace(/:\/\/([^:/@]+):[^@]*@/, '://$1:•••@');

/** Vị trí lỗi Postgres (ký tự thứ n) → "dòng X, cột Y" + đoạn mã quanh đó. */
function locate(sql, position) {
  const before = sql.slice(0, Math.max(0, position - 1));
  const line = before.split('\n').length;
  const col = before.length - before.lastIndexOf('\n');
  const lines = sql.split('\n');
  const snippet = lines
    .slice(Math.max(0, line - 3), line + 1)
    .map((l, i) => {
      const n = Math.max(0, line - 3) + i + 1;
      return `${n === line ? '>' : ' '} ${String(n).padStart(4)} | ${l.replace(/\r$/, '')}`;
    })
    .join('\n');
  return { line, col, snippet };
}

/** Lỗi đã định dạng sẵn để in ra terminal. */
export class SqlError extends Error {}

/**
 * Chạy một file SQL trong một giao dịch.
 * `client` chỉ cần có `query(text)` (pg.Client). Trả về thời gian chạy (ms).
 */
export async function runSqlFile(client, file) {
  const sql = readFileSync(file, 'utf8');
  const started = Date.now();
  await client.query('begin');
  try {
    await client.query(sql);
    await client.query('commit');
  } catch (e) {
    await client.query('rollback').catch(() => undefined);
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (e && e.position) {
      const { line, col, snippet } = locate(sql, Number(e.position));
      throw new SqlError(`${rel}:${line}:${col} — ${e.message}\n${snippet}\n(Không có thay đổi nào được áp — đã huỷ toàn bộ.)`);
    }
    throw new SqlError(`${rel} — ${e?.message ?? e}${e?.where ? `\n  tại: ${e.where}` : ''}\n(Không có thay đổi nào được áp — đã huỷ toàn bộ.)`);
  }
  return Date.now() - started;
}

async function connect(dbUrl) {
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: /localhost|127\.0\.0\.1/.test(dbUrl) ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    statement_timeout: 120000,
  });
  try {
    await client.connect();
  } catch (e) {
    const hint =
      e.code === 'ENOTFOUND' || e.code === 'ENETUNREACH' || e.code === 'EHOSTUNREACH'
        ? 'Không tới được máy chủ. Nếu đang dùng "Direct connection" (db.<ref>.supabase.co, chỉ có IPv6), hãy đổi sang chuỗi "Session pooler".'
        : /password|authentication/i.test(e.message)
          ? 'Sai mật khẩu database. Đặt lại ở Supabase › Project Settings › Database › Reset database password.'
          : '';
    throw new SqlError(`Không kết nối được database (${maskUrl(dbUrl)}): ${e.message}${hint ? `\n  → ${hint}` : ''}`);
  }
  return client;
}

/**
 * Áp schema.sql. Bỏ qua nếu nội dung giống lần áp thành công trước (trừ khi force).
 * Trả về { applied, ms } — ném SqlError khi lỗi.
 */
export async function pushSchema({ dbUrl = readDbUrl(), force = false, log = console.log } = {}) {
  if (!dbUrl) throw new SqlError('Chưa có SUPABASE_DB_URL trong .env — xem hướng dẫn ở đầu file scripts/db/schema-sync.mjs.');
  const hash = sha1(readFileSync(SCHEMA_FILE, 'utf8'));
  if (!force && hash === lastHash()) {
    log('supabase/schema.sql không đổi từ lần áp trước — bỏ qua (thêm --force để áp lại).');
    return { applied: false, ms: 0 };
  }
  const client = await connect(dbUrl);
  try {
    const ms = await runSqlFile(client, SCHEMA_FILE);
    saveHash(hash);
    return { applied: true, ms };
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function pushSeed({ dbUrl = readDbUrl() } = {}) {
  if (!dbUrl) throw new SqlError('Chưa có SUPABASE_DB_URL trong .env.');
  const client = await connect(dbUrl);
  try {
    return await runSqlFile(client, SEED_FILE);
  } finally {
    await client.end().catch(() => undefined);
  }
}

const printError = (e) => console.error(e instanceof SqlError ? `✗ ${e.message}` : e);

/** Theo dõi schema.sql, lưu là áp (gộp các lần lưu liên tiếp, không chạy chồng). */
export function watchSchema({ dbUrl = readDbUrl(), log = console.log, error = printError, onApplied } = {}) {
  let timer = null;
  let running = false;
  let again = false;
  const run = async () => {
    if (running) {
      again = true;
      return;
    }
    running = true;
    try {
      const { applied, ms } = await pushSchema({ dbUrl, log });
      if (applied) {
        log(`✓ Đã cập nhật Supabase từ supabase/schema.sql (${ms} ms)`);
        onApplied?.();
      }
    } catch (e) {
      error(e);
    } finally {
      running = false;
      if (again) {
        again = false;
        run();
      }
    }
  };
  const watcher = watch(path.dirname(SCHEMA_FILE), (_, name) => {
    if (name && path.basename(String(name)) !== path.basename(SCHEMA_FILE)) return;
    clearTimeout(timer);
    timer = setTimeout(run, 300);
  });
  run(); // áp ngay nếu file đã đổi khi chưa theo dõi
  return () => {
    clearTimeout(timer);
    watcher.close();
  };
}

// ---------- Chạy trực tiếp: node scripts/db/schema-sync.mjs [push|watch|seed] ----------

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd = 'push', ...flags] = process.argv.slice(2);
  const fail = (e) => {
    printError(e);
    process.exit(1);
  };
  const dbUrl = readDbUrl();
  if (dbUrl) console.log(`Database: ${maskUrl(dbUrl)}`);
  if (cmd === 'push') {
    pushSchema({ dbUrl, force: flags.includes('--force') })
      .then(({ applied, ms }) => applied && console.log(`✓ Đã cập nhật Supabase từ supabase/schema.sql (${ms} ms)`))
      .catch(fail);
  } else if (cmd === 'watch') {
    if (!dbUrl) fail(new SqlError('Chưa có SUPABASE_DB_URL trong .env.'));
    console.log('Đang theo dõi supabase/schema.sql — lưu file là tự cập nhật Supabase. Ctrl+C để dừng.');
    watchSchema({ dbUrl });
  } else if (cmd === 'seed') {
    if (!flags.includes('--yes')) {
      console.log(
        'seed.sql GHI ĐÈ các dự án / bài viết / vị trí mẫu theo id (kể cả những gì đã sửa ở trang quản trị) và dựng lại mặt bằng mặc định.\n' +
          'Chắc chắn thì chạy: npm run db:seed -- --yes',
      );
      process.exit(1);
    }
    pushSeed({ dbUrl })
      .then((ms) => console.log(`✓ Đã nạp supabase/seed.sql (${ms} ms)`))
      .catch(fail);
  } else {
    fail(new SqlError(`Lệnh không hợp lệ: ${cmd} (push | watch | seed)`));
  }
}
