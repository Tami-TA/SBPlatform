import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const BIBLE_API_BASE = "https://api.scripture.api.bible/v1";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bibleId = searchParams.get("bibleId") || "de4e12af7f28f599-02";
  const path = searchParams.get("path") || "";
  const query = searchParams.get("q");

  const apiKey = process.env.BIBLE_API_KEY || "";

  try {
    let url = `${BIBLE_API_BASE}/bibles/${bibleId}/${path}`;
    if (query) url += `?query=${encodeURIComponent(query)}&limit=20&sort=relevance`;

    const res = await fetch(url, {
      headers: { "api-key": apiKey },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Bible API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch Bible data" },
      { status: 503 }
    );
  }
}
