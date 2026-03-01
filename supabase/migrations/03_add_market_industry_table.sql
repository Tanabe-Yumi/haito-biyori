-- トランザクション
begin;

-- markets / industries テーブル作成
create table if not exists markets (
  id   integer primary key,
  name text    not null
);
create table if not exists industries (
  id   integer primary key,
  name text    not null
);

-- markets / industries テーブルにデータを挿入
-- on conflict (id) do nothing: ID が重複する場合はエラーを出さず次に進む
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

-- stocks_with_total_score ビューを削除
drop view if exists stocks_with_total_score;

-- stocks テーブルの market / industry カラムを、ID に更新（text）
update stocks
  set market = markets.id::text
  from markets
  where stocks.market = markets.name;
update stocks
  set industry = industries.id::text
  from industries
  where stocks.industry = industries.name;

-- stocks テーブルの market / industry カラムを integer 型へ変更
-- using column::integer: 一括で型を変更
alter table stocks
  alter column market type integer using market::integer;
alter table stocks
  alter column industry type integer using industry::integer;

-- 外部キー制約を設定
alter table stocks
  add constraint fk_stocks_market
  foreign key (market) references markets(id);
alter table stocks
  add constraint fk_stocks_industry
  foreign key (industry) references industries(id);

-- Row Level Security (RLS) を有効化
alter table markets enable row level security;
alter table industries enable row level security;

-- 誰でも読み取り可能にするポリシーを設定
create policy "Allow public read access on markets"
  on markets for select using (true);
create policy "Allow public read access on industries"
  on industries for select using (true);

-- stocks_with_total_score ビューを再作成
-- TODO: SECURITY INVOKER を有効にする(https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0010_security_definer_view)
create view stocks_with_total_score as
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
left join markets on stocks.market = markets.id
left join industries on stocks.industry = industries.id
inner join scores on stocks.code = scores.code;

-- トランザクションをコミット
commit;
