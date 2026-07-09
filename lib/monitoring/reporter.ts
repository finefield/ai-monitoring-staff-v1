import { SendResult } from "./types";

export async function sendLineMessage(
  to: string,
  message: string
): Promise<SendResult> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!to) {
    return { status: "skipped", detail: "LINE通知先が未設定です。" };
  }

  if (!token) {
    return { status: "mocked", detail: "LINE token is not configured." };
  }

  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to,
        messages: [{ type: "text", text: message }]
      })
    });

    if (!response.ok) {
      return { status: "failed", detail: await response.text() };
    }

    return { status: "sent" };
  } catch (error) {
    return {
      status: "failed",
      detail: error instanceof Error ? error.message : "Unknown LINE error"
    };
  }
}
