// Kiểu cho scripts/db/schema-sync.mjs (dùng trong vite.config.ts).
export declare const SCHEMA_FILE: string;
export declare class SqlError extends Error {}
export declare function readDbUrl(env?: Record<string, string | undefined>): string | null;
export declare function maskUrl(url: string): string;
export declare function runSqlFile(client: { query(text: string): Promise<unknown> }, file: string): Promise<number>;
export declare function pushSchema(opts?: { dbUrl?: string | null; force?: boolean; log?: (m: string) => void }): Promise<{ applied: boolean; ms: number }>;
export declare function pushSeed(opts?: { dbUrl?: string | null }): Promise<number>;
export declare function watchSchema(opts?: {
  dbUrl?: string | null;
  log?: (m: string) => void;
  error?: (e: unknown) => void;
  onApplied?: () => void;
}): () => void;
