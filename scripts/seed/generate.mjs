// Sinh supabase/seed.sql từ dữ liệu mẫu đang dùng trên web (src/data/*), để database có sẵn nội dung
// giống hệt bản demo: 12 dự án, tin tức, tin tuyển dụng, mặt bằng theo loại hình.
//
// Chạy: node scripts/seed/generate.mjs   (rồi chạy supabase/seed.sql trong Supabase SQL Editor, sau schema.sql)
//
// Ghi chú:
// - Upsert theo id → chạy lại nhiều lần được, ghi đè nội dung mẫu nhưng không xoá dữ liệu admin đã thêm.
// - Ảnh (dự án, tin tức, không gian sống) là file đóng gói trong web nên không đưa vào database:
//   cột ảnh để trống → web tự dùng ảnh mẫu cùng id. Admin tải ảnh mới lên kho "media" để thay.
import { writeFileSync } from 'node:fs';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const load = (p) => vite.ssrLoadModule(p);
const { mockProjects } = await load('/src/data/mockProjects.ts');
const { mockNews } = await load('/src/data/mockNews.ts');
const { mockJobs } = await load('/src/data/mockJobs.ts');
const { getFloorPlans } = await load('/src/data/projectDetails.ts');
await vite.close();

// ---------- Viết giá trị SQL ----------
const str = (s) => `'${String(s).replace(/'/g, "''")}'`;
function lit(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (v instanceof Json) return `${str(JSON.stringify(v.value))}::jsonb`;
  if (v instanceof TextArray) return v.items.length ? `array[${v.items.map(str).join(', ')}]::text[]` : `'{}'::text[]`;
  return str(v);
}
class Json {
  constructor(value) {
    this.value = value;
  }
}
class TextArray {
  constructor(items) {
    this.items = items;
  }
}
const row = (values) => `  (${values.map(lit).join(', ')})`;

function upsert(table, cols, rows, conflict = 'id', identity = true) {
  const updates = cols.filter((c) => c !== conflict).map((c) => `${c} = excluded.${c}`);
  return `insert into public.${table} (${cols.join(', ')})${identity ? ' overriding system value' : ''}
values
${rows.map(row).join(',\n')}
on conflict (${conflict}) do update set
  ${updates.join(',\n  ')};
select setval(pg_get_serial_sequence('public.${table}', 'id'), (select max(id) from public.${table}));
`;
}

const out = [];
out.push(`-- TỰ SINH bởi scripts/seed/generate.mjs — không sửa tay. Chạy sau supabase/schema.sql.
-- Upsert theo id: chạy lại được, không xoá dữ liệu admin đã thêm.
begin;
`);

// ---------- Dự án ----------
out.push('-- Dự án');
out.push(
  upsert(
    'projects',
    ['id', 'name', 'type', 'location', 'status', 'price', 'interest_count', 'popularity', 'building_type', 'description', 'overview', 'sort_order', 'created_at'],
    mockProjects.map((p, i) => [
      Number(p.id),
      p.name,
      p.type,
      p.location,
      p.status,
      p.price,
      p.interest,
      p.popular,
      p.building,
      p.description ?? null,
      p.overview ? new Json(p.overview) : null,
      i,
      `${p.date}T00:00:00+07:00`,
    ]),
  ),
);

// ---------- Tin tức ----------
out.push('-- Tin tức (ảnh để trống → web dùng ảnh mẫu cùng id)');
out.push(
  upsert(
    'news',
    ['id', 'category', 'title', 'content', 'published_at', 'is_featured', 'is_published'],
    mockNews.map((n) => [n.id, n.category, n.title, new TextArray(n.content), n.date, Boolean(n.isNew), true]),
  ),
);

// ---------- Tuyển dụng ----------
out.push('-- Tuyển dụng');
out.push(
  upsert(
    'jobs',
    ['id', 'title', 'location', 'employment_type', 'summary', 'icon', 'is_open', 'sort_order'],
    mockJobs.map((j, i) => [j.id, j.title, j.location, j.employment, j.body, j.icon, true, i]),
  ),
);

// ---------- Mặt bằng mặc định theo loại hình ----------
out.push('-- Mặt bằng mặc định theo loại hình (thay toàn bộ mặt bằng con của bộ mặc định)');
for (const building of ['apartment', 'villa', 'land', 'shophouse']) {
  const set = getFloorPlans({ building });
  const setId = `(select id from public.floor_plan_sets where building_type = ${str(building)} and project_id is null)`;
  out.push(`insert into public.floor_plan_sets (building_type, title, intro)
values (${str(building)}, ${str(set.title)}, ${str(set.intro)})
on conflict (building_type) where project_id is null do update set title = excluded.title, intro = excluded.intro;
delete from public.floor_plans where set_id = ${setId};
insert into public.floor_plans (set_id, slug, name, code, area, bedrooms, bathrooms, note, width, depth, rooms, sort_order)
select ${setId}, v.slug, v.name, v.code, v.area::numeric, v.bedrooms::int, v.bathrooms::int, v.note,
  v.width::numeric, v.depth::numeric, v.rooms::jsonb, v.sort_order::int
from (values
${set.plans
  .map((p, i) =>
    row([p.id, p.name, p.code, p.area, p.bedrooms ?? null, p.bathrooms ?? null, p.note, p.width, p.depth, new Json(p.rooms), i]),
  )
  .join(',\n')}
) as v (slug, name, code, area, bedrooms, bathrooms, note, width, depth, rooms, sort_order);
`);
}

out.push('commit;\n');
writeFileSync('supabase/seed.sql', out.join('\n'));
console.log(
  `Đã ghi supabase/seed.sql: ${mockProjects.length} dự án, ${mockNews.length} tin, ${mockJobs.length} vị trí tuyển dụng, 4 bộ mặt bằng.`,
);
