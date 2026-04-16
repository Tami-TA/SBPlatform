/**
 * Server-only utility for managing the local SQLite Bible database.
 *
 * The database is NOT stored in the repository. It is downloaded from a
 * GitHub Release asset URL stored in the BIBLE_DB_URL environment variable.
 *
 * Expected local path: <project-root>/server/data/bible.db
 *
 * Usage: import only in Next.js API routes (src/app/api/**) or
 * server components — never in client-side code.
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

const DB_PATH = path.join(process.cwd(), "server", "data", "bible.db");
const DB_URL = process.env.BIBLE_DB_URL ?? "";

export type DbStatus =
  | { available: true; path: string }
  | { available: false; reason: "missing" | "no-url" | "downloading" };

/** Check whether the local database file exists. */
export function dbExists(): boolean {
  try {
    return fs.existsSync(DB_PATH);
  } catch {
    return false;
  }
}

/** Return the current DB availability status without side-effects. */
export function getDbStatus(): DbStatus {
  if (dbExists()) return { available: true, path: DB_PATH };
  if (!DB_URL) return { available: false, reason: "no-url" };
  return { available: false, reason: "missing" };
}

/**
 * Download the database from BIBLE_DB_URL and save it to server/data/bible.db.
 * Resolves when the download is complete, rejects on any error.
 * Safe to call multiple times — skips download if file already exists.
 */
export async function ensureDb(): Promise<void> {
  if (dbExists()) return;

  if (!DB_URL) {
    throw new Error(
      "BIBLE_DB_URL is not set. Cannot download Bible database."
    );
  }

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await downloadFile(DB_URL, DB_PATH);
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith("https://") ? https : http;

    const request = protocol.get(url, (response) => {
      // Follow up to one redirect (GitHub releases redirect to CDN)
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        file.close();
        fs.unlink(dest, () => {});
        downloadFile(response.headers.location as string, dest)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(
          new Error(`Download failed with HTTP ${response.statusCode}: ${url}`)
        );
        return;
      }

      response.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
    });

    request.on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });

    file.on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}
