"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertSetting } from "@/lib/monitoring/types";

export default function SettingsPage() {
  const [setting, setSetting] = useState<AlertSetting | null>(null);
  const [saved, setSaved] = useState(false);
  const [testSaved, setTestSaved] = useState(false);
  const [lineTesting, setLineTesting] = useState(false);
  const [lineTestResult, setLineTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setSetting(data.setting));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!setting) return;

    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(setting)
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      alert(data.error || data.detail || "設定の保存に失敗しました。");
      return;
    }

    setSetting(data.setting);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  function update<K extends keyof AlertSetting>(key: K, value: AlertSetting[K]) {
    if (!setting) return;
    setSetting({ ...setting, [key]: value });
  }

  async function applyTestSetting() {
    if (!setting) return;

    const testSetting: AlertSetting = {
      ...setting,
      buyPrice: 19.45,
      sellPrice: 19.49,
      approachWidth: 0.05,
      isActive: true,
      cooldownMinutes: 0
    };

    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testSetting)
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      alert(data.error || data.detail || "テスト用設定への変更に失敗しました。");
      return;
    }

    setSetting(data.setting);
    setTestSaved(true);
    setTimeout(() => setTestSaved(false), 3000);
  }

  async function sendLineTest() {
    setLineTesting(true);
    setLineTestResult(null);

    try {
      const response = await fetch("/api/line/test", { method: "POST" });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        setLineTestResult(
          data.error || data.detail || "LINEテスト送信に失敗しました。"
        );
      } else {
        setLineTestResult("LINEテスト送信に成功しました。");
      }
    } catch {
      setLineTestResult("LINEテスト送信に失敗しました。");
    } finally {
      setLineTesting(false);
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p>通知価格、LINE通知先、クールダウンを設定</p>
        </div>
      </div>

      {!setting ? (
        <div className="empty">読み込み中...</div>
      ) : (
        <form className="panel" onSubmit={onSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>買い通知価格</label>
              <input
                type="number"
                step="0.0001"
                value={setting.buyPrice}
                onChange={(event) => update("buyPrice", Number(event.target.value))}
              />
            </div>
            <div className="field">
              <label>売り通知価格</label>
              <input
                type="number"
                step="0.0001"
                value={setting.sellPrice}
                onChange={(event) => update("sellPrice", Number(event.target.value))}
              />
            </div>
            <div className="field">
              <label>接近通知幅</label>
              <input
                type="number"
                step="0.0001"
                value={setting.approachWidth}
                onChange={(event) =>
                  update("approachWidth", Number(event.target.value))
                }
              />
            </div>
            <div className="field">
              <label>クールダウン時間（分）</label>
              <input
                type="number"
                min="0"
                step="1"
                value={setting.cooldownMinutes}
                onChange={(event) =>
                  update("cooldownMinutes", Number(event.target.value))
                }
              />
            </div>
            <div className="field">
              <label>LINE通知先</label>
              <input
                value={setting.notifyLineUserId}
                placeholder="LINE userId"
                onChange={(event) =>
                  update("notifyLineUserId", event.target.value)
                }
              />
              <button
                type="button"
                className="button secondary"
                onClick={sendLineTest}
                disabled={lineTesting}
              >
                {lineTesting ? "送信中..." : "LINEテスト送信"}
              </button>
              {lineTestResult && <p className="label">{lineTestResult}</p>}
            </div>
            <div className="field">
              <label>監視ON/OFF</label>
              <div className="switch-row">
                <span className={`status ${setting.isActive ? "on" : "off"}`}>
                  {setting.isActive ? "監視ON" : "監視OFF"}
                </span>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => update("isActive", !setting.isActive)}
                >
                  切り替え
                </button>
              </div>
            </div>
          </div>

          <div className="switch-row" style={{ marginTop: 22 }}>
            <p className="label">
              通知文には楽天銀行FX側のBid/Askとスプレッド確認文が必ず入ります。
            </p>
            <div className="switch-row">
              <button
                className="button secondary"
                type="button"
                onClick={applyTestSetting}
              >
                テスト用設定に変更
              </button>
              <button className="button" type="submit">
                保存
              </button>
            </div>
          </div>
          {saved && <p className="label">保存しました。</p>}
          {testSaved && (
            <p className="label">
              テスト用設定を保存しました。Dashboardで監視を1回実行してください。
            </p>
          )}
        </form>
      )}
    </section>
  );
}
