import { NextResponse } from "next/server";
import { DEFAULT_SYMBOL, requiredDisclaimer } from "@/lib/monitoring/config";
import { getAlertSetting } from "@/lib/monitoring/logger";
import { sendLineMessage } from "@/lib/monitoring/reporter";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST() {
  const setting = await getAlertSetting(DEFAULT_SYMBOL);

  if (!setting.notifyLineUserId) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        error: "LINE通知先IDが設定されていません"
      },
      { status: 400 }
    );
  }

  const message = [
    "【LINE接続テスト】AI Monitoring Staff v1",
    `通知先ID: ${setting.notifyLineUserId}`,
    "このメッセージはLINE Messaging API接続確認用です。",
    requiredDisclaimer
  ].join("\n");

  const result = await sendLineMessage(setting.notifyLineUserId, message);
  const ok = result.status === "sent";

  return NextResponse.json(
    {
      ok,
      status: result.status,
      detail: result.detail || null,
      sentTo: setting.notifyLineUserId,
      message
    },
    { status: ok ? 200 : 400 }
  );
}
