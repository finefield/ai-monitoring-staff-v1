# AI Monitoring Staff v1

Next.js App Router + Supabaseで作る、楽天銀行FXの手動売買ユーザー向けHKD/JPY価格通知支援ツールです。

このアプリは外部レートを監視し、設定価格に近づいた／到達したという事実をLINEに通知します。自動売買機能、売買発注、投資助言、売買指示は含みません。

## 現在の実装内容

- Next.js App Router + TypeScript
- Supabase Service Role Keyを使ったサーバー側DBアクセス
- HKD/JPYのモックレート取得
- 設定価格への接近／到達判定
- 15分前などの過去レートと比較する短時間変動幅アラート
- LINE Messaging APIのpush通知関数
- OpenAI APIを使った通知文生成
- OpenAI API未設定時の固定テンプレート通知文生成
- Supabaseへのレートログ、通知ログ保存
- 通知クールダウン判定
- `/dashboard`, `/settings`, `/logs` の業務用ダッシュボードUI
- 将来の外部レートAPI差し替えを想定した`RATE_API_PROVIDER`構成

## 重要な注意

- これは投資助言ではなく、価格通知支援ツールです。
- 自動売買機能は実装していません。
- 通知は「設定価格に近づいた／到達した」という事実通知に限定しています。
- 外部レートと楽天銀行FXの実レートには差が出る可能性があります。
- 通知文には必ず「楽天銀行FX側のBid/Askとスプレッドを確認してください」を含めます。
- 楽天銀行FXへのログイン、注文、発注、建玉操作、決済操作を行うコードはありません。

## 構成

| 役割 | ファイル | 主な関数 |
| --- | --- | --- |
| Watcher | `lib/monitoring/watcher.ts` | `getCurrentRate(symbol)` |
| Judge | `lib/monitoring/judge.ts` | `evaluateAlert(currentRate, settings)`, `evaluateMovementAlert(currentRate, pastRate, settings)` |
| Writer | `lib/monitoring/writer.ts` | `generateAlertMessage(alertContext)` |
| Reporter | `lib/monitoring/reporter.ts` | `sendLineMessage(to, message)` |
| Logger | `lib/monitoring/logger.ts` | `saveRateLog(rate)`, `getPastRate(symbol, minutesAgo)`, `saveAlertLog(alert)`, `shouldNotify(settingId, alertType, cooldownMinutes)` |

`lib/monitoring/staff.ts`の`runMonitoringStaff()`が上記5つをつなぎ、監視1回分を実行します。

## ページ

- `/dashboard`
  - 現在の監視状態、HKD/JPY現在値、Bid、Ask、Mid、最終取得時刻、監視ON/OFF
- `/settings`
  - 買い通知価格、売り通知価格、接近通知幅、短時間変動アラート、LINE通知先、クールダウン時間
- `/logs`
  - 通知履歴、通知種別、現在値、設定価格、差分、通知文、送信ステータス

## セットアップ

```bash
npm install
cp .env.example .env.local
```

