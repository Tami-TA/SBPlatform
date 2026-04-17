/**
 * GET /api/bible/translations
 * Returns the list of supported Bible translations.
 */

export async function GET() {
  const translations = [
    { id: "KJV", name: "King James Version",          abbreviation: "KJV", available: true },
    { id: "ASV", name: "American Standard Version",   abbreviation: "ASV", available: true },
    { id: "WEB", name: "World English Bible",          abbreviation: "WEB", available: true },
    { id: "YLT", name: "Young's Literal Translation", abbreviation: "YLT", available: true },
    { id: "BBE", name: "Bible in Basic English",       abbreviation: "BBE", available: true },
    { id: "DBY", name: "Darby Translation",            abbreviation: "DBY", available: true },
  ];
  return Response.json({ translations });
}
