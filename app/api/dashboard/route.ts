import { NextResponse } from "next/server";
import { DEFAULT_SYMBOL } from "@/lib/monitoring/config";
import { evaluateAlert } from "@/lib/monitoring/judge";
import { getAlertSetting, saveRateLog } from "@/lib/monitoring/logger";
import { getCurrentRate } from "@/lib/monitoring/watcher";

export const dynamic = "force-dynamic";

export async function GET() {
  const setting = await getAlertSetting(DEFAULT_SYMBOL);
  const rate = await getCurrentRate(DEFAULT_SYMBOL);
  await saveRateLog(rate);

  return NextResponse.json({
    setting,
    rate,
    pendingAlerts: evaluateAlert(rate, setting)
  });
}
