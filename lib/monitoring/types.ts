export type AlertType =
  | "approach_buy"
  | "hit_buy"
  | "approach_sell"
  | "hit_sell"
  | "movement_up"
  | "movement_down"
  | "error";

export type Rate = {
  symbol: string;
  bid: number;
  ask: number;
  mid: number;
  source: string;
  fetchedAt: string;
};

export type AlertSetting = {
  id: string;
  symbol: string;
  buyPrice: number;
  sellPrice: number;
  approachWidth: number;
  notifyLineUserId: string;
  isActive: boolean;
  cooldownMinutes: number;
  movementAlertEnabled: boolean;
  movementWindowMinutes: number;
  movementThreshold: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AlertContext = {
  settingId: string;
  symbol: string;
  alertType: AlertType;
  currentPrice: number;
  targetPrice: number;
  difference: number;
  fetchedAt: string;
  source: string;
  comparisonPrice?: number;
  comparisonFetchedAt?: string;
  comparisonWindowMinutes?: number;
};

export type AlertLog = AlertContext & {
  message: string;
  sentTo: string;
  sentAt: string;
  sendStatus: string;
};

export type SendResult = {
  status: "sent" | "skipped" | "skipped_no_line_token" | "error";
  detail?: string;
};
