import functools
import json
import logging
import os
import signal
import sys
import time
import warnings

import yfinance as yf
from dotenv import load_dotenv
from supabase import Client, create_client

###################
# ログ設定
###################

logging.basicConfig(
    level=logging.INFO,
    filename="python/logs/fetchStockPrices.log",
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def log_call(func):
    """関数の前後にログ出力
    関数定義の1つ上の行に`@log_call`を記述するとログ出力が可能
    """

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logger.info(f"{func.__name__}: start")
        result = func(*args, **kwargs)
        logger.info(f"{func.__name__}: end")
        return result

    return wrapper


# FutureWarning を無視
warnings.simplefilter("ignore", FutureWarning)


###################
# 中断処理
###################

# 中断フラグ (フロントから受け取り)
stopRequested = False


@log_call
def handleInterrupt(signum, frame):
    """中断処理"""
    global stopRequested
    print(
        json.dumps({"type": "status", "message": "処理を中断します"}),
    )
    stopRequested = True


# 信号: SIGINT を受け取ったときに handleInterrupt を実行
signal.signal(signal.SIGINT, handleInterrupt)


###################
# util functions
###################


def send_frontend_message(msgObj):
    """フロントへのメッセージ"""
    print(json.dumps(msgObj))
    return


def send_frontend_progress(current: int, total: int, code: str, name: str):
    """フロントへのメッセージ (type: progress)"""
    send_frontend_message(
        {
            "type": "progress",
            "current": current,
            "total": total,
            "code": code,
            "name": name,
        }
    )
    return


def send_frontend_stauts(msg: str):
    """フロントへのメッセージ (type: status)"""
    send_frontend_message(
        {
            "type": "status",
            "message": msg,
        }
    )
    return


def send_frontend_log(msg: str):
    """フロントへのメッセージ (type: log)"""
    send_frontend_message(
        {
            "type": "log",
            "message": msg,
        }
    )
    return


###################
# functions
###################


@log_call
def load_env():
    """環境変数の読み込み"""
    load_dotenv("../.env.local")
    return


@log_call
def connect_supabase():
    """Supabase接続"""
    send_frontend_stauts("データベース接続中...")

    # 環境変数読み込み
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    # 環境変数が設定されていない場合は異常終了
    missing = []
    if not supabase_url:
        missing.append("NEXT_PUBLIC_SUPABASE_URL")
    if not supabase_key:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if missing:
        send_frontend_stauts("データベース接続失敗。少し待ってリトライしてください。")
        logger.error(f"Supabase環境変数が設定されていません: {', '.join(missing)}")
        return

    supabase: Client = create_client(supabase_url, supabase_key)
    return supabase


@log_call
def fetch_stocks_from_db():
    """Supabase から銘柄リストを取得"""
    stocks = []
    start = 0
    batch_size = 1000

    try:
        # 1000件ずつ取得
        while True:
            response = (
                supabase.table("stocks")
                .select("code, name")
                .range(start, start + batch_size - 1)
                .execute()
            )
            data = response.data
            if not data:
                break

            stocks.extend(data)
            if len(data) < batch_size:
                break

            start += batch_size

        return stocks
    except Exception as e:
        logger.warning(f"銘柄リスト取得エラー: {e}")
        # エラーが発生しても、それまでに取得できたデータを返す
        if stocks:
            send_frontend_log(f"銘柄リストは一部のみ取得できました ({len(stocks)}件)")
            logger.info(f"取得成功した銘柄で後続処理を続行 ({len(stocks)}件)")
            return stocks
    return []


def update_stock_price(code: str, name: str, price: float, dividend_yield: float):
    """株式情報をDBに保存"""
    try:
        # フォーマット
        price_formated = int(price) if price else None
        dividend_yield_formated = (
            "{:.2f}".format(dividend_yield) if dividend_yield else None
        )

        # DB 更新
        # None の場合は NULL が格納される
        response = (
            supabase.table("stocks")
            .update(
                {
                    "price": price_formated,
                    "dividend_yield": dividend_yield_formated,
                }
            )
            .eq("code", code)
            .execute()
        )

        logger.info(
            f"DB更新成功: {code} {name} (株価: {price}, 配当利回り: {dividend_yield})"
        )
        return True
    except Exception as e:
        logger.warning(f"DB更新エラー: {code} {name} ({e})")
        return False


@log_call
def fetchStockPrices():
    # Supabaseから銘柄リストを取得
    stocks = fetch_stocks_from_db()

    if not stocks:
        send_frontend_stauts("更新する銘柄がありません")
        logger.warning("更新する銘柄が0件. 処理を終了")
        return

    total = len(stocks)
    success_count = 0
    fail_count = 0

    for idx, stock in enumerate(stocks, 1):
        # 中止信号があれば中止
        if stopRequested:
            logger.info("中止信号を取得. 処理を終了")
            break

        code = stock["code"]
        name = stock["name"]

        # 処理中の情報
        send_frontend_progress(idx, total, code, name)

        try:
            # 株式情報を取得
            ticker = yf.Ticker(f"{code}.T")
            info = ticker.info

            # 株価(price) 取得
            price = info.get("currentPrice")
            # currentPrice が取れない場合は fast_info の last_price を取得
            if price is None:
                try:
                    price = ticker.fast_info.get("lastPrice")
                except Exception:
                    pass

            # 配当利回り(dividendYield) 取得
            dividend_yield = info.get("dividendYield")

            # 株価と配当利回りの両方が取得できない場合はDB更新せず終了
            if price is None and dividend_yield is None:
                send_frontend_log(f"✗ 失敗: {name} (取得失敗)")
                logger.warning(f"yfinance取得失敗: {code} {name}")
                fail_count += 1
                continue

            # Supabaseに保存
            if update_stock_price(code, name, price, dividend_yield):
                # 成功
                send_frontend_log(
                    f"✓ 成功: {name} (株価: {int(price)}, 配当利回り: {dividend_yield})"
                )
                success_count += 1
            else:
                # 失敗
                send_frontend_log(f"✗ 失敗: {name} (DB更新失敗)")
                fail_count += 1

        except Exception as e:
            send_frontend_log(f"✗ 失敗: {name} ({e})")
            logger.error(f"取得/更新失敗: {code} {name} ({e})")
            fail_count += 1

        # API制限対策
        time.sleep(2)

    # 結果表示
    send_frontend_stauts(
        f"[結果] {total}件中 成功: {success_count}件, 失敗: {fail_count}件"
    )
    logger.info(f"処理結果: 成功: {success_count}件, エラー: {fail_count}件)")

    return


###################
# main process
###################

if __name__ == "__main__":
    # 環境変数読み込み
    load_env()

    # supabase 接続
    supabase = connect_supabase()

    # 株価取得
    fetchStockPrices()
    sys.exit()
