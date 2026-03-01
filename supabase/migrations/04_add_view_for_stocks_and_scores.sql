create view stocks_with_scores as
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
left join markets on stocks.market = markets.id
left join industries on stocks.industry = industries.id
inner join scores on stocks.code = scores.code;