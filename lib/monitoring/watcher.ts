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

async function getExternalRate(symbol: string): Promise<Rate> {
  const provider = process.env.RATE_API_PROVIDER || "mock";

  if (provider === "mock") {
    return makeMockRate(symbol);
  }

  // Provider adapters can be added here without changing Judge/Writer/Reporter/Logger.
  // v1 falls back to mock until an external adapter such as OANDA is configured.
  return {
    ...makeMockRate(symbol),
    source: `${provider}:mock-fallback`
  };
}

export async function getCurrentRate(symbol: string): Promise<Rate> {
  return getExternalRate(symbol);
}
