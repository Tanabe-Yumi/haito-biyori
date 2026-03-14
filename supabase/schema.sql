-- UUID を有効化
create extension if not exists "uuid-ossp";
-- timestamp の自動更新を有効化
create extension if not exists moddatetime schema extensions;

-- markets テーブル
create table if not exists markets (
  id   integer primary key,
  name text    not null
);

insert into markets (id, name) values
  (1,    '東証プライム'),
  (2,    '東証スタンダード'),
  (3,    '東証グロース'),
  (4,    '名証プレミア'),
  (5,    '名証メイン'),
  (6,    '名証ネクスト'),
  (7,    '札証'),
  (8,    '福証本則'),
  (9,    '福証Q-Board'),
  (10,   '福証Fukuoka PRO Market'),
  (9999, 'その他')
on conflict (id) do nothing;

-- industries テーブル
create table if not exists industries (
  id   integer primary key,
  name text    not null
);

insert into industries (id, name) values
  (1,    '水産・農林業'),
  (2,    '鉱業'),
  (3,    '建設業'),
  (4,    '食料品'),
  (5,    '繊維製品'),
  (6,    'パルプ・紙'),
  (7,    '化学'),
  (8,    '医薬品'),
  (9,    '石油・石炭製品'),
  (10,   'ゴム製品'),
  (11,   'ガラス・土石製品'),
  (12,   '鉄鋼'),
  (13,   '非鉄金属'),
  (14,   '金属製品'),
  (15,   '機械'),
  (16,   '電気機器'),
  (17,   '輸送用機器'),
  (18,   '精密機器'),
  (19,   'その他製品'),
  (20,   '電気・ガス業'),
  (21,   '陸運業'),
  (22,   '海運業'),
  (23,   '空運業'),
  (24,   '倉庫・運輸関連業'),
  (25,   '情報・通信業'),
  (26,   '卸売業'),
  (27,   '小売業'),
  (28,   '銀行業'),
  (29,   '証券、商品先物取引業'),
  (30,   '保険業'),
  (31,   'その他金融業'),
  (32,   '不動産業'),
  (33,   'サービス業'),
  (9999, 'その他')
on conflict (id) do nothing;

-- stocks テーブル
create table if not exists stocks (
  code          text    primary key,
  name          text    not null,
  market        integer references markets(id),
  industry      integer references industries(id),
  price         numeric,
  dividend_yield numeric,
  -- 検索用カラム(code, name カラムから自動作成)
  fts           tsvector generated always as (to_tsvector('simple', code || ' ' || name)) stored,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- 検索インデックスを作成
create index stocks_fts on stocks using gin (fts);

-- financial_history テーブル
create table if not exists financial_history (
  id                     uuid    default uuid_generate_v4() primary key,
  code                   text    references stocks(code) on delete cascade not null,
  year                   integer not null,
  month                  integer not null,
  -- 売上 (百万円)
  sales                  numeric,
  -- 営業利益率 (%)
  operating_profit_margin numeric,
  -- EPS (円)
  earnings_per_share     numeric,
  -- 営業CF (百万円)
  operating_cash_flow    numeric,
  -- 一株配当 (円)
  dividend_per_share     numeric,
  -- 配当性向 (%)
  payout_ratio           numeric,
  -- 自己資本比率 (%)
  equity_ratio           numeric,
  -- 現金等 (百万円)
  cash                   numeric,
  created_at             timestamptz not null default now(),

  -- stock/year/month ごとにユニークなレコードとする
  unique(code, year, month)
);

-- scores テーブル
create table if not exists scores (
  code                    text    primary key references stocks(code) on delete cascade,
  sales                   integer default 0,
  operating_profit_margin integer default 0,
  earnings_per_share      integer default 0,
  operating_cash_flow     integer default 0,
  dividend_per_share      integer default 0,
  payout_ratio            integer default 0,
  equity_ratio            integer default 0,
  cash                    integer default 0,
  total                   integer default 0,
  updated_at              timestamptz not null default now()
);

-- timestamp 自動更新トリガー
create trigger handle_updated_at before update on stocks
  for each row execute procedure moddatetime (updated_at);
create trigger handle_updated_at_scores before update on scores
  for each row execute procedure moddatetime (updated_at);

-- Row Level Security (RLS) を有効化
alter table markets          enable row level security;
alter table industries       enable row level security;
alter table stocks           enable row level security;
alter table financial_history enable row level security;
alter table scores           enable row level security;

-- 誰でも読み取り可能にするポリシーを設定
create policy "Allow public read access on markets"
  on markets for select using (true);
create policy "Allow public read access on industries"
  on industries for select using (true);
create policy "Allow public read access on stocks"
  on stocks for select using (true);
create policy "Allow public read access on financial_history"
  on financial_history for select using (true);
create policy "Allow public read access on scores"
  on scores for select using (true);

-- 認証済み(service_role)、または匿名での insert/update を許可するポリシーを設定
-- 本番環境では、service_role に制限すべき
create policy "Allow anon insert/update for demo"
  on stocks for insert with check (true);
create policy "Allow anon insert/update for demo history"
  on financial_history for insert with check (true);
create policy "Allow service_role insert/update on scores"
  on scores for all using (true);

-- stocks_with_total_score view
create view stocks_with_total_score
  with (security_invoker=on)
  as
select
  stocks.code           as code,
  stocks.name           as name,
  markets.id            as market_id,
  markets.name          as market_name,
  industries.id         as industry_id,
  industries.name       as industry_name,
  stocks.price          as price,
  stocks.dividend_yield as dividend_yield,
  stocks.updated_at     as updated_at,
  stocks.created_at     as created_at,
  scores.total          as total_score,
  stocks.fts            as fts
from stocks
left join markets    on stocks.market   = markets.id
left join industries on stocks.industry = industries.id
inner join scores    on stocks.code     = scores.code;

-- stocks_with_scores view
create view stocks_with_scores
  with (security_invoker=on)
  as
select
  stocks.code                    as code,
  stocks.name                    as name,
  markets.name                   as market,
  industries.name                as industry,
  stocks.price                   as price,
  stocks.dividend_yield          as dividend_yield,
  stocks.updated_at              as updated_at,
  scores.total                   as total_score,
  scores.sales                   as sales_score,
  scores.operating_profit_margin as operating_profit_margin_score,
  scores.earnings_per_share      as earnings_per_share_score,
  scores.operating_cash_flow     as operating_cash_flow_score,
  scores.dividend_per_share      as dividend_per_share_score,
  scores.payout_ratio            as payout_ratio_score,
  scores.equity_ratio            as equity_ratio_score,
  scores.cash                    as cash_score
from stocks
left join markets    on stocks.market   = markets.id
left join industries on stocks.industry = industries.id
inner join scores    on stocks.code     = scores.code;
