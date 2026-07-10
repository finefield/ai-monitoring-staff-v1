import { Rate } from "./types";

function makeMockRate(symbol: string): Rate {
  const now = new Date();
  const minuteSeed = Math.floor(now.getTime() / 60_000);
  const wave = Math.sin(minuteSeed / 7) * 0.045;
  const mid = Number((19.5 + wave).toFixed(4));
  const spread = 0.018;

  return {
    symbol,
    bid: Number((mid - spread / 2).toFixed(4)),
    ask: Number((mid + spread / 2).toFixed(4)),
    mid,
    source: "mock",
    fetchedAt: now.toISOString()
  };
}

async function getFrankfurterRate(symbol: string): Promise<Rate> {
  if (symbol !== "HKD/JPY") {
    throw new Error(`Frankfurter provider does not support symbol: ${symbol}`);
  }

  const response = await fetch(
    "https://api.frankfurter.dev/v1/latest?base=HKD&symbols=JPY",
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Frankfurter API error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    date?: string;
    rates?: { JPY?: number };
  };
  const mid = data.rates?.JPY;

  if (typeof mid !== "number") {
    throw new Error("Frankfurter API response does not include rates.JPY");
  }

  const fetchedAt = data.date ? new Date(data.date).toISOString() : new Date().toISOString();

  return {
    symbol,
    bid: Number((mid - 0.009).toFixed(4)),
    ask: Number((mid + 0.009).toFixed(4)),
    mid: Number(mid.toFixed(4)),
    source: "frankfurter",
    fetchedAt
  };
}

async function getExternalRate(symbol: string): Promise<Rate> {
  const provider = process.env.RATE_API_PROVIDER || "mock";

  if (provider === "mock") {
    return makeMockRate(symbol);
  }

  if (provider === "frankfurter") {
    return getFrankfurterRate(symbol);
  }

  throw new Error(`Unsupported RATE_API_PROVIDER: ${provider}`);
}

export async function getCurrentRate(symbol: string): Promise<Rate> {
  return getExternalRate(symbol);
}
