import { DEFAULT_SYMBOL } from "./config";
import { evaluateAlert, evaluateMovementAlert } from "./judge";
import {
  getAlertSetting,
  getPastRate,
  saveAlertLog,
  saveRateLog,
  shouldNotify
} from "./logger";
import { sendLineMessage } from "./reporter";
import { getCurrentRate } from "./watcher";
import { generateAlertMessage } from "./writer";
import { AlertLog } from "./types";

export async function runMonitoringStaff(symbol = DEFAULT_SYMBOL) {
  const setting = await getAlertSetting(symbol);
  const rate = await getCurrentRate(symbol);
  await saveRateLog(rate);

  const pastRate = await getPastRate(symbol, setting.movementWindowMinutes);
  const alertContexts = [
    ...evaluateAlert(rate, setting),
    ...evaluateMovementAlert(rate, pastRate, setting)
  ];
  const alertLogs: AlertLog[] = [];

  for (const alertContext of alertContexts) {
    const allowed = await shouldNotify(
      alertContext.settingId,
      alertContext.alertType,
      setting.cooldownMinutes
    );

    if (!allowed) {
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
  }

  return {
    setting,
    rate,
    alerts: alertLogs
  };
}
