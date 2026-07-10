import { NextResponse } from "next/server";
import { runMonitoringStaff } from "@/lib/monitoring/staff";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return true;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized cron request"
      },
      { status: 401 }
    );
  }

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
