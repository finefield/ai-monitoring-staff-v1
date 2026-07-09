"use client";

import { useEffect, useState } from "react";
import { AlertLog } from "@/lib/monitoring/types";

function formatTime(value: string) {
  return new Date(value).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/logs", { cache: "no-store" });
    const data = await response.json();
    setLogs(data.logs);
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
      ) : logs.length === 0 ? (
        <div className="empty">
          通知履歴はまだありません。Supabase未設定時は履歴保存されません。
        </div>
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
  );
}
