import { NextResponse } from "next/server";
import {
  listAlertLogs,
  listMonitorLogs,
  listRateLogs
} from "@/lib/monitoring/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  const [logs, rateLogs, monitorLogs] = await Promise.all([
    listAlertLogs(),
    listRateLogs(),
    listMonitorLogs()
  ]);
  return NextResponse.json(
    { logs, rateLogs, monitorLogs },
    { headers: { "Cache-Control": "no-store" } }
  );
}
