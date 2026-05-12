-- financial_history テーブルに営業利益カラムを追加
ALTER TABLE financial_history
  ADD COLUMN IF NOT EXISTS operating_profit numeric;
