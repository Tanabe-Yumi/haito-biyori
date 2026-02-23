create view stocks_with_total_score as
select 
  stocks.*, 
  scores.total as total_score
from stocks
inner join scores on stocks.code = scores.code;