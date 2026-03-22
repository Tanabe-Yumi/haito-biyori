import os
import sys
import time
import logging
import warnings
from dotenv import load_dotenv
from supabase import create_client, Client
import yfinance as yf

# 環境変数の読み込み
load_dotenv('../.env.local')

# ロガー設定
# logging.basicConfig(
# 	level=logging.INFO,
# 	format='%(asctime)s [%(levelname)s] %(message)s',
# 	datefmt='%Y-%m-%d %H:%M:%S',
# )
# logger = logging.getLogger(__name__)

# FutureWarning を無視
# warnings.simplefilter('ignore', FutureWarning)

# Supabase 接続
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
	missing = []
	if not supabase_url: missing.append("NEXT_PUBLIC_SUPABASE_URL")
	if not supabase_key: missing.append("SUPABASE_SERVICE_ROLE_KEY")
	print(f"Supabase環境変数が設定されていません: {', '.join(missing)}")
	sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)
print(f"データベース接続成功")

# Supabase から銘柄リストを取得
def fetch_stocks_from_db():
	stocks = []
	start = 0
	batch_size = 1000
	
	try:
		while True:
			response = supabase.table('stocks').select('code, name').range(start, start + batch_size - 1).execute()
			data = response.data
			
			if not data:
				break
				
			stocks.extend(data)
			# print(f"銘柄リスト取得中: {len(data)}件 (合計: {len(stocks)}件)")
			
			if len(data) < batch_size:
				break
				
			start += batch_size
			
		print(f"銘柄リスト取得完了: {len(stocks)}件")
		return stocks
	except Exception as e:
		print(f"銘柄リスト取得エラー: {e}")
		# エラーが発生しても、それまでに取得できたデータを返す
		if stocks:
			print(f"一部の銘柄のみ取得しました: {len(stocks)}件")
			return stocks
		return []

# Supabase の stocks テーブルを更新
def update_stock_price(code: str, name: str, price: float, dividend_yield: float):
	try:
		# フォーマット
		price_formated = int(price) if price else None
		dividend_yield_formated = "{:.2f}".format(dividend_yield) if dividend_yield else None
		
		# DB 更新
		# None の場合は NULL が格納される
		response = supabase.table('stocks').update({
			'price': price_formated,
			'dividend_yield': dividend_yield_formated,
		}).eq('code', code).execute()
		
		msg = f"✓ {name} ({code}): 株価: {price_formated}円, 利回り: {dividend_yield_formated}%"
		print(msg)
		return True
	except Exception as e:
		print(f"✗ {name} ({code}): 更新エラー - {e}")
		return False

def main():
	# logger.info("=" * 60)
	# logger.info("株価・配当利回り取得開始")
	# logger.info("=" * 60)

	# Supabaseから銘柄リストを取得
	stocks = fetch_stocks_from_db()

	if not stocks:
		print("取得する銘柄がありません")
		return

	success_count = 0
	error_count = 0

	for idx, stock in enumerate(stocks, 1):
		code = stock['code']
		name = stock['name']
		
		print(f"[{idx}/{len(stocks)}] 処理中: {name} ({code})")
		
		try:
			# 株式情報を取得
			ticker = yf.Ticker(f"{code}.T")
			info = ticker.info
			
			# 株価(price) 取得
			price = info.get('currentPrice')
			# currentPrice が取れない場合は fast_info の last_price を取得
			if price is None:
				try:
					price = ticker.fast_info.get('lastPrice')
				except:
					pass

			# 配当利回り(dividendYield) 取得
			dividend_yield = info.get('dividendYield')

			if price is None and dividend_yield is None:
				print(f"⚠ 取得失敗")
				error_count += 1
				continue
			
			# Supabaseに保存
			if update_stock_price(code, name, price, dividend_yield):
				success_count += 1
			else:
				error_count += 1
						
		except Exception as e:
			print(f"✗ エラー: {e}")
			error_count += 1
		
		# API制限対策
		time.sleep(2)
	
	print("[Summary] " + "=" * 50)
	print(f"成功: {success_count}件, エラー: {error_count}件")
	print("=" * 60)

if __name__ == "__main__":
	main()
