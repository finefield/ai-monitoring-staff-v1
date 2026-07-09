"use client";

import { useEffect, useState } from "react";
import { AlertLog, Rate } from "@/lib/monitoring/types";

function formatTime(value: string) {
  return new Date(value).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const [rateLogs, setRateLogs] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/logs", { cache: "no-store" });
    const data = await response.json();
    setLogs(data.logs);
    setRateLogs(data.rateLogs);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Logs</h2>
          <p>通知履歴</p>
        </div>
        <button className="button secondary" onClick={load}>
          更新
        </button>
      </div>

      {loading ? (
        <div className="empty">読み込み中...</div>
      ) : (
        <div className="stack">
          <section>
            <h3 className="section-title">通知履歴</h3>
            {logs.length === 0 ? (
              <div className="empty">通知履歴はまだありません。</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>日時</th>
                      <th>通貨ペア</th>
                      <th>通知種別</th>
                      <th>現在値</th>
                      <th>設定価格</th>
                      <th>差分</th>
                      <th>通知文</th>
                      <th>送信ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr key={`${log.sentAt}-${index}`}>
                        <td>{formatTime(log.sentAt)}</td>
                        <td>{log.symbol}</td>
                        <td>{log.alertType}</td>
                        <td>{log.currentPrice.toFixed(4)}</td>
                        <td>{log.targetPrice.toFixed(4)}</td>
                        <td>{log.difference.toFixed(4)}</td>
                        <td className="message">{log.message}</td>
                        <td>{log.sendStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h3 className="section-title">レート取得履歴</h3>
            {rateLogs.length === 0 ? (
              <div className="empty">レート取得履歴はまだありません。</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>取得時刻</th>
                      <th>通貨ペア</th>
                      <th>Bid</th>
                      <th>Ask</th>
                      <th>Mid</th>
                      <th>取得元</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateLogs.map((rate, index) => (
                      <tr key={`${rate.fetchedAt}-${index}`}>
                        <td>{formatTime(rate.fetchedAt)}</td>
                        <td>{rate.symbol}</td>
                        <td>{rate.bid.toFixed(4)}</td>
                        <td>{rate.ask.toFixed(4)}</td>
                        <td>{rate.mid.toFixed(4)}</td>
                        <td>{rate.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
