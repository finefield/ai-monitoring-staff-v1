import { SendResult } from "./types";

export async function sendLineMessage(
  to: string,
  message: string
): Promise<SendResult> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!token) {
    return {
      status: "skipped_no_line_token",
      detail: "LINE token is not configured."
    };
  }

  if (!to) {
    return { status: "skipped", detail: "LINE通知先が未設定です。" };
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
      return { status: "error", detail: await response.text() };
    }

    return { status: "sent" };
  } catch (error) {
    return {
      status: "error",
      detail: error instanceof Error ? error.message : "Unknown LINE error"
    };
  }
}
