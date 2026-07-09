"use client";

import { useEffect, useState } from "react";
import { AlertSetting, Rate } from "@/lib/monitoring/types";

type DashboardData = {
  setting: AlertSetting;
  rate: Rate;
  pendingAlerts: Array<{ alertType: string; targetPrice: number; difference: number }>;
};

function formatTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/dashboard", { cache: "no-store" });
    setData(await response.json());
    setLoading(false);
  }

  async function toggleActive() {
    if (!data) return;
    const nextSetting = { ...data.setting, isActive: !data.setting.isActive };
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextSetting)
    });
    const saved = await response.json();
    setData({ ...data, setting: saved.setting });
  }

  async function runMonitor() {
    setRunning(true);
    await fetch("/api/monitor", { method: "POST" });
    await load();
    setRunning(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>HKD/JPYの外部レート監視状態</p>
        </div>
        <button className="button" onClick={runMonitor} disabled={running || loading}>
          {running ? "監視中..." : "手動チェック"}
        </button>
      </div>

      {loading || !data ? (
        <div className="empty">読み込み中...</div>
      ) : (
        <div className="grid">
          <div className="panel wide">
            <div className="switch-row">
              <div>
                <div className="label">現在の監視状態</div>
                <div className="small-metric">{data.setting.symbol}</div>
              </div>
              <div className="switch-row">
                <span className={`status ${data.setting.isActive ? "on" : "off"}`}>
                  {data.setting.isActive ? "監視ON" : "監視OFF"}
                </span>
                <button className="button secondary" onClick={toggleActive}>
                  切り替え
                </button>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="label">HKD/JPY 現在値 Mid</div>
            <div className="metric">{data.rate.mid.toFixed(4)}</div>
          </div>
          <div className="panel">
            <div className="label">Bid</div>
            <div className="metric">{data.rate.bid.toFixed(4)}</div>
          </div>
          <div className="panel">
            <div className="label">Ask</div>
            <div className="metric">{data.rate.ask.toFixed(4)}</div>
          </div>

          <div className="panel">
            <div className="label">最終取得時刻</div>
            <div className="small-metric">{formatTime(data.rate.fetchedAt)}</div>
          </div>
          <div className="panel">
            <div className="label">レート取得元</div>
            <div className="small-metric">{data.rate.source}</div>
          </div>
          <div className="panel">
            <div className="label">判定中の通知</div>
            <div className="small-metric">{data.pendingAlerts.length}件</div>
          </div>
        </div>
      )}
    </section>
  );
}
