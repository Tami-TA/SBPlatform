// Demo mode: active when Firebase credentials are not configured
export const IS_DEMO_MODE =
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "placeholder-api-key" ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY.startsWith("placeholder");
