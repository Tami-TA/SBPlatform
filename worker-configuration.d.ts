// Cloudflare bindings — keep in sync with wrangler.toml [[d1_databases]]
/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  BIBLE_DB: D1Database;
  [key: string]: unknown;
}
