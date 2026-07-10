import { requiredDisclaimer } from "./config";
import { AlertContext } from "./types";

const alertLabels: Record<AlertContext["alertType"], string> = {
  approach_buy: "買い通知価格に接近",
  hit_buy: "買い通知価格に到達",
  approach_sell: "売り通知価格に接近",
  hit_sell: "売り通知価格に到達",
  movement_up: "短時間上昇",
  movement_down: "短時間下落",
  error: "監視エラー"
};

function fallbackMessage(context: AlertContext): string {
  return [
    `【価格通知】${context.symbol}`,
    `通知種別: ${alertLabels[context.alertType]}`,
    `外部レートMid: ${context.currentPrice.toFixed(4)}`,
    `設定価格: ${context.targetPrice.toFixed(4)}`,
    `差分: ${context.difference.toFixed(4)}`,
    `取得元: ${context.source}`,
    `取得時刻: ${new Date(context.fetchedAt).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo"
    })}`,
    requiredDisclaimer
  ].join("\n");
}

function movementMessage(context: AlertContext): string {
  const windowMinutes = context.comparisonWindowMinutes ?? 15;
  const direction =
    context.alertType === "movement_up" ? "上昇しています。" : "下落しています。";
  const comparisonTime = context.comparisonFetchedAt
    ? new Date(context.comparisonFetchedAt).toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo"
      })
    : "不明";

  return [
    `【短時間変動アラート】${context.symbol}`,
    `${windowMinutes}分前と比較してレートが${direction}`,
    `現在Mid: ${context.currentPrice.toFixed(4)}`,
    `比較元Mid: ${(context.comparisonPrice ?? context.targetPrice).toFixed(4)}`,
    `変動幅: ${context.difference.toFixed(4)}`,
    `比較時間: ${comparisonTime}`,
    `取得元: ${context.source}`,
    `取得時刻: ${new Date(context.fetchedAt).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo"
    })}`,
    requiredDisclaimer
  ].join("\n");
}

export async function generateAlertMessage(
  alertContext: AlertContext
): Promise<string> {
  if (
    alertContext.alertType === "movement_up" ||
    alertContext.alertType === "movement_down"
  ) {
    return movementMessage(alertContext);
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackMessage(alertContext);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You write concise Japanese factual price alert notifications. Do not provide investment advice, trading instructions, predictions, or recommendations. The required disclaimer must appear verbatim."
          },
          {
            role: "user",
            content: JSON.stringify({
              alertContext,
              requiredDisclaimer
            })
          }
        ]
      })
    });

    if (!response.ok) {
      return fallbackMessage(alertContext);
    }

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };
    const text =
      data.output_text ||
      data.output?.flatMap((item) => item.content || []).find((item) => item.text)
        ?.text;

    if (!text || !text.includes(requiredDisclaimer)) {
      return fallbackMessage(alertContext);
    }

    return text;
  } catch {
    return fallbackMessage(alertContext);
  }
}
