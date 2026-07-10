import { NextResponse } from "next/server";
import { runMonitoringStaff } from "@/lib/monitoring/staff";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await runMonitoringStaff();

    return NextResponse.json({
      ok: true,
      ...result,
      executedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Cron monitoring failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Cron monitoring failed",
        detail: error instanceof Error ? error.message : String(error),
        executedAt: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
