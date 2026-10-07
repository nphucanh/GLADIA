import { useEffect, useMemo, useState } from 'react';
import { Copy, Plus, Save, Trash2 } from 'lucide-react';
import { admin, type FloorPlanInput } from '../api/admin';
import type { FloorPlanRow, FloorPlanSetRow } from '../api/rows';
import type { FloorPlan, FloorPlanRoom, RoomKind } from '../data/projectDetails';
import FloorPlanDrawing from '../components/FloorPlanDrawing';
import { ROOM_KIND_LABEL } from './meta';
import { Field, useAction, useFeedback } from './ui';
import '../styles/projects.css';

/**
 * Soạn một bộ mặt bằng: tiêu đề + giới thiệu, và từng mặt bằng (thông số + danh sách phòng theo mét,
 * xem trước bản vẽ ngay bên cạnh — giống hệt bản vẽ trên website và dùng cho tham quan 3D).
 */
export default function PlanSetEditor({ set, onChanged }: { set: FloorPlanSetRow; onChanged: () => void }) {
  const plans = [...(set.floor_plans ?? [])].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  const [activeId, setActiveId] = useState<number | 'new'>(plans[0]?.id ?? 'new');
  const [title, setTitle] = useState(set.title);
  const [intro, setIntro] = useState(set.intro);
  const { run, busy } = useAction();

  useEffect(() => {
    setTitle(set.title);
    setIntro(set.intro);
    if (activeId !== 'new' && !plans.some((p) => p.id === activeId)) setActiveId(plans[0]?.id ?? 'new');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set]);

  const scope = set.project_id !== null ? { project_id: set.project_id } : { building_type: set.building_type! };
  const active = plans.find((p) => p.id === activeId) ?? null;

  async function saveSet() {
    if (await run(() => admin.floorPlans.saveFloorPlanSet(scope, { title, intro }), 'Đã lưu tiêu đề bộ mặt bằng')) onChanged();
  }

  return (
    <div className="a-section">
      <div className="a-card">
        <div className="a-card-body a-form">
          <div className="a-grid-2">
            <Field label="Tiêu đề mục Mặt bằng" required>
              <input className="a-input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Giới thiệu" hint="Đoạn ngắn dưới tiêu đề trên trang dự án.">
              <input className="a-input" value={intro} onChange={(e) => setIntro(e.target.value)} />
            </Field>
          </div>
          <div className="a-actions" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="a-btn a-btn--secondary a-btn--sm"
              disabled={busy || (title === set.title && intro === set.intro)}
              onClick={saveSet}
            >
              <Save size={14} /> Lưu tiêu đề
            </button>
          </div>
        </div>
      </div>

      <div className="a-chipbar" style={{ margin: '18px 0 12px' }} role="tablist" aria-label="Các mặt bằng">
        {plans.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === activeId}
            className={`a-chip${p.id === activeId ? ' active' : ''}`}
            onClick={() => setActiveId(p.id)}
          >
            <b>{p.code}</b> {p.name}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={activeId === 'new'}
          className={`a-chip add${activeId === 'new' ? ' active' : ''}`}
          onClick={() => setActiveId('new')}
        >
          <Plus size={14} /> Thêm mặt bằng
        </button>
      </div>

      <PlanEditor
        key={active?.id ?? 'new'}
        setId={set.id}
        plan={active}
        copyFrom={plans[plans.length - 1] ?? null}
        nextOrder={plans.length}
        onSaved={(row) => {
          setActiveId(row.id);
          onChanged();
        }}
        onDeleted={() => {
          setActiveId('new');
          onChanged();
        }}
      />
    </div>
  );
}

const ROOM_KINDS = Object.keys(ROOM_KIND_LABEL) as RoomKind[];

const blankPlan = (order: number): FloorPlanInput => ({
  slug: `mb${order + 1}`,
  name: '',
  code: '',
  area: 50,
  bedrooms: null,
  bathrooms: null,
  note: '',
  width: 8,
  depth: 6,
  rooms: [{ label: 'Phòng khách', kind: 'living', x: 0, y: 0, w: 8, h: 6 }],
  sort_order: order,
});

const toInput = (p: FloorPlanRow): FloorPlanInput => ({
  slug: p.slug,
  name: p.name,
  code: p.code,
  area: Number(p.area),
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  note: p.note,
  width: Number(p.width),
  depth: Number(p.depth),
  rooms: p.rooms.map((r) => ({ ...r })),
  sort_order: p.sort_order,
});

