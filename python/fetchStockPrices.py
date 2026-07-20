import argparse
import logging
import sys
import time

import yfinance as yf

# common モジュールのインポート
import common
from common import (
    connect_db,
    fetch_stocks_from_db,
    make_log_decorator,
    send_frontend_log,
    send_frontend_progress,
    send_frontend_status,
)

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
log_call = make_log_decorator(logger)

###################
# functions
###################


def update_stock_price(
    conn, code: str, name: str, price: float, dividend_yield: float
):
    """銘柄情報をDBに保存"""
    try:
        # フォーマット
        price_formated = int(price) if price else None
        dividend_yield_formated = (
            round(float(dividend_yield), 2) if dividend_yield else None
        )

        # DB更新
        # None の場合は NULL が格納される
        conn.execute(
            "update stocks set price = ?, dividend_yield = ? where code = ?",
            (price_formated, dividend_yield_formated, code),
        )
        conn.commit()
        logger.info(
            f"DB更新成功: {code} {name} (株価: {price}, 配当利回り: {dividend_yield})"
        )
        return True
    except Exception as e:
        logger.warning(f"DB更新エラー: {code} {name} ({e})")
        return False


@log_call
def fetchStockPrices(conn, updated_before=None):
    # 銘柄リストを取得
    stocks = fetch_stocks_from_db(conn, updated_before)
    if not stocks:
        send_frontend_status("更新する銘柄がありません")
        logger.warning("更新する銘柄が0件. 処理を終了")
        return

    total = len(stocks)
    success_count = 0
    fail_count = 0

    for idx, stock in enumerate(stocks, 1):
        # 中止信号があれば中止
        if common.stopRequested:
            logger.info("中止信号を取得. 処理を終了")
            break

        code = stock["code"]
        name = stock["name"]

        # 処理中の情報
        send_frontend_progress(idx, total, code, name)

        try:
            # 銘柄情報を取得
            ticker = yf.Ticker(f"{code}.T")
            info = ticker.info

            # 株価
            price = info.get("currentPrice")
            # currentPrice が取れない場合は fast_info の last_price を使用
            if price is None:
                try:
                    price = ticker.fast_info.get("lastPrice")
                except Exception:
                    pass

            # 配当利回り
            dividend_yield = info.get("dividendYield")

            # 株価と配当利回りの両方が取得できない場合はDB更新せず終了
            if price is None and dividend_yield is None:
                send_frontend_log(f"✗ 失敗: {name} (取得失敗)")
                logger.warning(f"yfinance取得失敗: {code} {name}")
                fail_count += 1
                continue

            # DB保存
            if update_stock_price(conn, code, name, price, dividend_yield):
                send_frontend_log(
                    f"✓ 成功: {name} (株価: {int(price)}, 配当利回り: {dividend_yield})"
                )
                success_count += 1
            else:
                send_frontend_log(f"✗ 失敗: {name} (DB更新失敗)")
                fail_count += 1

        except Exception as e:
            send_frontend_log(f"✗ 失敗: {name} ({e})")
            logger.error(f"取得/更新失敗: {code} {name} ({e})")
            fail_count += 1

        # API制限対策
        time.sleep(2)

    # 結果表示
    send_frontend_status(
        f"[結果] {total}件中 成功: {success_count}件, 失敗: {fail_count}件"
    )
    logger.info(
        f"処理結果: {total}件中 成功: {success_count}件, エラー: {fail_count}件)"
    )


###################
# main process
###################

if __name__ == "__main__":
    # --updated-before YYYY-MM-DD:
    # その日より前に更新された銘柄だけを対象にする (中断した更新の再開用)
    parser = argparse.ArgumentParser()
    parser.add_argument("--updated-before", default=None)
    args = parser.parse_args()

    # SQLite 接続
    conn = connect_db()
    if conn is None:
        sys.exit(1)
    # 株価取得
    fetchStockPrices(conn, updated_before=args.updated_before)
    conn.close()
    sys.exit()
