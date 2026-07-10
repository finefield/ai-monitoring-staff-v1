import { NextResponse } from "next/server";
import { runMonitoringStaff } from "@/lib/monitoring/staff";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await runMonitoringStaff();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "monitor_failed",
        detail: error instanceof Error ? error.message : "Unknown monitor error"
      },
      { status: 500 }
    );
  }
}
