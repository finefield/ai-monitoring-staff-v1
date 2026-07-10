import { getSupabaseAdmin } from "@/lib/supabase/server";
import { AlertContext, AlertLog, AlertSetting, Rate } from "./types";
import { defaultSetting } from "./config";

type AlertSettingRow = {
  id: string;
  symbol: string;
  buy_price: number | string;
  sell_price: number | string;
  approach_width: number | string;
  notify_line_user_id?: string | null;
  is_active: boolean;
  cooldown_minutes: number | string;
  movement_alert_enabled?: boolean | null;
  movement_window_minutes?: number | string | null;
  movement_threshold?: number | string | null;
  created_at?: string;
  updated_at?: string;
};

function toAlertSetting(row: AlertSettingRow): AlertSetting {
  return {
    id: row.id,
    symbol: row.symbol,
    buyPrice: Number(row.buy_price),
    sellPrice: Number(row.sell_price),
    approachWidth: Number(row.approach_width),
    notifyLineUserId: row.notify_line_user_id || "",
    isActive: Boolean(row.is_active),
    cooldownMinutes: Number(row.cooldown_minutes),
    movementAlertEnabled:
      row.movement_alert_enabled ?? defaultSetting.movementAlertEnabled,
    movementWindowMinutes: Number(
      row.movement_window_minutes ?? defaultSetting.movementWindowMinutes
    ),
    movementThreshold: Number(
      row.movement_threshold ?? defaultSetting.movementThreshold
    ),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getAlertSetting(
  symbol = defaultSetting.symbol
): Promise<AlertSetting> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return defaultSetting;
  }

  const { data, error } = await supabase
    .from("alert_settings")
    .select("*")
    .eq("symbol", symbol)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return defaultSetting;
  }

  return toAlertSetting(data);
}

export async function upsertAlertSetting(
  setting: AlertSetting
): Promise<AlertSetting> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return setting;
  }

  const basePayload = {
    id: setting.id,
    symbol: setting.symbol,
    buy_price: setting.buyPrice,
    sell_price: setting.sellPrice,
    approach_width: setting.approachWidth,
    notify_line_user_id: setting.notifyLineUserId,
    is_active: setting.isActive,
    cooldown_minutes: setting.cooldownMinutes,
    updated_at: new Date().toISOString()
  };
  const payload = {
    ...basePayload,
    movement_alert_enabled: setting.movementAlertEnabled,
    movement_window_minutes: setting.movementWindowMinutes,
    movement_threshold: setting.movementThreshold
  };

  let { data, error } = await supabase
    .from("alert_settings")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error && error.message.toLowerCase().includes("movement_")) {
    const retry = await supabase
      .from("alert_settings")
      .upsert(basePayload, { onConflict: "id" })
      .select("*")
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return toAlertSetting(data);
}

export async function saveRateLog(rate: Rate): Promise<void> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  await supabase.from("rate_logs").insert({
    symbol: rate.symbol,
    bid: rate.bid,
    ask: rate.ask,
    mid: rate.mid,
    source: rate.source,
    fetched_at: rate.fetchedAt
  });
}

export async function getPastRate(
  symbol: string,
  minutesAgo: number
): Promise<Rate | null> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  const cutoff = new Date(Date.now() - minutesAgo * 60_000).toISOString();
  const { data, error } = await supabase
    .from("rate_logs")
    .select("*")
    .eq("symbol", symbol)
    .lte("fetched_at", cutoff)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    symbol: data.symbol,
    bid: Number(data.bid),
    ask: Number(data.ask),
    mid: Number(data.mid),
    source: data.source,
    fetchedAt: data.fetched_at
  };
}

export async function saveAlertLog(alert: AlertLog): Promise<void> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return;
  }

  await supabase.from("alert_logs").insert({
    setting_id: alert.settingId,
    symbol: alert.symbol,
    alert_type: alert.alertType,
    current_price: alert.currentPrice,
    target_price: alert.targetPrice,
    difference: alert.difference,
    message: alert.message,
    sent_to: alert.sentTo,
    sent_at: alert.sentAt,
    send_status: alert.sendStatus
  });
}

export async function shouldNotify(
  settingId: string,
  alertType: AlertContext["alertType"],
  cooldownMinutes: number
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return true;
  }

  const since = new Date(Date.now() - cooldownMinutes * 60_000).toISOString();
  const { data, error } = await supabase
    .from("alert_logs")
    .select("id")
    .eq("setting_id", settingId)
    .eq("alert_type", alertType)
    .gte("sent_at", since)
    .limit(1);

  if (error) {
    return true;
  }

  return data.length === 0;
}

export async function listAlertLogs(): Promise<AlertLog[]> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("alert_logs")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    settingId: row.setting_id,
    symbol: row.symbol,
    alertType: row.alert_type,
    currentPrice: Number(row.current_price),
    targetPrice: Number(row.target_price),
    difference: Number(row.difference),
    fetchedAt: row.sent_at,
    source: "alert_logs",
    message: row.message,
    sentTo: row.sent_to,
    sentAt: row.sent_at,
    sendStatus: row.send_status || "unknown"
  }));
}

export async function listRateLogs(): Promise<Rate[]> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("rate_logs")
    .select("*")
    .order("fetched_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    symbol: row.symbol,
    bid: Number(row.bid),
    ask: Number(row.ask),
    mid: Number(row.mid),
    source: row.source,
    fetchedAt: row.fetched_at
  }));
}
