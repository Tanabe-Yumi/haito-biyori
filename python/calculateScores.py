import os
import sys
import logging
from dotenv import load_dotenv
import pandas as pd
import numpy as np
from scipy import stats
from supabase import create_client, Client

# TODO: スコアリングロジックの改修
# - データが1年や数年しかない場合にスコアが高くなってしまう
# - 営業利益率のスコアが良すぎる（直近のデータが良ければ良いスコアになっている気がする）
# - 銀行の場合の営業利益率調整
# - 特定のクエリが失敗??
#   - ?page=2&rows=25&yield=3.5&industry=4

# 環境変数の読み込み
load_dotenv('../.env.local')

# ロガー設定
logging.basicConfig(
	level=logging.INFO,
	format='%(asctime)s [%(levelname)s] %(message)s',
	datefmt='%Y-%m-%d %H:%M:%S',
)
logger = logging.getLogger(__name__)

# 定数
# TODO: デフォルトスコアは None が良いかもしれない
DEFAULT_SCORE = 0

# Supabase 接続
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
	missing = []
	if not supabase_url: missing.append("NEXT_PUBLIC_SUPABASE_URL")
	if not supabase_key: missing.append("SUPABASE_SERVICE_ROLE_KEY")
	logger.error(f"Supabase環境変数が設定されていません: {', '.join(missing)}")
	sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

# 分析ロジック
# 傾き
def calculate_normalized_slope(series):
	# NaNを除外
	clean_series = series.dropna()

	# 最低3年分のデータが必要
	if len(clean_series) < 3:
		return None
	
	# データの正規化 (0~1)
	if clean_series.max() == clean_series.min():
		normalized_series = clean_series - clean_series.min()
	else:
		normalized_series = (clean_series - clean_series.min()) / (clean_series.max() - clean_series.min())
    
	# X軸（時間軸）の正規化 (0~1)
	x = np.arange(len(clean_series))
	if len(x) > 1:
		x_norm = (x - x.min()) / (x.max() - x.min())
	else:
		x_norm = x

	# 傾きを算出
	slope, _, _, _, _ = stats.linregress(x_norm, normalized_series)

	return slope

# 指数加重移動平均 (EWMA)
def calculate_ewma(series):
	# NaNを除外
	clean_series = series.dropna()
	if clean_series.empty:
		return None

	# span=3 で直近の値を重視して平滑化
	ewma_latest = clean_series.ewm(span=3).mean().iloc[-1]

	return ewma_latest

# マイナス回数を算出
def calculate_minus_count(series):
	# NaNを除外
	clean_series = series.dropna()
	if clean_series.empty:
		return None

	recent_10_years = clean_series.tail(10)
	recent_15_years = clean_series.tail(15)

	# マイナス回数（直近10年を重視）
	return (recent_10_years < 0).sum() * 0.7 + (recent_15_years < 0).sum() * 0.3

# 減少回数を算出
def calculate_decrease_count(series):
	# NaNを除外
	clean_series = series.dropna()
	if clean_series.empty:
		return None
	
	# 減少回数
	return (clean_series.diff() < 0).sum()

# スコアリングロジック
# 売上
def score_sales(series):
	# TODO: 最初に return する条件を修正
	if series.empty: return DEFAULT_SCORE

	slope = calculate_normalized_slope(series)
    
	# スコア判定
	if slope is None: return DEFAULT_SCORE
	if slope >= 0.95: return 5
	if slope >= 0.5: return 4
	if slope >= 0.1: return 3
	if slope >= -0.3: return 2
	return 1

# 営業利益率
def score_operating_profit_margin(series):
	if series.empty: return DEFAULT_SCORE

	ewma = calculate_ewma(series)
    
	# スコア判定
	if ewma is None: return DEFAULT_SCORE
	if ewma >= 10.0: return 5
	if ewma >= 8.0: return 4
	if ewma >= 7.0: return 3
	if ewma >= 5.0: return 2
	return 1

# EPS
def score_eps(series):
	if series.empty: return DEFAULT_SCORE

	slope = calculate_normalized_slope(series)
	
	if slope is None: return DEFAULT_SCORE
	if slope >= 0.95: return 5
	if slope >= 0.5: return 4
	if slope >= 0.1: return 3
	if slope >= -0.3: return 2
	return 1

