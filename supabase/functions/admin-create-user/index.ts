// Edge Function: tạo tài khoản đăng nhập mới cho quản trị viên (chỉ owner gọi được).
// Tạo user cần khoá service_role → không bao giờ làm ở trình duyệt; Supabase tự cấp khoá này cho function qua
// biến môi trường SUPABASE_SERVICE_ROLE_KEY (không cần cấu hình gì thêm).
//
// Cài đặt (một lần):  npx supabase login
//                     npx supabase functions deploy admin-create-user --project-ref <ref> --no-verify-jwt
// (--no-verify-jwt: function tự kiểm tra người gọi là owner bên dưới; để cổng Supabase không chặn yêu cầu OPTIONS của trình duyệt)
// Gọi từ trang quản trị: supabase.functions.invoke('admin-create-user', { body: { email, password, full_name, role } })
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { code: 'method', message: 'Chỉ nhận POST.' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // 1. Người gọi phải là owner đang hoạt động
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: caller } = await service.auth.getUser(jwt);
  if (!caller?.user) return json(401, { code: 'unauthorized', message: 'Phiên đăng nhập không hợp lệ.' });
  const { data: me } = await service.from('admin_users').select('role, is_active').eq('user_id', caller.user.id).maybeSingle();
  if (!me || !me.is_active || me.role !== 'owner') return json(403, { code: 'unauthorized', message: 'Chỉ chủ sở hữu (owner) mới tạo được tài khoản.' });

  // 2. Kiểm tra dữ liệu
  let body: { email?: string; password?: string; full_name?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { code: 'validation', message: 'Dữ liệu gửi lên không hợp lệ.' });
  }
  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';
  const fullName = (body.full_name ?? '').trim().slice(0, 120) || null;
  const role = body.role === 'owner' ? 'owner' : 'editor';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { code: 'validation', message: 'Email không hợp lệ.' });
  if (password.length < 8) return json(400, { code: 'validation', message: 'Mật khẩu tạm tối thiểu 8 ký tự.' });

  // 3. Tạo tài khoản (đã xác nhận email, đăng nhập được ngay bằng mật khẩu tạm)
  const { data: created, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });
  if (error || !created.user) {
    const exists = /already|registered|exists/i.test(error?.message ?? '');
    return json(exists ? 409 : 400, {
      code: exists ? 'exists' : 'validation',
      message: exists ? 'Email này đã có tài khoản — dùng "Cấp quyền cho tài khoản có sẵn".' : error?.message ?? 'Không tạo được tài khoản.',
    });
  }

  // 4. Cấp quyền quản trị
  const { error: grantError } = await service
    .from('admin_users')
    .upsert({ user_id: created.user.id, email, full_name: fullName, role, is_active: true }, { onConflict: 'user_id' });
  if (grantError) {
    await service.auth.admin.deleteUser(created.user.id); // không để lại tài khoản "mồ côi"
    return json(500, { code: 'unknown', message: 'Tạo tài khoản xong nhưng không cấp được quyền — đã huỷ, vui lòng thử lại.' });
  }
  return json(200, { user_id: created.user.id });
});