function PlanEditor({
  setId,
  plan,
  copyFrom,
  nextOrder,
  onSaved,
  onDeleted,
}: {
  setId: number;
  plan: FloorPlanRow | null;
  copyFrom: FloorPlanRow | null;
  nextOrder: number;
  onSaved: (row: FloorPlanRow) => void;
  onDeleted: () => void;
}) {
  const initial = useMemo(() => (plan ? toInput(plan) : blankPlan(nextOrder)), [plan, nextOrder]);
  const [d, setD] = useState<FloorPlanInput>(initial);
  const { run, busy } = useAction();
  const { confirm } = useFeedback();
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const set = <K extends keyof FloorPlanInput>(k: K, v: FloorPlanInput[K]) => setD((x) => ({ ...x, [k]: v }));
  const setRoom = (i: number, patch: Partial<FloorPlanRoom>) =>
    setD((x) => ({ ...x, rooms: x.rooms.map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  const num = (v: string) => (v === '' ? NaN : Number(v));

  // Phòng nằm ngoài khung → đánh dấu đỏ ngay khi nhập
  const outside = (r: FloorPlanRoom) => r.x < 0 || r.y < 0 || r.x + r.w > d.width + 1e-6 || r.y + r.h > d.depth + 1e-6;

  const preview: FloorPlan = {
    id: d.slug,
    name: d.name || 'Mặt bằng',
    code: d.code || '—',
    area: d.area,
    bedrooms: d.bedrooms ?? undefined,
    bathrooms: d.bathrooms ?? undefined,
    note: d.note ?? '',
    width: d.width > 0 ? d.width : 1,
    depth: d.depth > 0 ? d.depth : 1,
    rooms: d.rooms.filter((r) => [r.x, r.y, r.w, r.h].every(Number.isFinite) && r.w > 0 && r.h > 0),
  };

  async function save() {
    const row = await run(
      () => (plan ? admin.floorPlans.updateFloorPlan(plan.id, d) : admin.floorPlans.createFloorPlan(setId, d)),
      plan ? 'Đã lưu mặt bằng' : 'Đã thêm mặt bằng',
    );
    if (row) onSaved(row);
  }

  async function remove() {
    if (!plan) return;
    const ok = await confirm({ title: `Xoá mặt bằng ${plan.code}?`, message: 'Tab này sẽ biến mất khỏi trang dự án.', confirmLabel: 'Xoá', danger: true });
    if (ok && (await run(() => admin.floorPlans.deleteFloorPlan(plan.id), 'Đã xoá mặt bằng')) !== undefined) onDeleted();
  }

  return (
    <div className="a-plan-layout">
      <div className="a-card">
        <div className="a-card-body a-form">
          {!plan && copyFrom && (
            <div className="a-alert info" style={{ alignItems: 'center' }}>
              <span style={{ flex: 1 }}>Mặt bằng mới. Có thể bắt đầu từ bản sao của {copyFrom.code} cho nhanh.</span>
              <button
                type="button"
                className="a-btn a-btn--secondary a-btn--sm"
                onClick={() => setD({ ...toInput(copyFrom), slug: `${copyFrom.slug}-2`, code: `${copyFrom.code}'`, sort_order: nextOrder })}
              >
                <Copy size={14} /> Sao chép {copyFrom.code}
              </button>
            </div>
          )}
          <div className="a-grid-3">
            <Field label="Tên tab" required hint='vd "2 phòng ngủ", "Tầng 1"'>
              <input className="a-input" value={d.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Mã căn / tầng" required hint='vd "B2", "T1"'>
              <input className="a-input" value={d.code} onChange={(e) => set('code', e.target.value)} />
            </Field>
            <Field label="Mã đường dẫn" required hint="chữ thường, số, gạch ngang">
              <input className="a-input" value={d.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} />
            </Field>
          </div>
          <div className="a-grid-4">
            <NumField label="Diện tích" unit="m²" value={d.area} onChange={(v) => set('area', v)} />
            <NumField label="Chiều rộng" unit="m" value={d.width} onChange={(v) => set('width', v)} />
            <NumField label="Chiều sâu" unit="m" value={d.depth} onChange={(v) => set('depth', v)} />
            <div className="a-grid-2" style={{ gap: 8 }}>
              <NumField label="P. ngủ" value={d.bedrooms ?? NaN} onChange={(v) => set('bedrooms', Number.isFinite(v) ? v : null)} />
              <NumField label="WC" value={d.bathrooms ?? NaN} onChange={(v) => set('bathrooms', Number.isFinite(v) ? v : null)} />
            </div>
          </div>
          <Field label="Ghi chú" hint="Hiện dưới thông số trên trang dự án.">
            <textarea className="a-input" rows={2} style={{ minHeight: 0 }} value={d.note ?? ''} onChange={(e) => set('note', e.target.value)} />
          </Field>

          <div>
            <div className="a-label" style={{ marginBottom: 8 }}>
              Các phòng <span className="a-hint">— toạ độ tính bằng mét từ góc trên-trái mặt bằng</span>
            </div>
            <div className="a-table-wrap" style={{ border: '1px solid var(--a-line)', borderRadius: 8 }}>
              <table className="a-table a-rooms">
                <thead>
                  <tr>
                    <th>Tên phòng</th>
                    <th>Loại</th>
                    <th>X</th>
                    <th>Y</th>
                    <th>Rộng</th>
                    <th>Sâu</th>
                    <th className="actions" aria-label="Xoá" />
                  </tr>
                </thead>
                <tbody>
                  {d.rooms.map((r, i) => {
                    const bad = outside(r);
                    return (
                      <tr key={i}>
                        <td>
                          <input
                            className="a-input sm"
                            value={r.label}
                            onChange={(e) => setRoom(i, { label: e.target.value })}
                            aria-label={`Tên phòng ${i + 1}`}
                          />
                        </td>
                        <td>
                          <select className="a-input sm" value={r.kind} onChange={(e) => setRoom(i, { kind: e.target.value as RoomKind })} aria-label="Loại phòng">
                            {ROOM_KINDS.map((k) => (
                              <option key={k} value={k}>
                                {ROOM_KIND_LABEL[k]}
                              </option>
                            ))}
                          </select>
                        </td>
                        {(['x', 'y', 'w', 'h'] as const).map((k) => (
                          <td key={k}>
                            <input
                              className={`a-input sm${bad ? ' invalid' : ''}`}
                              type="number"
                              step="0.5"
                              value={Number.isFinite(r[k]) ? r[k] : ''}
                              onChange={(e) => setRoom(i, { [k]: num(e.target.value) })}
                              aria-label={`${r.label} ${k}`}
                            />
                          </td>
                        ))}
                        <td className="actions">
                          <button
                            type="button"
                            className="a-icon-btn danger"
                            onClick={() => setD((x) => ({ ...x, rooms: x.rooms.filter((_, j) => j !== i) }))}
                            aria-label={`Xoá phòng ${r.label}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="a-btn a-btn--ghost a-btn--sm"
              style={{ marginTop: 8 }}
              onClick={() => setD((x) => ({ ...x, rooms: [...x.rooms, { label: 'Phòng mới', kind: 'bed', x: 0, y: 0, w: 3, h: 3 }] }))}
            >
              <Plus size={14} /> Thêm phòng
            </button>
            {d.rooms.some(outside) && <p className="a-error-text">Có phòng nằm ngoài khung {d.width} × {d.depth} m (ô viền đỏ).</p>}
          </div>
        </div>
        <div className="a-form-foot">
          <span className="a-hint">{dirty ? 'Có thay đổi chưa lưu' : plan ? 'Đã lưu' : ''}</span>
          {plan && (
            <button type="button" className="a-btn a-btn--danger a-btn--sm" disabled={busy} onClick={remove}>
              <Trash2 size={14} /> Xoá
            </button>
          )}
          <button type="button" className="a-btn a-btn--primary" disabled={busy || (!dirty && !!plan)} onClick={save}>
            <Save size={15} /> {plan ? 'Lưu mặt bằng' : 'Thêm mặt bằng'}
          </button>
        </div>
      </div>
      <div className="a-plan-preview" aria-label="Xem trước bản vẽ">
        <FloorPlanDrawing plan={preview} />
        <p>Xem trước — giống bản vẽ trên trang dự án</p>
      </div>
    </div>
  );
}

function NumField({ label, unit, value, onChange }: { label: string; unit?: string; value: number; onChange: (v: number) => void }) {
  return (
    <Field label={label}>
      <div className="a-input-affix">
        <input
          className="a-input"
          type="number"
          step="0.5"
          min="0"
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
        />
        {unit && <span>{unit}</span>}
      </div>
    </Field>
  );
}
