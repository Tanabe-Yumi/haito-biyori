-- fts カラムを追加
---- code カラムと name カラムの両方から検索するため
alter table
  stocks
add column
  fts tsvector generated always as (to_tsvector('simple', code || ' ' || name)) stored;

-- 既存の view を一度削除
drop view stocks_with_total_score;

-- fts を含む view を再作成
create view stocks_with_total_score as
select 
  stocks.code as code, 
  stocks.name as name, 
  stocks.market as market, 
  stocks.industry as industry, 
  stocks.price as price, 
  stocks.dividend_yield as dividend_yield, 
  stocks.updated_at as updated_at, 
  stocks.created_at as created_at, 
  scores.total as total_score,
  stocks.fts as fts
from stocks
inner join scores on stocks.code = scores.code;

-- 検索インデックスを作成
create index stocks_fts on stocks using gin (fts);
