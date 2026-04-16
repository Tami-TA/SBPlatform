import { NextRequest, NextResponse } from "next/server";
import { getDbStatus, ensureDb } from "@/lib/bible-db.server";

/** GET /api/bible-db-status — return current DB availability. */
export async function GET(_req: NextRequest) {
  const status = getDbStatus();

  if (status.available) {
    return NextResponse.json({
      status: "ready",
      message: "Bible database is connected and ready.",
    });
  }

  if (status.reason === "no-url") {
    return NextResponse.json({
      status: "unavailable",
      message:
        "Bible database not connected yet. Set BIBLE_DB_URL to enable full database access.",
    });
  }

  return NextResponse.json({
    status: "unavailable",
    message:
      "Full Bible database is still being set up. Use POST /api/bible-db-status to trigger download.",
  });
}

/**
 * POST /api/bible-db-status — trigger DB download if not already present.
 * Call this once after deployment when BIBLE_DB_URL is configured.
 */
export async function POST(_req: NextRequest) {
  const status = getDbStatus();

  if (status.available) {
    return NextResponse.json({
      status: "ready",
      message: "Bible database already exists — no download needed.",
    });
  }

  if (status.reason === "no-url") {
    return NextResponse.json(
      {
        status: "error",
        message: "BIBLE_DB_URL environment variable is not set.",
      },
      { status: 400 }
    );
  }

  try {
    await ensureDb();
    return NextResponse.json({
      status: "ready",
      message: "Bible database downloaded successfully.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { status: "error", message: `Download failed: ${message}` },
      { status: 500 }
    );
  }
}
