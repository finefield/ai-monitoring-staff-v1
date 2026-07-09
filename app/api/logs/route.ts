import { NextResponse } from "next/server";
import { listAlertLogs, listRateLogs } from "@/lib/monitoring/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  const [logs, rateLogs] = await Promise.all([listAlertLogs(), listRateLogs()]);
  return NextResponse.json(
    { logs, rateLogs },
    { headers: { "Cache-Control": "no-store" } }
  );
}
