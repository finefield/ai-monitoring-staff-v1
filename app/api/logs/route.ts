import { NextResponse } from "next/server";
import { listAlertLogs } from "@/lib/monitoring/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ logs: await listAlertLogs() });
}
