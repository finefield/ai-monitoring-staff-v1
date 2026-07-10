import { AlertSetting } from "./types";

export const DEFAULT_SYMBOL = "HKD/JPY";

export const defaultSetting: AlertSetting = {
  id: "00000000-0000-0000-0000-000000000001",
  symbol: DEFAULT_SYMBOL,
  buyPrice: 19.2,
  sellPrice: 19.8,
  approachWidth: 0.03,
  notifyLineUserId: "",
  isActive: true,
  cooldownMinutes: 30,
  movementAlertEnabled: true,
  movementWindowMinutes: 15,
  movementThreshold: 0.03
};

export const requiredDisclaimer =
  "これは投資助言ではなく、価格通知支援ツールです。楽天銀行FX側のBid/Askとスプレッドを確認してください。";
