import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Copy, Lock, LockOpen, RefreshCw, ShieldCheck, UserMinus, UserPlus, UsersRound } from 'lucide-react';
import { admin, isAdminDemo, type NewAdminInput } from '../../api/admin';
import type { AdminRole, AdminUserRow } from '../../api/rows';
import { Avatar, ROLE_LABEL, useAdmin } from '../AdminApp';
import { Badge, Empty, ErrorBox, Field, fmtAgo, fmtDate, Loading, PageHeader, SearchBox, Seg, Select, Sheet, useAction, useAsync, useFeedback } from '../ui';

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: 'editor', label: 'Biên tập viên — quản lý nội dung, hộp thư, thống kê' },
  { value: 'owner', label: 'Chủ sở hữu — toàn quyền, kể cả quản lý người quản trị' },
];

export default function Users() {
  const { profile } = useAdmin();
  const list = useAsync(() => admin.users.listUsers(), []);
  const { confirm } = useFeedback();
  const { runOk } = useAction();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const me = profile?.user_id;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (list.data ?? []).filter((u) => !q || u.email.toLowerCase().includes(q) || (u.full_name ?? '').toLowerCase().includes(q));
  }, [list.data, search]);
  const counts = useMemo(() => {
    const all = list.data ?? [];
    return { total: all.length, owners: all.filter((u) => u.role === 'owner' && u.is_active).length, locked: all.filter((u) => !u.is_active).length };
  }, [list.data]);

  const name = (u: AdminUserRow) => u.full_name || u.email;

  async function changeRole(u: AdminUserRow, role: AdminRole) {
    if (role === u.role) return;
    if (role === 'owner') {
      const ok = await confirm({
        title: `Cho ${name(u)} làm chủ sở hữu?`,
        message: 'Chủ sở hữu có toàn quyền, kể cả thêm / khoá / gỡ quyền những người quản trị khác (trừ chính bạn).',
        confirmLabel: 'Đồng ý',
      });
      if (!ok) return;
    }
    if (await runOk(() => admin.users.setUser(u.user_id, { role, is_active: u.is_active }), `Đã đổi vai trò của ${name(u)}`)) list.reload();
  }

  async function toggleActive(u: AdminUserRow) {
    if (u.is_active) {
      const ok = await confirm({
        title: `Tạm khoá ${name(u)}?`,
        message: 'Người này bị đăng xuất khỏi mọi thao tác quản trị ngay lập tức và không đăng nhập lại được cho đến khi được mở khoá. Dữ liệu họ đã tạo vẫn giữ nguyên.',
        confirmLabel: 'Tạm khoá',
        danger: true,
      });
      if (!ok) return;
    }
    const msg = u.is_active ? `Đã tạm khoá ${name(u)}` : `Đã mở khoá ${name(u)}`;
    if (await runOk(() => admin.users.setUser(u.user_id, { role: u.role, is_active: !u.is_active }), msg)) list.reload();
  }

  async function revoke(u: AdminUserRow) {
    const ok = await confirm({
      title: `Gỡ quyền quản trị của ${name(u)}?`,
      message: 'Tài khoản đăng nhập vẫn còn nhưng không vào được trang quản trị nữa. Muốn cho vào lại, dùng "Thêm quản trị viên" › cấp quyền với cùng email.',
      confirmLabel: 'Gỡ quyền',
      danger: true,
    });
    if (ok && (await runOk(() => admin.users.revokeUser(u.user_id), `Đã gỡ quyền của ${name(u)}`))) list.reload();
  }

  return (
    <>
      <PageHeader
        title="Người quản trị"
        actions={
          <>
            <button type="button" className="a-btn a-btn--secondary" onClick={list.reload} disabled={list.loading}>
              <RefreshCw size={15} className={list.loading ? 'a-spin' : undefined} /> Làm mới
            </button>
            <button type="button" className="a-btn a-btn--primary" onClick={() => setAdding(true)}>
              <UserPlus size={16} /> Thêm quản trị viên
            </button>
          </>
        }
      />

      <div className="a-card">
        <div className="a-toolbar">
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc email…" />
          {list.data && (
            <span className="a-users-count">
              <b>{counts.total}</b> người · <b>{counts.owners}</b> chủ sở hữu{counts.locked > 0 && <> · <b>{counts.locked}</b> đang khoá</>}
            </span>
          )}
        </div>
        {list.error ? (
          <ErrorBox message={list.error} onRetry={list.reload} />
        ) : !list.data ? (
          <Loading label="Đang tải danh sách người quản trị…" />
        ) : rows.length === 0 ? (
          <Empty title="Không có người phù hợp" icon={<UsersRound size={36} strokeWidth={1.4} />} />
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Người quản trị</th>
                  <th style={{ width: 240 }}>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Đăng nhập gần nhất</th>
                  <th className="actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const self = u.user_id === me;
                  return (
                    <tr key={u.user_id} className={u.is_active ? undefined : 'a-row-muted'}>
                      <td>
                        <div className="a-cell-main">
                          <Avatar name={name(u)} src={u.avatar_url} size={38} />
                          <div>
                            <b>
                              {name(u)} {self && <Badge tone="ok">Bạn</Badge>}
                            </b>
                            <small>
                              {u.full_name ? u.email : 'Chưa đặt tên'} · thêm {fmtDate(u.created_at)}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {self ? (
                          <Badge tone={u.role === 'owner' ? 'accent' : 'info'}>{ROLE_LABEL[u.role]}</Badge>
                        ) : (
                          <Select<AdminRole>
                            size="sm"
                            aria-label={`Vai trò của ${name(u)}`}
                            value={u.role}
                            onChange={(v) => changeRole(u, v)}
                            options={[
                              { value: 'owner', label: ROLE_LABEL.owner },
                              { value: 'editor', label: ROLE_LABEL.editor },
                            ]}
                          />
                        )}
                      </td>
                      <td>{u.is_active ? <Badge tone="ok">Đang hoạt động</Badge> : <Badge tone="danger">Tạm khoá</Badge>}</td>
                      <td>{u.last_sign_in_at ? <span title={fmtDate(u.last_sign_in_at)}>{fmtAgo(u.last_sign_in_at)}</span> : <span className="a-faint">Chưa đăng nhập</span>}</td>
                      <td className="actions">
                        {self ? (
                          <span className="a-faint">—</span>
                        ) : (
                          <div className="a-row-actions">
                            <button type="button" className="a-btn a-btn--secondary a-btn--sm" onClick={() => toggleActive(u)}>
                              {u.is_active ? <Lock size={14} /> : <LockOpen size={14} />} {u.is_active ? 'Khoá' : 'Mở khoá'}
                            </button>
                            <button type="button" className="a-icon-btn danger" title="Gỡ quyền quản trị" aria-label={`Gỡ quyền của ${name(u)}`} onClick={() => revoke(u)}>
                              <UserMinus size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adding && (
        <AddSheet
          onClose={() => setAdding(false)}
          onAdded={() => {
            setAdding(false);
            list.reload();
          }}
        />
      )}
    </>
  );
}

type Mode = 'create' | 'grant';

function AddSheet({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [mode, setMode] = useState<Mode>('create');
  const [d, setD] = useState({ email: '', full_name: '', role: 'editor' as AdminRole, password: makePassword() });
  const [touched, setTouched] = useState(false);
  const { runOk, busy } = useAction();
  const [done, setDone] = useState<{ email: string; password?: string } | null>(null);
  // Edge Function tạo tài khoản đã deploy chưa — chưa thì chuyển sẵn sang "cấp quyền" và hiện hướng dẫn
  const [canCreate, setCanCreate] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    admin.users.canCreateAccounts().then((ok) => {
      if (!alive) return;
      setCanCreate(ok);
      if (!ok) setMode('grant');
    });
    return () => {
      alive = false;
    };
  }, []);
  const createBlocked = mode === 'create' && canCreate === false;

  const errors = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()) ? null : 'Email không hợp lệ.',
    password: mode === 'grant' || d.password.length >= 8 ? null : 'Mật khẩu tạm tối thiểu 8 ký tự.',
  };

  async function save() {
    setTouched(true);
    if (errors.email || errors.password) return;
    const input: NewAdminInput = { email: d.email.trim(), full_name: d.full_name, role: d.role, password: mode === 'create' ? d.password : undefined };
    const ok = await runOk(() => admin.users.addUser(input), mode === 'create' ? 'Đã tạo tài khoản quản trị' : 'Đã cấp quyền quản trị');
    if (ok) setDone({ email: input.email, password: input.password });
  }

  if (done) {
    return (
      <Sheet
        open
        variant="modal"
        onClose={onAdded}
        title="Đã thêm quản trị viên"
        subtitle={done.email}
        footer={
          <>
            <span />
            <button type="button" className="a-btn a-btn--primary" onClick={onAdded}>
              Xong
            </button>
          </>
        }
      >
        <div className="a-alert info">
          <ShieldCheck size={17} style={{ flex: 'none', marginTop: 1 }} />
          <span>
            {done.password
              ? 'Gửi email và mật khẩu tạm bên dưới cho người này qua kênh riêng tư. Họ nên đổi mật khẩu ở "Tài khoản của tôi" ngay lần đăng nhập đầu.'
              : 'Người này đăng nhập bằng tài khoản sẵn có của họ tại trang quản trị.'}
          </span>
        </div>
        <CopyRow label="Trang đăng nhập" value={`${window.location.origin}/quan-tri/dang-nhap`} />
        <CopyRow label="Email" value={done.email} />
        {done.password && <CopyRow label="Mật khẩu tạm" value={done.password} />}
        {isAdminDemo && <p className="a-hint">Chế độ xem thử: không tạo tài khoản đăng nhập thật.</p>}
      </Sheet>
    );
  }

  return (
    <Sheet
      open
      variant="modal"
      onClose={onClose}
      title="Thêm quản trị viên"
      subtitle="Người được thêm đăng nhập tại /quan-tri với vai trò bạn chọn."
      footer={
        <>
          <span />
          <div className="a-actions">
            <button type="button" className="a-btn a-btn--secondary" onClick={onClose}>
              Huỷ
            </button>
            <button type="button" className="a-btn a-btn--primary" disabled={busy || createBlocked} onClick={save}>
              <UserPlus size={15} /> {mode === 'create' ? 'Tạo tài khoản' : 'Cấp quyền'}
            </button>
          </div>
        </>
      }
    >
      <Seg<Mode>
        label="Cách thêm"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'create', label: 'Tạo tài khoản mới' },
          { value: 'grant', label: 'Cấp quyền cho tài khoản có sẵn' },
        ]}
      />
      {createBlocked ? (
        <div className="a-alert warn">
          <AlertTriangle size={17} style={{ flex: 'none', marginTop: 1 }} />
          <span>
            Chưa bật được tính năng tạo tài khoản mới: Edge Function <b>admin-create-user</b> chưa được deploy lên Supabase (xem
            docs/API.md › Cài đặt, bước 3). Trong lúc chờ: tạo tài khoản ở Supabase › Authentication › <i>Add user</i>, rồi dùng
            tab <b>Cấp quyền cho tài khoản có sẵn</b>.
          </span>
        </div>
      ) : (
        <p className="a-hint">
          {mode === 'create'
            ? 'Tạo tài khoản đăng nhập kèm mật khẩu tạm, đăng nhập được ngay.'
            : 'Dành cho email đã có tài khoản (vd. người từng bị gỡ quyền, hoặc đã tạo ở Supabase › Authentication).'}
        </p>
      )}
      <div className="a-grid-2">
        <Field label="Email" required htmlFor="u-email" error={touched ? errors.email : null}>
          <input
            id="u-email"
            className={`a-input${touched && errors.email ? ' invalid' : ''}`}
            type="email"
            autoComplete="off"
            placeholder="ten@congty.vn"
            value={d.email}
            onChange={(e) => setD((x) => ({ ...x, email: e.target.value }))}
            autoFocus
          />
        </Field>
        <Field label="Họ và tên" htmlFor="u-name" hint="Không bắt buộc — người đó tự sửa được sau.">
          <input id="u-name" className="a-input" maxLength={120} value={d.full_name} onChange={(e) => setD((x) => ({ ...x, full_name: e.target.value }))} />
        </Field>
      </div>
      <Field label="Vai trò">
        <Select<AdminRole> value={d.role} onChange={(v) => setD((x) => ({ ...x, role: v }))} options={ROLE_OPTIONS} />
      </Field>
      {mode === 'create' && (
        <Field label="Mật khẩu tạm" htmlFor="u-pw" error={touched ? errors.password : null} hint="Tự tạo ngẫu nhiên; bạn sẽ thấy lại để gửi cho người được thêm.">
          <div className="a-input-group">
            <input id="u-pw" className="a-input" value={d.password} autoComplete="off" onChange={(e) => setD((x) => ({ ...x, password: e.target.value }))} />
            <button type="button" className="a-btn a-btn--secondary" onClick={() => setD((x) => ({ ...x, password: makePassword() }))}>
              <RefreshCw size={14} /> Tạo lại
            </button>
          </div>
        </Field>
      )}
    </Sheet>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Field label={label}>
      <div className="a-input-group">
        <input className="a-input" value={value} readOnly onFocus={(e) => e.target.select()} />
        <button
          type="button"
          className="a-btn a-btn--secondary"
          onClick={() =>
            navigator.clipboard?.writeText(value).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
          }
        >
          <Copy size={14} /> {copied ? 'Đã chép' : 'Chép'}
        </button>
      </div>
    </Field>
  );
}

/** Mật khẩu tạm ngẫu nhiên 14 ký tự (bỏ các ký tự dễ nhầm như 0/O, 1/l). */
function makePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%';
  const buf = new Uint32Array(14);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => chars[n % chars.length]).join('');
}
