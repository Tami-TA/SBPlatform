import { NextResponse } from "next/server";
import { getTodaysVerse } from "@/lib/bible-data";

export async function GET() {
  const verse = getTodaysVerse();
  return NextResponse.json({ verse }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
