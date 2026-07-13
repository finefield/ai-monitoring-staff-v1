import { DEFAULT_SYMBOL } from "./config";
import { evaluateAlert, evaluateMovementAlert } from "./judge";
import {
  getAlertSetting,
  getMovementComparisonRate,
  saveAlertLog,
  saveMonitorLog,
  saveRateLog,
  shouldNotify
} from "./logger";
import { evaluateMarketGuard, isRateFresh } from "./marketGuard";
import { sendLineMessage } from "./reporter";
import { getCurrentRate } from "./watcher";
import { generateAlertMessage } from "./writer";
import { AlertLog, MonitorAlertDecision, MovementSkipReason } from "./types";

function getUnsupportedMovementReason(rate: { source: string }) {
  const provider = process.env.RATE_API_PROVIDER || "";

  if (provider === "frankfurter" || rate.source === "frankfurter") {
    return "unsupported_movement_provider" as const;
  }

  return null;
}

export async function runMonitoringStaff(symbol = DEFAULT_SYMBOL) {
  const executedAt = new Date().toISOString();

  try {
    const setting = await getAlertSetting(symbol);
    const rate = await getCurrentRate(symbol);
    await saveRateLog(rate);

    const marketGuard = evaluateMarketGuard(rate);
    let movementSkipReason: MovementSkipReason | null =
      setting.movementAlertEnabled ? getUnsupportedMovementReason(rate) : null;

    if (!marketGuard.canUseRate) {
      await saveMonitorLog({
        symbol,
        executedAt,
        status: "skipped_market_guard",
        rate,
        marketGuard,
        movementSkipReason: setting.movementAlertEnabled
          ? movementSkipReason || (!marketGuard.rateFresh ? "stale_rate" : null)
          : null,
        evaluatedAlerts: [],
        alertLogs: []
      });

      return {
        setting,
        rate,
        alerts: [],
        marketGuard,
        movementSkipReason: setting.movementAlertEnabled
          ? movementSkipReason || (!marketGuard.rateFresh ? "stale_rate" : null)
          : null
      };
    }

    let pastRate = null;

    if (
      setting.movementAlertEnabled &&
      !movementSkipReason &&
      !marketGuard.canEvaluateMovementAlerts
    ) {
      movementSkipReason = "stale_rate";
    }

    if (
      setting.movementAlertEnabled &&
      marketGuard.canEvaluateMovementAlerts &&
      !movementSkipReason
    ) {
      const comparison = await getMovementComparisonRate(
        symbol,
        rate.source,
        setting.movementWindowMinutes
      );
      pastRate = comparison.rate;
      movementSkipReason = comparison.skipReason;
    }

    if (
      setting.movementAlertEnabled &&
      !movementSkipReason &&
      pastRate &&
      !isRateFresh(pastRate)
    ) {
      movementSkipReason = "stale_rate";
      pastRate = null;
    }

    const alertContexts = [
      ...(marketGuard.canEvaluatePriceAlerts ? evaluateAlert(rate, setting) : []),
      ...(!setting.movementAlertEnabled || movementSkipReason
        ? []
        : evaluateMovementAlert(rate, pastRate, setting))
    ];
    const alertLogs: AlertLog[] = [];
    const evaluatedAlerts: MonitorAlertDecision[] = [];

    for (const alertContext of alertContexts) {
      const allowed = await shouldNotify(
        alertContext.settingId,
        alertContext.alertType,
        setting.cooldownMinutes
      );

      if (!allowed) {
        evaluatedAlerts.push({
          alertType: alertContext.alertType,
          currentPrice: alertContext.currentPrice,
          targetPrice: alertContext.targetPrice,
          difference: alertContext.difference,
          notifyAllowed: false,
          sendStatus: "skipped_cooldown"
        });
        continue;
      }

      const message = await generateAlertMessage(alertContext);
      const sendResult = await sendLineMessage(setting.notifyLineUserId, message);
      const loggedMessage =
        sendResult.status === "error" && sendResult.detail
          ? `${message}\n\nLINE送信エラー: ${sendResult.detail}`
          : message;
      const alertLog: AlertLog = {
        ...alertContext,
        message: loggedMessage,
        sentTo: setting.notifyLineUserId,
        sentAt: new Date().toISOString(),
        sendStatus: sendResult.status
      };

      await saveAlertLog(alertLog);
      alertLogs.push(alertLog);
      evaluatedAlerts.push({
        alertType: alertContext.alertType,
        currentPrice: alertContext.currentPrice,
        targetPrice: alertContext.targetPrice,
        difference: alertContext.difference,
        notifyAllowed: true,
        sendStatus: sendResult.status
      });
    }

    await saveMonitorLog({
      symbol,
      executedAt,
      status: "completed",
      rate,
      marketGuard,
      evaluatedAlerts,
      movementSkipReason,
      alertLogs
    });

    return {
      setting,
      rate,
      alerts: alertLogs,
      marketGuard,
      movementSkipReason
    };
  } catch (error) {
    await saveMonitorLog({
      symbol,
      executedAt,
      status: "error",
      rate: null,
      marketGuard: null,
      evaluatedAlerts: [],
      movementSkipReason: null,
      alertLogs: [],
      error: error instanceof Error ? error.message : String(error)
    });

    throw error;
  }
}
