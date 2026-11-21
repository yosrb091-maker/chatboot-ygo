import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// YGO n'utilise pas la base de données pour le chat : elle ne sert qu'à la
// vérification de santé. On ne bloque donc plus le démarrage ni le build si
// DATABASE_URL est absente (par exemple sur Vercel). Le Pool ne se connecte
// qu'au moment où une requête est réellement envoyée.
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
