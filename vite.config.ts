import path from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { maskUrl, SqlError, watchSchema } from './scripts/db/schema-sync.mjs'

/**
 * Khi chạy `npm run dev`: tự áp supabase/schema.sql lên Supabase lúc khởi động (nếu file đã đổi)
 * và mỗi lần lưu file. Cần SUPABASE_DB_URL trong .env — xem scripts/db/schema-sync.mjs.
 * Lỗi SQL hiện ở terminal và trên trình duyệt (khung lỗi của Vite), database giữ nguyên.
 */
function supabaseSchemaSync(): Plugin {
  return {
    name: 'terra-supabase-schema-sync',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      const logger = server.config.logger
      const dbUrl = env.SUPABASE_DB_URL?.trim()
      if (!dbUrl) {
        logger.info('  ➜  Supabase: chưa có SUPABASE_DB_URL trong .env — không tự đồng bộ schema.sql', { timestamp: true })
        return
      }
      logger.info(`  ➜  Supabase: tự đồng bộ supabase/schema.sql → ${maskUrl(dbUrl)}`, { timestamp: true })
      const stop = watchSchema({
        dbUrl,
        log: (m: string) => logger.info(`[supabase] ${m}`, { timestamp: true }),
        error: (e: unknown) => {
          const message = e instanceof SqlError ? e.message : String(e)
          logger.error(`[supabase] ✗ ${message}`, { timestamp: true })
          server.ws.send({ type: 'error', err: { message: `Supabase — schema.sql chưa được áp:\n${message}`, stack: '', plugin: 'supabase' } })
        },
      })
      server.httpServer?.once('close', stop)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), supabaseSchemaSync()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
