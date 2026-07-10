import { NextResponse } from "next/server";
import { DEFAULT_SYMBOL, defaultSetting } from "@/lib/monitoring/config";
import { getAlertSetting, upsertAlertSetting } from "@/lib/monitoring/logger";
import { AlertSetting } from "@/lib/monitoring/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const setting = await getAlertSetting(DEFAULT_SYMBOL);
    return NextResponse.json({ setting });
  } catch (error) {
    return NextResponse.json(
      {
        error: "設定の取得に失敗しました。",
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const setting: AlertSetting = {
      id: body.id || defaultSetting.id,
      symbol: body.symbol || DEFAULT_SYMBOL,
      buyPrice: Number(body.buyPrice),
      sellPrice: Number(body.sellPrice),
      approachWidth: Number(body.approachWidth),
      notifyLineUserId: String(body.notifyLineUserId || ""),
      isActive: Boolean(body.isActive),
      cooldownMinutes: Number(body.cooldownMinutes),
      movementAlertEnabled:
        body.movementAlertEnabled ?? defaultSetting.movementAlertEnabled,
      movementWindowMinutes: Number(
        body.movementWindowMinutes ?? defaultSetting.movementWindowMinutes
      ),
      movementThreshold: Number(
        body.movementThreshold ?? defaultSetting.movementThreshold
      )
    };

    const saved = await upsertAlertSetting(setting);
    return NextResponse.json({ setting: saved });
  } catch (error) {
    console.error("Failed to save settings", error);

    return NextResponse.json(
      {
        error: "設定の保存に失敗しました。",
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
