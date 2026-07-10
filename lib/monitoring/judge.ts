import { AlertContext, AlertSetting, Rate } from "./types";

function buildContext(
  rate: Rate,
  setting: AlertSetting,
  alertType: AlertContext["alertType"],
  targetPrice: number
): AlertContext {
  return {
    settingId: setting.id,
    symbol: setting.symbol,
    alertType,
    currentPrice: rate.mid,
    targetPrice,
    difference: Number(Math.abs(rate.mid - targetPrice).toFixed(4)),
    fetchedAt: rate.fetchedAt,
    source: rate.source
  };
}

export function evaluateAlert(
  currentRate: Rate,
  settings: AlertSetting
): AlertContext[] {
  if (!settings.isActive) {
    return [];
  }

  const alerts: AlertContext[] = [];
  const buyDiff = currentRate.mid - settings.buyPrice;
  const sellDiff = settings.sellPrice - currentRate.mid;

  if (currentRate.mid <= settings.buyPrice) {
    alerts.push(buildContext(currentRate, settings, "hit_buy", settings.buyPrice));
  } else if (buyDiff <= settings.approachWidth) {
    alerts.push(
      buildContext(currentRate, settings, "approach_buy", settings.buyPrice)
    );
  }

  if (currentRate.mid >= settings.sellPrice) {
    alerts.push(
      buildContext(currentRate, settings, "hit_sell", settings.sellPrice)
    );
  } else if (sellDiff <= settings.approachWidth) {
    alerts.push(
      buildContext(currentRate, settings, "approach_sell", settings.sellPrice)
    );
  }

  return alerts;
}

export function evaluateMovementAlert(
  currentRate: Rate,
  pastRate: Rate | null,
  settings: AlertSetting
): AlertContext[] {
  if (!settings.isActive || !settings.movementAlertEnabled || !pastRate) {
    return [];
  }

  const movement = Number((currentRate.mid - pastRate.mid).toFixed(6));

  if (Math.abs(movement) < settings.movementThreshold || movement === 0) {
    return [];
  }

  return [
    {
      settingId: settings.id,
      symbol: settings.symbol,
      alertType: movement > 0 ? "movement_up" : "movement_down",
      currentPrice: currentRate.mid,
      targetPrice: pastRate.mid,
      difference: movement,
      fetchedAt: currentRate.fetchedAt,
      source: currentRate.source,
      comparisonPrice: pastRate.mid,
      comparisonFetchedAt: pastRate.fetchedAt,
      comparisonWindowMinutes: settings.movementWindowMinutes
    }
  ];
}
