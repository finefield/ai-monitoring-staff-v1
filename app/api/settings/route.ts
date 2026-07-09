import { NextResponse } from "next/server";
import { DEFAULT_SYMBOL, defaultSetting } from "@/lib/monitoring/config";
import { getAlertSetting, upsertAlertSetting } from "@/lib/monitoring/logger";
import { AlertSetting } from "@/lib/monitoring/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const setting = await getAlertSetting(DEFAULT_SYMBOL);
  return NextResponse.json({ setting });
}

export async function POST(request: Request) {
  const body = await request.json();
  const setting: AlertSetting = {
    id: body.id || defaultSetting.id,
    symbol: body.symbol || DEFAULT_SYMBOL,
    buyPrice: Number(body.buyPrice),
    sellPrice: Number(body.sellPrice),
    approachWidth: Number(body.approachWidth),
    notifyLineUserId: String(body.notifyLineUserId || ""),
    isActive: Boolean(body.isActive),
    cooldownMinutes: Number(body.cooldownMinutes)
  };

  const saved = await upsertAlertSetting(setting);
  return NextResponse.json({ setting: saved });
}
