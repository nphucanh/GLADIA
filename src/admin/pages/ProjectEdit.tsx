import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Box, ExternalLink, ImagePlus, LayoutTemplate, Save, Trash2 } from 'lucide-react';
import { admin, type ProjectInput } from '../../api/admin';
import type { FloorPlanSetRow, GalleryRow, ProjectRow } from '../../api/rows';
import type { ProjectOverview } from '../../types';
import { PROJECT_IMAGE_BY_BUILDING } from '../../data/images';
import { ADMIN_BASE } from '../AdminApp';
import { BUILDING_LABEL, BUILDING_OF_TYPE, BUILDING_TYPES, PROJECT_STATUSES, PROJECT_TYPES } from '../meta';
import PlanSetEditor from '../PlanSetEditor';
import { Badge, Empty, ErrorBox, Field, ImageField, Loading, PageHeader, Select, Switch, useAction, useAsync, useFeedback } from '../ui';
import { LocationInput } from '../LocationInput';

type Tab = 'info' | 'gallery' | 'plans';

const EMPTY_OVERVIEW: ProjectOverview = {
  developer: 'Tập đoàn Terra',
  scale: [],
  landArea: '',
  buildingDensity: '',
  ownership: '',
  amenities: '',
  handover: '',
};

const blankProject = (): ProjectInput => ({
  name: '',
  type: 'Căn hộ',
  location: '',
  status: 'Sắp mở bán',
  price: 0,
  building_type: 'apartment',
  popularity: 50,
  description: '',
  overview: { ...EMPTY_OVERVIEW },
  cover_image_url: null,
  is_published: true,
});

const toInput = (p: ProjectRow): ProjectInput => ({
  name: p.name,
  type: p.type,
  location: p.location,
  status: p.status,
  price: Number(p.price),
  building_type: p.building_type,
  popularity: p.popularity,
  description: p.description ?? '',
  overview: p.overview ?? { ...EMPTY_OVERVIEW },
  cover_image_url: p.cover_image_url,
  is_published: p.is_published,
});

export default function ProjectEdit() {
  const { id } = useParams();
  const isNew = !id;
  const projectId = Number(id);
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => (['gallery', 'plans'].includes(params.get('tab') ?? '') ? (params.get('tab') as Tab) : 'info'));
  const project = useAsync(() => (isNew ? Promise.resolve(null) : admin.projects.getProject(projectId)), [id]);

  if (project.error) {
    return (
      <>
        <PageHeader title="Dự án" back={{ to: `${ADMIN_BASE}/du-an`, label: 'Danh sách dự án' }} />
        <div className="a-card">
          <ErrorBox message={project.error} onRetry={project.reload} />
        </div>
      </>
    );
  }
  if (project.loading && !project.data) return <Loading />;
  const p = project.data ?? null;

  return (
    <>
      <PageHeader
        title={p ? p.name : 'Dự án mới'}
        subtitle={p ? `${p.type} · ${p.location}` : 'Điền thông tin cơ bản rồi lưu — sau đó thêm ảnh và mặt bằng.'}
        back={{ to: `${ADMIN_BASE}/du-an`, label: 'Danh sách dự án' }}
        actions={
          p && (
            <>
              {p.is_published ? <Badge tone="ok">Đang hiển thị</Badge> : <Badge>Đang ẩn</Badge>}
              <a className="a-btn a-btn--secondary a-btn--sm" href={`/du-an/${p.id}`} target="_blank" rel="noreferrer">
                <ExternalLink size={14} /> Xem trên website
              </a>
            </>
          )
        }
      />
      <div className="a-tabs a-tabs--line" role="tablist">
        <TabBtn active={tab === 'info'} onClick={() => setTab('info')}>
          Thông tin
        </TabBtn>
        <TabBtn active={tab === 'gallery'} onClick={() => setTab('gallery')} disabled={!p}>
          Không gian sống {p?.project_gallery && <i>{p.project_gallery.length}</i>}
        </TabBtn>
        <TabBtn active={tab === 'plans'} onClick={() => setTab('plans')} disabled={!p}>
          Mặt bằng riêng
        </TabBtn>
      </div>
      {tab === 'info' && <InfoTab project={p} onSaved={(row) => project.setData((old) => (old ? { ...old, ...row } : row))} />}
      {tab === 'gallery' && p && <GalleryTab project={p} />}
      {tab === 'plans' && p && <PlansTab project={p} />}
    </>
  );
}

