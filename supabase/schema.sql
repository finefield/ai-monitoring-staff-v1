create extension if not exists pgcrypto;

create table if not exists public.alert_settings (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  buy_price numeric(12, 6) not null,
  sell_price numeric(12, 6) not null,
  approach_width numeric(12, 6) not null default 0.03,
  notify_line_user_id text,
  is_active boolean not null default true,
  cooldown_minutes integer not null default 30,
  movement_alert_enabled boolean not null default true,
  movement_window_minutes integer not null default 15,
  movement_threshold numeric(12, 6) not null default 0.030000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rate_logs (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  bid numeric(12, 6) not null,
  ask numeric(12, 6) not null,
  mid numeric(12, 6) not null,
  source text not null,
  fetched_at timestamptz not null
);

create table if not exists public.alert_logs (
  id uuid primary key default gen_random_uuid(),
  setting_id uuid references public.alert_settings(id) on delete set null,
  symbol text not null,
  alert_type text not null check (
    alert_type in (
      'approach_buy',
      'hit_buy',
      'approach_sell',
      'hit_sell',
      'movement_up',
      'movement_down',
      'error'
    )
  ),
  current_price numeric(12, 6) not null,
  target_price numeric(12, 6) not null,
  difference numeric(12, 6) not null,
  message text not null,
  sent_to text,
  sent_at timestamptz not null default now(),
  send_status text not null default 'unknown'
);

create index if not exists alert_settings_symbol_idx
  on public.alert_settings(symbol);

create index if not exists rate_logs_symbol_fetched_at_idx
  on public.rate_logs(symbol, fetched_at desc);

create index if not exists alert_logs_setting_type_sent_at_idx
  on public.alert_logs(setting_id, alert_type, sent_at desc);

insert into public.alert_settings (
  id,
  symbol,
  buy_price,
  sell_price,
  approach_width,
  notify_line_user_id,
  is_active,
  cooldown_minutes,
  movement_alert_enabled,
  movement_window_minutes,
  movement_threshold
)
values (
  '00000000-0000-0000-0000-000000000001',
  'HKD/JPY',
  19.2,
  19.8,
  0.03,
  '',
  true,
  30,
  true,
  15,
  0.030000
)
on conflict (id) do nothing;
