import { Rate } from "./types";

const JST_TIME_ZONE = "Asia/Tokyo";
const DEFAULT_MAX_RATE_AGE_MINUTES = 60;

type JstDateParts = {
  weekday: number;
  hour: number;
  minute: number;
};

export type MarketGuardResult = {
  canUseRate: boolean;
  marketOpen: boolean;
  rateFresh: boolean;
  reason: string;
  checkedAt: string;
  rateAgeMinutes: number | null;
  maxRateAgeMinutes: number;
};

function getJstDateParts(date: Date): JstDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: JST_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23"
  });
  const parts = formatter.formatToParts(date);
  const weekdayText = parts.find((part) => part.type === "weekday")?.value;
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return {
    weekday: weekdayMap[weekdayText || "Sun"],
    hour: Number(parts.find((part) => part.type === "hour")?.value || 0),
    minute: Number(parts.find((part) => part.type === "minute")?.value || 0)
  };
}

function getMaxRateAgeMinutes() {
  const value = Number(process.env.MARKET_GUARD_MAX_RATE_AGE_MINUTES);

  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_MAX_RATE_AGE_MINUTES;
  }

  return value;
}

export function isFxMarketOpen(date = new Date()): boolean {
  const { weekday, hour, minute } = getJstDateParts(date);
  const minutes = hour * 60 + minute;

  if (weekday === 0) {
    return false;
  }

  if (weekday === 1) {
    return minutes >= 7 * 60;
  }

  if (weekday >= 2 && weekday <= 5) {
    return true;
  }

  if (weekday === 6) {
    return minutes < 6 * 60;
  }

  return false;
}

export function getRateAgeMinutes(rate: Rate, now = new Date()): number | null {
  const fetchedAt = new Date(rate.fetchedAt);

  if (Number.isNaN(fetchedAt.getTime())) {
    return null;
  }

  return Math.max(0, (now.getTime() - fetchedAt.getTime()) / 60_000);
}

export function isRateFresh(
  rate: Rate,
  maxAgeMinutes = getMaxRateAgeMinutes(),
  now = new Date()
): boolean {
  const ageMinutes = getRateAgeMinutes(rate, now);

  return ageMinutes !== null && ageMinutes <= maxAgeMinutes;
}

export function evaluateMarketGuard(
  rate: Rate,
  now = new Date()
): MarketGuardResult {
  const maxRateAgeMinutes = getMaxRateAgeMinutes();
  const marketOpen = isFxMarketOpen(now);
  const rateAgeMinutes = getRateAgeMinutes(rate, now);
  const rateFresh =
    rateAgeMinutes !== null && rateAgeMinutes <= maxRateAgeMinutes;
  const reasons: string[] = [];

  if (!marketOpen) {
    reasons.push("fx_market_closed");
  }

  if (!rateFresh) {
    reasons.push(rateAgeMinutes === null ? "invalid_rate_timestamp" : "stale_rate");
  }

  return {
    canUseRate: marketOpen && rateFresh,
    marketOpen,
    rateFresh,
    reason: reasons.length > 0 ? reasons.join(",") : "ok",
    checkedAt: now.toISOString(),
    rateAgeMinutes:
      rateAgeMinutes === null ? null : Number(rateAgeMinutes.toFixed(2)),
    maxRateAgeMinutes
  };
}
