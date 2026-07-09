import { getSupabaseAdmin } from "@/lib/supabase/server";
import { AlertContext, AlertLog, AlertSetting, Rate } from "./types";
import { defaultSetting } from "./config";

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

  return {
    id: data.id,
    symbol: data.symbol,
    buyPrice: Number(data.buy_price),
    sellPrice: Number(data.sell_price),
    approachWidth: Number(data.approach_width),
    notifyLineUserId: data.notify_line_user_id || "",
    isActive: Boolean(data.is_active),
    cooldownMinutes: Number(data.cooldown_minutes),
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function upsertAlertSetting(
  setting: AlertSetting
): Promise<AlertSetting> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return setting;
  }

  const payload = {
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

  const { data, error } = await supabase
    .from("alert_settings")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    symbol: data.symbol,
    buyPrice: Number(data.buy_price),
    sellPrice: Number(data.sell_price),
    approachWidth: Number(data.approach_width),
    notifyLineUserId: data.notify_line_user_id || "",
    isActive: Boolean(data.is_active),
    cooldownMinutes: Number(data.cooldown_minutes),
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
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
