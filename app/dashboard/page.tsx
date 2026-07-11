"use client";

import { useEffect, useState } from "react";
import { AlertSetting, Rate } from "@/lib/monitoring/types";

type DashboardData = {
  setting: AlertSetting;
  rate: Rate;
  pendingAlerts: Array<{ alertType: string; targetPrice: number; difference: number }>;
};

type MonitorResult = {
  setting: AlertSetting;
  rate: Rate;
  movementSkipReason?: string | null;
  alerts: Array<{
    alertType: string;
    currentPrice: number;
    targetPrice: number;
    difference: number;
    message: string;
    sendStatus: string;
  }>;
};

function formatTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [monitorResult, setMonitorResult] = useState<MonitorResult | null>(null);

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
    const response = await fetch("/api/monitor", { method: "POST" });
    const result = await response.json();
    setMonitorResult(result);
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
          {running ? "監視中..." : "監視を1回実行"}
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

          {monitorResult && (
            <div className="panel wide">
              <div className="label">監視実行結果</div>
              <div className="small-metric">
                rate_logs 保存: {monitorResult.rate.symbol} Mid{" "}
                {monitorResult.rate.mid.toFixed(4)}
              </div>
              <p className="label">
                取得元: {monitorResult.rate.source} / 取得時刻:{" "}
                {formatTime(monitorResult.rate.fetchedAt)}
              </p>
              {monitorResult.movementSkipReason && (
                <p className="label">
                  短時間変動アラート skipped: {monitorResult.movementSkipReason}
                </p>
              )}

              {monitorResult.alerts.length === 0 ? (
                <div className="empty" style={{ marginTop: 14 }}>
                  alert_logs は作成されませんでした。通知条件に達していません。
                </div>
              ) : (
                <div className="table-wrap" style={{ marginTop: 14 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>通知種別</th>
                        <th>現在値</th>
                        <th>設定価格</th>
                        <th>差分</th>
                        <th>メッセージ</th>
                        <th>送信ステータス</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monitorResult.alerts.map((alert, index) => (
                        <tr key={`${alert.alertType}-${index}`}>
                          <td>{alert.alertType}</td>
                          <td>{alert.currentPrice.toFixed(4)}</td>
                          <td>{alert.targetPrice.toFixed(4)}</td>
                          <td>{alert.difference.toFixed(4)}</td>
                          <td className="message">{alert.message}</td>
                          <td>{alert.sendStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
