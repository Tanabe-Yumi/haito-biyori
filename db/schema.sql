-- SQLite スキーマ定義
-- 初期化: npx tsx scripts/init_db.ts

-- 外部キー制約を有効化 (接続ごとに必要。アプリ側でも PRAGMA を発行する)
pragma foreign_keys = on;

-- markets テーブル
create table if not exists markets (
  id   integer primary key,
  name text    not null
);

insert or ignore into markets (id, name) values
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
  (9999, 'その他');

-- industries テーブル
create table if not exists industries (
  id   integer primary key,
  name text    not null
);

insert or ignore into industries (id, name) values
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
  (9999, 'その他');

-- stocks テーブル
-- 検索は code/name への like で行うため、Postgres 時代の fts カラムは廃止
create table if not exists stocks (
  code           text    primary key,
  name           text    not null,
  market         integer references markets(id),
  industry       integer references industries(id),
  price          real,
  dividend_yield real,
  updated_at     text    not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_at     text    not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- financial_history テーブル
create table if not exists financial_history (
  id                      text    primary key default (lower(hex(randomblob(16)))),
  code                    text    not null references stocks(code) on delete cascade,
  year                    integer not null,
  month                   integer not null,
  -- 売上 (百万円)
  sales                   real,
  -- 営業利益 (百万円)
  operating_profit        real,
  -- 営業利益率 (%)
  operating_profit_margin real,
  -- EPS (円)
  earnings_per_share      real,
  -- 営業CF (百万円)
  operating_cash_flow     real,
  -- 一株配当 (円)
  dividend_per_share      real,
  -- 配当性向 (%)
  payout_ratio            real,
  -- 自己資本比率 (%)
  equity_ratio            real,
  -- 現金等 (百万円)
  cash                    real,
  created_at              text    not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  -- code/year/month ごとにユニークなレコードとする
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
  updated_at              text    not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- portfolio_items テーブル (ポートフォリオの保有予定銘柄)
create table if not exists portfolio_items (
  code       text    primary key references stocks(code) on delete cascade,
  -- 保有予定株数 (1株単位)
  shares     integer not null default 1 check (shares >= 0),
  created_at text    not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- timestamp 自動更新トリガー
create trigger if not exists handle_updated_at
  after update on stocks
  for each row
begin
  update stocks
    set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    where code = old.code;
end;

create trigger if not exists handle_updated_at_scores
  after update on scores
  for each row
begin
  update scores
    set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    where code = old.code;
end;

-- stocks_with_total_score view
create view if not exists stocks_with_total_score as
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
  scores.total          as total_score
from stocks
left join markets    on stocks.market   = markets.id
left join industries on stocks.industry = industries.id
inner join scores    on stocks.code     = scores.code;

-- stocks_with_scores view
create view if not exists stocks_with_scores as
select
  stocks.code                    as code,
  stocks.name                    as name,
  markets.id                     as market_id,
  markets.name                   as market_name,
  industries.id                  as industry_id,
  industries.name                as industry_name,
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
