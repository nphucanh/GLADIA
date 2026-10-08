import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { maskUrl, SqlError, watchSchema } from './scripts/db/schema-sync.mjs';
/**
 * Khi chạy `npm run dev`: tự áp supabase/schema.sql lên Supabase lúc khởi động (nếu file đã đổi)
 * và mỗi lần lưu file. Cần SUPABASE_DB_URL trong .env — xem scripts/db/schema-sync.mjs.
 * Lỗi SQL hiện ở terminal và trên trình duyệt (khung lỗi của Vite), database giữ nguyên.
 */
function supabaseSchemaSync() {
    return {
        name: 'terra-supabase-schema-sync',
        apply: 'serve',
        configureServer: function (server) {
            var _a, _b;
            var env = loadEnv(server.config.mode, server.config.root, '');
            var logger = server.config.logger;
            var dbUrl = (_a = env.SUPABASE_DB_URL) === null || _a === void 0 ? void 0 : _a.trim();
            if (!dbUrl) {
                logger.info('  ➜  Supabase: chưa có SUPABASE_DB_URL trong .env — không tự đồng bộ schema.sql', { timestamp: true });
                return;
            }
            logger.info("  \u279C  Supabase: t\u1EF1 \u0111\u1ED3ng b\u1ED9 supabase/schema.sql \u2192 ".concat(maskUrl(dbUrl)), { timestamp: true });
            var stop = watchSchema({
                dbUrl: dbUrl,
                log: function (m) { return logger.info("[supabase] ".concat(m), { timestamp: true }); },
                error: function (e) {
                    var message = e instanceof SqlError ? e.message : String(e);
                    logger.error("[supabase] \u2717 ".concat(message), { timestamp: true });
                    server.ws.send({ type: 'error', err: { message: "Supabase \u2014 schema.sql ch\u01B0a \u0111\u01B0\u1EE3c \u00E1p:\n".concat(message), stack: '', plugin: 'supabase' } });
                },
            });
            (_b = server.httpServer) === null || _b === void 0 ? void 0 : _b.once('close', stop);
        },
    };
}
export default defineConfig({
    plugins: [react(), tailwindcss(), supabaseSchemaSync()],
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },
});
