import { NextResponse } from "next/server";
import { connection } from "next/server";

// connection() is required in Next.js 16 to ensure process.env is read at
// request time rather than bundled (and frozen) at build time.
export async function GET() {
  await connection();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    const missing = [
      !apiKey && "NEXT_PUBLIC_FIREBASE_API_KEY",
      !authDomain && "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      !projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      !storageBucket && "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      !messagingSenderId && "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      !appId && "NEXT_PUBLIC_FIREBASE_APP_ID",
    ].filter(Boolean);
    console.error("Firebase config missing env vars:", missing);
    return NextResponse.json(
      { error: `Firebase configuration incomplete. Missing: ${missing.join(", ")}` },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId },
    { headers: { "Cache-Control": "private, max-age=300" } }
  );
}