`.env.local`を設定します。

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
LINE_CHANNEL_ACCESS_TOKEN=
OPENAI_API_KEY=
RATE_API_KEY=
RATE_API_PROVIDER=mock
```

秘密情報を含む`.env.local`や`.env`はコミットしないでください。`.gitignore`で除外しています。

SupabaseのSQL Editorで以下を実行してください。

```bash
supabase/schema.sql
```

開発サーバーを起動します。

```bash
npm run dev
```

ブラウザで以下を開きます。

```text
http://localhost:3000/dashboard
```

## モック動作

Supabase環境変数が未設定でも、`/dashboard`と`/settings`はデフォルト設定とモックレートで表示できます。この場合、ログはDBに保存されません。

LINE tokenが未設定の場合、通知送信は`skipped_no_line_token`として扱われ、通知ログには文面が保存されます。

OpenAI API keyが未設定の場合、Writerは固定テンプレートで通知文を生成します。

## LINE接続手順

1. LINE DevelopersでMessaging APIチャネルを作成します。
2. Messaging APIチャネルのChannel access tokenを発行します。
3. `.env.local`に以下を設定します。

```bash
LINE_CHANNEL_ACCESS_TOKEN=発行したChannel access token
```

4. `/settings`を開き、`LINE通知先`に通知先のLINE userIdを登録して保存します。
5. `/settings`の`LINEテスト送信`を実行します。
6. 成功すると、登録した通知先へ接続テストメッセージが届きます。

`.env.local`はGitHubにコミットしないでください。`.gitignore`で除外しています。

## 監視実行

v1では`/dashboard`の「監視を1回実行」ボタン、または以下のAPIで監視を実行できます。

```bash
curl -X POST http://localhost:3000/api/monitor
```

定期実行する場合は、Vercel Cronや外部cronから`POST /api/monitor`を呼び出してください。

Vercel Cronを使う場合は、`vercel.json`で`/api/cron`を15分ごとにGET実行します。

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

`/api/cron`は既存の監視処理を呼び出し、成功時は`ok: true`、失敗時は`ok: false`のJSONを返します。

## 短時間変動幅アラート

短時間変動幅アラートは、現在のHKD/JPY Midと、指定分数前の`rate_logs`に保存されたMidを比較します。差分の絶対値がしきい値以上の場合、`movement_up`または`movement_down`としてLINE通知と`alert_logs`保存を行います。

デフォルト設定:

- 短時間変動アラート: ON
- 比較時間: 15分
- 変動幅しきい値: 0.0300

`/settings`で以下を設定できます。

- 短時間変動アラート ON/OFF
- 比較時間（分）
- 変動幅しきい値

このアラートも既存のクールダウン対象です。同じ`alert_type`はクールダウン時間内に再通知されません。

## 外部レートAPIへの差し替え

`lib/monitoring/watcher.ts`の`getExternalRate`にプロバイダー別アダプターを追加します。

想定例:

- `RATE_API_PROVIDER=mock`
- `RATE_API_PROVIDER=frankfurter`
- `RATE_API_KEY=...`

`RATE_API_PROVIDER=frankfurter`の場合、Frankfurter APIからHKD/JPYの日次レートを取得します。

```text
https://api.frankfurter.dev/v1/latest?base=HKD&symbols=JPY
```

FrankfurterはリアルタイムFX取引用ではなく、中央銀行由来の日次レートです。楽天銀行FXの実レートとは差が出る可能性があるため、通知文に従って楽天銀行FX側のBid/Askとスプレッドを確認してください。

差し替え時も`getCurrentRate(symbol)`の戻り値は以下の形に揃えてください。

```ts
{
  symbol: "HKD/JPY",
  bid: 19.491,
  ask: 19.509,
  mid: 19.5,
  source: "frankfurter",
  fetchedAt: "2026-07-09T00:00:00.000Z"
}
```

## alert_type

- `approach_buy`
- `hit_buy`
- `approach_sell`
- `hit_sell`
- `movement_up`
- `movement_down`
- `error`

## Supabaseテーブル

SQLは`supabase/schema.sql`にあります。

- `alert_settings`
- `rate_logs`
- `alert_logs`

`alert_logs`には画面表示用に`send_status`も追加しています。

### 既存DBに短時間変動幅アラートを追加するSQL

すでにSupabaseにテーブルを作成済みの場合は、SQL Editorで以下を実行してください。

```sql
alter table public.alert_settings
  add column if not exists movement_alert_enabled boolean not null default true,
  add column if not exists movement_window_minutes integer not null default 15,
  add column if not exists movement_threshold numeric(12, 6) not null default 0.030000;
```

`alert_logs.alert_type`のcheck制約には`movement_up`と`movement_down`を追加する必要があります。`schema.sql`では無名のinline checkとして作成しているため、多くのSupabase/PostgreSQL環境では制約名が`alert_logs_alert_type_check`になります。異なる可能性がある場合は、先に以下で制約名を確認してください。

```sql
select conname
from pg_constraint
where conrelid = 'public.alert_logs'::regclass
  and contype = 'c';
```

制約名が`alert_logs_alert_type_check`の場合は、以下を実行します。名前が違う場合は、`drop constraint`と`add constraint`の制約名を実DBの名前に合わせてください。

```sql
alter table public.alert_logs
  drop constraint if exists alert_logs_alert_type_check;

alter table public.alert_logs
  add constraint alert_logs_alert_type_check
  check (
    alert_type in (
      'approach_buy',
      'hit_buy',
      'approach_sell',
      'hit_sell',
      'movement_up',
      'movement_down',
      'error'
    )
  );
```

## GitHubへ保存する前の確認

```bash
npm run lint
npm run build
git status
```

コミット前に、`.env.local`、APIキー、Supabase Service Role Key、LINE Channel Access Token、OpenAI API Key、外部レートAPI Keyが含まれていないことを確認してください。
