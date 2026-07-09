import { NextResponse } from "next/server";
import { runMonitoringStaff } from "@/lib/monitoring/staff";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await runMonitoringStaff();
  return NextResponse.json(result);
}
