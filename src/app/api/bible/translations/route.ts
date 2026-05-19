/**
 * GET /api/bible/translations
 * Returns the three translations the scripture.api.bible key has access to.
 */

export const runtime = "edge";

export async function GET() {
  const translations = [
    { id: "KJV", name: "King James Version",       abbreviation: "KJV", available: true },
    { id: "NIV", name: "New International Version", abbreviation: "NIV", available: true },
    { id: "AMP", name: "Amplified Bible",           abbreviation: "AMP", available: true },
  ];
  return Response.json({ translations });
}
