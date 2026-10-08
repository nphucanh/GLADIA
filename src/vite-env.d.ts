/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Site key Cloudflare Turnstile (công khai) — captcha trang đăng nhập quản trị. */
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  /** Slug Edge Function tạo tài khoản quản trị (mặc định "admin-create-user"). */
  readonly VITE_ADMIN_CREATE_USER_FN?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
