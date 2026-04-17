/**
 * GET /api/bible/translations
 *
 * Return the list of Bible translations and whether each is available
 * in the local SQLite database.
 * SERVER-SIDE ONLY — no "use client".
 *
 * Response:
 *   {
 *     "translations": [
 *       { "id": "KJV", "name": "King James Version", "abbreviation": "KJV", "available": true },
 *       ...
 *     ]
 *   }
 */

import { getAllDbTranslations } from "@/lib/bible-db.server";

export const runtime = "nodejs"; // required — better-sqlite3 is a Node.js native module

export async function GET() {
  const translations = getAllDbTranslations();
  return Response.json({ translations });
}