# 営業CF
def score_operating_cf(series):
	if series.empty: return DEFAULT_SCORE

	minus_count = calculate_minus_count(series)
	
	if minus_count is None: return DEFAULT_SCORE
	if minus_count == 0: return 5
	if minus_count <= 1: return 4
	if minus_count <= 2: return 3
	if minus_count <= 4: return 2
	return 1

# 一株配当
def score_dividend_per_share(series):
	if series.empty: return DEFAULT_SCORE

	decrease_count = calculate_decrease_count(series)
	
	if decrease_count is None: return DEFAULT_SCORE
	if decrease_count == 0: return 5
	if decrease_count <= 1: return 4
	if decrease_count <= 2: return 3
	if decrease_count <= 3: return 2
	return 1

# 配当性向
def score_payout_ratio(series):
	if series.empty: return DEFAULT_SCORE

	ewma = calculate_ewma(series)

	if ewma is None: return DEFAULT_SCORE
	if ewma < 30: return 1
	if ewma <= 50: return 5
	if ewma <= 60: return 4
	if ewma <= 70: return 3
	if ewma <= 80: return 2
	return 1

# 自己資本比率
def score_equity_ratio(series):
	if series.empty: return DEFAULT_SCORE
	
	ewma = calculate_ewma(series)

	if ewma is None: return DEFAULT_SCORE
	if ewma >= 40.0: return 5
	if ewma >= 35.0: return 4
	if ewma >= 30.0: return 3
	if ewma >= 15.0: return 2
	return 1

# 現金
def score_cash(series):
	if series.empty: return DEFAULT_SCORE
	
	slope = calculate_normalized_slope(series)

	if slope is None: return DEFAULT_SCORE
	if slope >= 0.2: return 5
	if slope >= 0.05: return 4
	if slope >= 0.0: return 3
	if slope >= -0.3: return 2
	return 1

def calculate_stock_score(df):
	s = {
		'sales': score_sales(df['sales']),
		'operating_profit_margin': score_operating_profit_margin(df['operating_profit_margin']),
		'earnings_per_share': score_eps(df['earnings_per_share']),
		'operating_cash_flow': score_operating_cf(df['operating_cash_flow']),
		'dividend_per_share': score_dividend_per_share(df['dividend_per_share']),
		'payout_ratio': score_payout_ratio(df['payout_ratio']),
		'equity_ratio': score_equity_ratio(df['equity_ratio']),
		'cash': score_cash(df['cash']),
	}
	s['total'] = sum(s.values())

	return s

# Supabase から銘柄リストを取得
def fetch_stocks_from_db():
	stocks = []
	start = 0
	batch_size = 1000
	
	try:
		while True:
			response = supabase.table('stocks').select('code').range(start, start + batch_size - 1).execute()
			data = response.data
			
			if not data:
				break
				
			stocks.extend(data)
			logger.info(f"銘柄リスト取得中: {len(data)}件 (合計: {len(stocks)}件)")
			
			if len(data) < batch_size:
				break
				
			start += batch_size
			
		logger.info(f"銘柄リスト取得完了: {len(stocks)}件")
		return stocks
	except Exception as e:
		logger.error(f"銘柄リスト取得エラー: {e}")
		# エラーが発生しても、それまでに取得できたデータを返す
		if stocks:
			logger.warning(f"一部の銘柄のみ取得しました: {len(stocks)}件")
			return stocks
		return []

def main():
	logger.info("=" * 60)
	logger.info("スコア計算処理開始")
	logger.info("=" * 60)

	# 1. sotcks から一覧取得
	stocks = fetch_stocks_from_db()
	logger.info(f"対象銘柄数: {len(stocks)}件")

	# 2. history から抽出
	for stock in stocks:
		code = stock['code']
			
		try:
			# 各年度の決算データを年の昇順で取得
			# TODO: 同年で複数の決算データがある場合の処理
			history = supabase.table('financial_history').select('*').eq('code', code).order('year', desc=False).execute().data
			if not history:
				logger.warning(f"⚠️ {code}: 決算データがありません")
				continue
			df = pd.DataFrame(history)
			
			# 3. スコア計算
			scores = calculate_stock_score(df)
			logger.info(f"✓ {code}: スコア計算完了 (Total: {scores['total']})")

			# 4. DB に保存
			scores['code'] = code

			supabase.table('scores').upsert(scores).execute()
			logger.info(f"✓ {code}: スコア保存完了")
		except Exception as e:
			logger.error(f"⚠️ {code}: エラー: {e}")

	logger.info("スコア計算処理が正常に完了しました")

if __name__ == "__main__":
	main()