function TabBtn({ active, disabled, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="tab" aria-selected={active} className={`a-tab${active ? ' active' : ''}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

// ---------- Thông tin ----------

function InfoTab({ project, onSaved }: { project: ProjectRow | null; onSaved: (row: ProjectRow) => void }) {
  const navigate = useNavigate();
  const { confirm } = useFeedback();
  const { run, runOk, busy } = useAction();
  const [initial, setInitial] = useState(() => (project ? toInput(project) : blankProject()));
  const [d, setD] = useState(initial);
  const [touched, setTouched] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const set = <K extends keyof ProjectInput>(k: K, v: ProjectInput[K]) => setD((x) => ({ ...x, [k]: v }));
  const ov = d.overview ?? EMPTY_OVERVIEW;
  const setOv = <K extends keyof ProjectOverview>(k: K, v: ProjectOverview[K]) => set('overview', { ...ov, [k]: v });

  const errors = {
    name: d.name.trim().length < 2 ? 'Tên dự án tối thiểu 2 ký tự.' : null,
    location: d.location.trim() ? null : 'Vui lòng nhập vị trí.',
    price: Number.isFinite(d.price) && d.price >= 0 ? null : 'Giá phải là số ≥ 0.',
  };
  const invalid = Object.values(errors).some(Boolean);

  // Cảnh báo khi rời trang còn thay đổi chưa lưu
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  async function save() {
    setTouched(true);
    if (invalid) return;
    const clean: ProjectInput = {
      ...d,
      name: d.name.trim(),
      location: d.location.trim(),
      overview: { ...ov, scale: ov.scale.map((s) => s.trim()).filter(Boolean) },
    };
    const row = await run(
      () => (project ? admin.projects.updateProject(project.id, clean) : admin.projects.createProject(clean)),
      project ? 'Đã lưu dự án' : 'Đã tạo dự án',
    );
    if (!row) return;
    setInitial(toInput(row));
    setD(toInput(row));
    if (project) onSaved(row);
    else navigate(`${ADMIN_BASE}/du-an/${row.id}`, { replace: true });
  }

  async function remove() {
    if (!project) return;
    const ok = await confirm({
      title: `Xoá dự án "${project.name}"?`,
      message: 'Ảnh không gian sống và mặt bằng riêng cũng bị xoá. Không thể hoàn tác.',
      confirmLabel: 'Xoá dự án',
      danger: true,
    });
    if (ok && (await runOk(() => admin.projects.deleteProject(project.id), 'Đã xoá dự án'))) navigate(`${ADMIN_BASE}/du-an`);
  }

  const err = (k: keyof typeof errors) => (touched ? errors[k] : null);

  return (
    <div className="a-card a-form-page">
      <div className="a-card-body a-form">
        <div className="a-grid-2">
          <Field label="Tên dự án" required error={err('name')} htmlFor="p-name">
            <input id="p-name" className={`a-input${err('name') ? ' invalid' : ''}`} value={d.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Vị trí (tỉnh / thành)" required error={err('location')} hint="Quyết định mục Vị trí đắc địa và bản đồ." htmlFor="p-loc">
            <LocationInput id="p-loc" value={d.location} onChange={(v) => set('location', v)} invalid={!!err('location')} />
          </Field>
        </div>
        <div className="a-grid-3">
          <Field label="Loại hình" required>
            <Select
              value={d.type}
              onChange={(t) => setD((x) => ({ ...x, type: t, building_type: project ? x.building_type : BUILDING_OF_TYPE[t] }))}
              options={PROJECT_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </Field>
          <Field label="Kiểu công trình" hint="Chọn bộ mặt bằng mặc định, tiện ích và ảnh minh hoạ.">
            <Select value={d.building_type} onChange={(v) => set('building_type', v)} options={BUILDING_TYPES.map((b) => ({ value: b, label: BUILDING_LABEL[b] }))} />
          </Field>
          <Field label="Trạng thái" required>
            <Select value={d.status} onChange={(v) => set('status', v)} options={PROJECT_STATUSES.map((s) => ({ value: s, label: s }))} />
          </Field>
        </div>
        <div className="a-grid-3">
          <Field label="Giá từ" required error={err('price')}>
            <div className="a-input-affix">
              <input
                className={`a-input${err('price') ? ' invalid' : ''}`}
                type="number"
                min="0"
                step="0.1"
                value={Number.isFinite(d.price) ? d.price : ''}
                onChange={(e) => set('price', e.target.value === '' ? NaN : Number(e.target.value))}
              />
              <span>tỷ VNĐ</span>
            </div>
          </Field>
          <Field label="Điểm phổ biến" hint="0–100, dùng khi sắp xếp “Phổ biến”.">
            <input
              className="a-input"
              type="number"
              min="0"
              max="100"
              value={d.popularity ?? 0}
              onChange={(e) => set('popularity', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            />
          </Field>
          <Field label="Hiển thị">
            <Switch
              checked={d.is_published ?? true}
              onChange={(v) => set('is_published', v)}
              label={d.is_published ? 'Đang hiển thị trên website' : 'Đang ẩn'}
            />
          </Field>
        </div>
        <Field label="Mô tả ngắn">
          <textarea className="a-input" rows={3} value={d.description ?? ''} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label="Ảnh đại diện">
          <ImageField
            value={d.cover_image_url ?? null}
            onChange={(url) => set('cover_image_url', url)}
            folder="projects"
            fallback={PROJECT_IMAGE_BY_BUILDING[d.building_type]}
          />
        </Field>

        <h3 className="a-form-heading">Thông tin tổng quan</h3>
        <div className="a-grid-2">
          <Field label="Chủ đầu tư">
            <input className="a-input" value={ov.developer} onChange={(e) => setOv('developer', e.target.value)} />
          </Field>
          <Field label="Hình thức sở hữu">
            <input className="a-input" value={ov.ownership} onChange={(e) => setOv('ownership', e.target.value)} placeholder="Sở hữu lâu dài" />
          </Field>
          <Field label="Diện tích đất">
            <input className="a-input" value={ov.landArea} onChange={(e) => setOv('landArea', e.target.value)} placeholder="15.200 m²" />
          </Field>
          <Field label="Mật độ xây dựng">
            <input className="a-input" value={ov.buildingDensity} onChange={(e) => setOv('buildingDensity', e.target.value)} placeholder="35%" />
          </Field>
          <Field label="Tiện ích">
            <input className="a-input" value={ov.amenities} onChange={(e) => setOv('amenities', e.target.value)} placeholder="32+ hạng mục tiện ích" />
          </Field>
          <Field label="Tiến độ bàn giao">
            <input className="a-input" value={ov.handover} onChange={(e) => setOv('handover', e.target.value)} placeholder="Dự kiến quý IV/2027" />
          </Field>
        </div>
        <Field label="Quy mô dự án">
          <textarea
            className="a-input"
            rows={3}
            value={ov.scale.join('\n')}
            onChange={(e) => setOv('scale', e.target.value.split('\n'))}
          />
        </Field>
      </div>
      <div className="a-form-foot">
        <span className="a-hint">{dirty ? 'Có thay đổi chưa lưu' : ''}</span>
        {project && (
          <button type="button" className="a-btn a-btn--danger" disabled={busy} onClick={remove}>
            <Trash2 size={15} /> Xoá dự án
          </button>
        )}
        <button type="button" className="a-btn a-btn--primary" disabled={busy || (!dirty && !!project)} onClick={save}>
          <Save size={15} /> {project ? 'Lưu thay đổi' : 'Tạo dự án'}
        </button>
      </div>
    </div>
  );
}

// ---------- Không gian sống ----------

function GalleryTab({ project }: { project: ProjectRow }) {
  const items = useAsync(() => admin.projects.listGallery(project.id), [project.id]);
  const input = useRef<HTMLInputElement>(null);
  const { run, runOk, busy } = useAction();
  const { confirm } = useFeedback();
  const list = items.data ?? [];

  async function add(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    for (const file of files) {
      const up = await run(() => admin.media.uploadMedia(file, 'gallery'));
      if (!up) continue;
      const room = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      await run(() => admin.projects.addGalleryItem(project.id, { room, image_url: up.url, description: '' }));
    }
    if (files.length) items.reload();
  }

  async function move(i: number, dir: -1 | 1) {
    const ids = list.map((g) => g.id);
    [ids[i], ids[i + dir]] = [ids[i + dir], ids[i]];
    items.setData(() => ids.map((id) => list.find((g) => g.id === id)!));
    await run(() => admin.projects.reorderGallery(ids));
  }

  async function remove(g: GalleryRow) {
    const ok = await confirm({ title: `Xoá ảnh "${g.room}"?`, confirmLabel: 'Xoá ảnh', danger: true });
    if (ok && (await runOk(() => admin.projects.deleteGalleryItem(g.id), 'Đã xoá ảnh'))) items.reload();
  }

  if (items.error) return <div className="a-card"><ErrorBox message={items.error} onRetry={items.reload} /></div>;
  if (!items.data) return <Loading />;

  return (
    <>
      <div className="a-alert info" style={{ marginBottom: 16 }}>
        <Box size={18} style={{ flex: 'none' }} />
        <span>
          Ảnh hiển thị ở mục "Không gian sống" và trong <b>tham quan 3D</b>. Tên phòng nên trùng với tên phòng trên mặt bằng
          (vd. "Phòng khách", "Phòng ngủ chính", "Phòng thay đồ") để tham quan 3D nối các phòng đúng vị trí.
          {list.length === 0 && ' Dự án chưa có ảnh riêng nên website đang dùng bộ ảnh mẫu.'}
        </span>
      </div>
      <div className="a-gallery">
        {list.map((g, i) => (
          <GalleryCard
            key={g.id}
            item={g}
            first={i === 0}
            last={i === list.length - 1}
            onMove={(dir) => move(i, dir)}
            onRemove={() => remove(g)}
            onSaved={(row) => items.setData((d) => d?.map((x) => (x.id === row.id ? row : x)))}
          />
        ))}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={add} />
        <button type="button" className="a-gallery-add" disabled={busy} onClick={() => input.current?.click()}>
          <ImagePlus size={26} strokeWidth={1.5} />
          {busy ? 'Đang tải lên…' : 'Thêm ảnh'}
          <span className="a-hint">Chọn được nhiều ảnh cùng lúc</span>
        </button>
      </div>
      {list.length === 0 && <Empty title="Chưa có ảnh không gian sống" />}
    </>
  );
}

function GalleryCard({
  item,
  first,
  last,
  onMove,
  onRemove,
  onSaved,
}: {
  item: GalleryRow;
  first: boolean;
  last: boolean;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onSaved: (row: GalleryRow) => void;
}) {
  const [room, setRoom] = useState(item.room);
  const [description, setDescription] = useState(item.description);
  const { run, busy } = useAction();
  const dirty = room !== item.room || description !== item.description;
  async function save() {
    const row = await run(() => admin.projects.updateGalleryItem(item.id, { room: room.trim(), description }), 'Đã lưu ảnh');
    if (row) onSaved(row);
  }
  return (
    <div className="a-gallery-item">
      <img src={item.image_url} alt={item.room} loading="lazy" />
      <div>
        <input className="a-input sm" value={room} onChange={(e) => setRoom(e.target.value)} aria-label="Tên phòng" placeholder="Tên phòng" />
        <textarea
          className="a-input sm"
          style={{ minHeight: 58 }}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Mô tả"
          placeholder="Mô tả ngắn"
        />
        <div className="a-gallery-tools">
          {item.depth_url ? <Badge tone="accent" plain>Có chiều sâu 3D</Badge> : <span style={{ marginRight: 'auto' }} />}
          {dirty && (
            <button type="button" className="a-btn a-btn--primary a-btn--sm" disabled={busy} onClick={save}>
              Lưu
            </button>
          )}
          <button type="button" className="a-icon-btn" disabled={first} onClick={() => onMove(-1)} aria-label="Đưa lên trước">
            <ArrowUp size={14} />
          </button>
          <button type="button" className="a-icon-btn" disabled={last} onClick={() => onMove(1)} aria-label="Đưa ra sau">
            <ArrowDown size={14} />
          </button>
          <button type="button" className="a-icon-btn danger" onClick={onRemove} aria-label="Xoá ảnh">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Mặt bằng riêng ----------

function PlansTab({ project }: { project: ProjectRow }) {
  const sets = useAsync(() => admin.floorPlans.listFloorPlanSets(), []);
  const { run, runOk, busy } = useAction();
  const { confirm } = useFeedback();
  if (sets.error) return <div className="a-card"><ErrorBox message={sets.error} onRetry={sets.reload} /></div>;
  if (!sets.data) return <Loading />;
  const own = sets.data.find((s) => s.project_id === project.id);
  const base = sets.data.find((s) => s.project_id === null && s.building_type === project.building_type);

  async function createOwn(from?: FloorPlanSetRow) {
    const created = await run(() =>
      admin.floorPlans.saveFloorPlanSet({ project_id: project.id }, { title: from?.title ?? 'Mặt bằng', intro: from?.intro ?? '' }),
    );
    if (!created) return;
    for (const p of from?.floor_plans ?? []) {
      await run(() =>
        admin.floorPlans.createFloorPlan(created.id, {
          slug: p.slug,
          name: p.name,
          code: p.code,
          area: Number(p.area),
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          note: p.note,
          width: Number(p.width),
          depth: Number(p.depth),
          rooms: p.rooms,
          sort_order: p.sort_order,
        }),
      );
    }
    sets.reload();
  }

  async function removeOwn(s: FloorPlanSetRow) {
    const ok = await confirm({
      title: 'Xoá mặt bằng riêng?',
      message: `Dự án sẽ quay về dùng bộ mặt bằng mặc định của loại hình ${BUILDING_LABEL[project.building_type]}.`,
      confirmLabel: 'Xoá mặt bằng riêng',
      danger: true,
    });
    if (ok && (await runOk(() => admin.floorPlans.deleteFloorPlanSet(s.id), 'Đã xoá mặt bằng riêng'))) sets.reload();
  }

  if (!own) {
    return (
      <div className="a-card">
        <Empty title="Dự án đang dùng mặt bằng mặc định" icon={<LayoutTemplate size={36} strokeWidth={1.4} />}>
          <p style={{ margin: '0 0 16px' }}>
            Bộ mặc định của loại hình <b>{BUILDING_LABEL[project.building_type]}</b>
            {base?.floor_plans?.length ? ` (${base.floor_plans.map((p) => p.code).join(', ')})` : ''}. Tạo mặt bằng riêng nếu dự án
            có thiết kế khác.
          </p>
          <div className="a-actions" style={{ justifyContent: 'center' }}>
            {base && (
              <button type="button" className="a-btn a-btn--primary" disabled={busy} onClick={() => createOwn(base)}>
                Tạo từ bộ mặc định
              </button>
            )}
            <button type="button" className="a-btn a-btn--secondary" disabled={busy} onClick={() => createOwn()}>
              Tạo bộ trống
            </button>
          </div>
        </Empty>
      </div>
    );
  }

  return (
    <>
      <div className="a-alert info" style={{ marginBottom: 16, alignItems: 'center' }}>
        <span style={{ flex: 1 }}>Dự án đang dùng mặt bằng riêng (thay cho bộ mặc định của loại hình).</span>
        <button type="button" className="a-btn a-btn--danger a-btn--sm" onClick={() => removeOwn(own)}>
          Quay về bộ mặc định
        </button>
      </div>
      <PlanSetEditor set={own} onChanged={sets.reload} />
    </>
  );
}
