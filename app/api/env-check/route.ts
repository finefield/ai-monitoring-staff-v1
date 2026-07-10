import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function mask(value: string | undefined) {
  if (!value) {
    return {
      exists: false,
      prefix: "",
      suffix: "",
      length: 0
    };
  }

  return {
    exists: true,
    prefix: value.slice(0, 12),
    suffix: value.slice(-8),
    length: value.length
  };
}

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: mask(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
    LINE_CHANNEL_ACCESS_TOKEN: mask(process.env.LINE_CHANNEL_ACCESS_TOKEN),
    RATE_API_PROVIDER: process.env.RATE_API_PROVIDER || ""
  });
}
