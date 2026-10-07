import { useState } from 'react';
import { Link } from 'react-router-dom';
import { admin } from '../../api/admin';
import type { BuildingType } from '../../types';
import { ADMIN_BASE } from '../AdminApp';
import { BUILDING_LABEL, BUILDING_TYPES } from '../meta';
import PlanSetEditor from '../PlanSetEditor';
import { Empty, ErrorBox, Loading, PageHeader, paginate, Pager, useAction, useAsync, usePaging } from '../ui';

export default function FloorPlans() {
  const [building, setBuilding] = useState<BuildingType>('apartment');
  const sets = useAsync(() => admin.floorPlans.listFloorPlanSets(), []);
  const projects = useAsync(() => admin.projects.listProjects({ pageSize: 100 }), []);
  const { run, busy } = useAction();

  const set = sets.data?.find((s) => s.project_id === null && s.building_type === building);
  const own = (sets.data ?? []).filter((s) => s.project_id !== null);
  const { page, setPage, pageSize, setPageSize } = usePaging('plan-sets', 10);
  const ownView = paginate(own, page, pageSize);
  const projectName = (id: number) => projects.data?.items.find((p) => p.id === id)?.name ?? `Dự án #${id}`;

  async function createDefault() {
    if (await run(() => admin.floorPlans.saveFloorPlanSet({ building_type: building }, { title: `Mặt bằng ${BUILDING_LABEL[building].toLowerCase()}` }))) sets.reload();
  }

  return (
    <>
      <PageHeader
        title="Mặt bằng"
        subtitle="Bộ mặt bằng mặc định theo loại hình — áp dụng cho mọi dự án cùng loại, trừ dự án có mặt bằng riêng."
      />
      <div className="a-tabs a-tabs--line" role="tablist">
        {BUILDING_TYPES.map((b) => (
          <button key={b} type="button" role="tab" aria-selected={b === building} className={`a-tab${b === building ? ' active' : ''}`} onClick={() => setBuilding(b)}>
            {BUILDING_LABEL[b]}
          </button>
        ))}
      </div>

      {sets.error ? (
        <div className="a-card">
          <ErrorBox message={sets.error} onRetry={sets.reload} />
        </div>
      ) : !sets.data ? (
        <Loading />
      ) : set ? (
        <PlanSetEditor key={set.id} set={set} onChanged={sets.reload} />
      ) : (
        <div className="a-card">
          <Empty title={`Chưa có bộ mặt bằng cho ${BUILDING_LABEL[building].toLowerCase()}`}>
            <p style={{ margin: '0 0 14px' }}>Website đang dùng bộ mẫu có sẵn trong mã nguồn.</p>
            <button type="button" className="a-btn a-btn--primary" disabled={busy} onClick={createDefault}>
              Tạo bộ mặt bằng
            </button>
          </Empty>
        </div>
      )}

      {own.length > 0 && (
        <div className="a-card" style={{ marginTop: 24 }}>
          <div className="a-card-head">
            <h2>Dự án có mặt bằng riêng</h2>
          </div>
          <ul className="a-list">
            {ownView.items.map((s) => (
              <li key={s.id}>
                <div>
                  <b>{projectName(s.project_id!)}</b>
                  <small>{(s.floor_plans ?? []).map((p) => `${p.code} · ${p.name}`).join('   ·   ') || 'Chưa có mặt bằng'}</small>
                </div>
                <Link className="a-btn a-btn--secondary a-btn--sm" to={`${ADMIN_BASE}/du-an/${s.project_id}?tab=plans`}>
                  Mở dự án
                </Link>
              </li>
            ))}
          </ul>
          <Pager page={ownView.page} totalPages={ownView.totalPages} total={ownView.total} pageSize={pageSize} onChange={setPage} onPageSize={setPageSize} unit="dự án" />
        </div>
      )}
    </>
  );
}
