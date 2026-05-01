import logging
import sys

import numpy as np
import pandas as pd
from scipy import stats

# common モジュールのインポート
import common
from common import (
    connect_supabase,
    fetch_stocks_from_db,
    load_env,
    make_log_decorator,
    send_frontend_log,
    send_frontend_progress,
    send_frontend_status,
)

# TODO: スコアリングロジックの改修
# - データが1年や数年しかない場合にスコアが高くなってしまう
# - 営業利益率のスコアが良すぎる（直近のデータが良ければ良いスコアになっている気がする）
# - 銀行の場合の営業利益率調整
# - 特定のクエリが失敗??
#   - ?page=2&rows=25&yield=3.5&industry=4

###################
# 定数
###################

# TODO: デフォルトスコアは None が良いかもしれない
DEFAULT_SCORE = 0

###################
# ログ設定
###################

logging.basicConfig(
    level=logging.INFO,
    filename="python/logs/calculateScores.log",
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)
log_call = make_log_decorator(logger)


###################
# functions
###################


def calculate_normalized_slope(series):
    """分析ロジック: 傾き"""

    # NaNを除外
    clean_series = series.dropna()

    # 最低3年分のデータが必要
    if len(clean_series) < 3:
        return None

    # データの正規化 (0~1)
    if clean_series.max() == clean_series.min():
        normalized_series = clean_series - clean_series.min()
    else:
        normalized_series = (clean_series - clean_series.min()) / (
            clean_series.max() - clean_series.min()
        )

    # X軸（時間軸）の正規化 (0~1)
    x = np.arange(len(clean_series))
    if len(x) > 1:
        x_norm = (x - x.min()) / (x.max() - x.min())
    else:
        x_norm = x

    # 傾きを算出
    slope, _, _, _, _ = stats.linregress(x_norm, normalized_series)

    return slope


def calculate_ewma(series):
    """分析ロジック: 指数加重移動平均 (EWMA)"""

    # NaNを除外
    clean_series = series.dropna()
    if clean_series.empty:
        return None

    # span=3 で直近の値を重視して平滑化
    ewma_latest = clean_series.ewm(span=3).mean().iloc[-1]

    return ewma_latest


def calculate_minus_count(series):
    """分析ロジック: マイナス回数を算出"""

    # NaNを除外
    clean_series = series.dropna()
    if clean_series.empty:
        return None

    recent_10_years = clean_series.tail(10)
    recent_15_years = clean_series.tail(15)

    # マイナス回数（直近10年を重視）
    return (recent_10_years < 0).sum() * 0.7 + (recent_15_years < 0).sum() * 0.3


def calculate_decrease_count(series):
    """分析ロジック: 減少回数を算出"""

    # NaNを除外
    clean_series = series.dropna()
    if clean_series.empty:
        return None

    # 減少回数
    return (clean_series.diff() < 0).sum()


def score_sales(series):
    """スコアリングロジック: 売上"""

    # TODO: 最初に return する条件を修正
    if series.empty:
        return DEFAULT_SCORE

    slope = calculate_normalized_slope(series)

    # スコア判定
    if slope is None:
        return DEFAULT_SCORE
    if slope >= 0.95:
        return 5
    if slope >= 0.5:
        return 4
    if slope >= 0.1:
        return 3
    if slope >= -0.3:
        return 2
    return 1


def score_operating_profit_margin(series):
    """スコアリングロジック: 営業利益率"""
    if series.empty:
        return DEFAULT_SCORE

    ewma = calculate_ewma(series)

    # スコア判定
    if ewma is None:
        return DEFAULT_SCORE
    if ewma >= 10.0:
        return 5
    if ewma >= 8.0:
        return 4
    if ewma >= 7.0:
        return 3
    if ewma >= 5.0:
        return 2
    return 1


def score_eps(series):
    """スコアリングロジック: EPS"""
    if series.empty:
        return DEFAULT_SCORE

    slope = calculate_normalized_slope(series)

    if slope is None:
        return DEFAULT_SCORE
    if slope >= 0.95:
        return 5
    if slope >= 0.5:
        return 4
    if slope >= 0.1:
        return 3
    if slope >= -0.3:
        return 2
    return 1


def score_operating_cf(series):
    """スコアリングロジック: 営業CF"""
    if series.empty:
        return DEFAULT_SCORE

    minus_count = calculate_minus_count(series)

    if minus_count is None:
        return DEFAULT_SCORE
    if minus_count == 0:
        return 5
    if minus_count <= 1:
        return 4
    if minus_count <= 2:
        return 3
    if minus_count <= 4:
        return 2
    return 1


def score_dividend_per_share(series):
    """スコアリングロジック: 一株配当"""
    if series.empty:
        return DEFAULT_SCORE

    decrease_count = calculate_decrease_count(series)

    if decrease_count is None:
        return DEFAULT_SCORE
    if decrease_count == 0:
        return 5
    if decrease_count <= 1:
        return 4
    if decrease_count <= 2:
        return 3
    if decrease_count <= 3:
        return 2
    return 1


def score_payout_ratio(series):
    """スコアリングロジック: 配当性向"""
    if series.empty:
        return DEFAULT_SCORE

    ewma = calculate_ewma(series)

    if ewma is None:
        return DEFAULT_SCORE
    if ewma < 30:
        return 1
    if ewma <= 50:
        return 5
    if ewma <= 60:
        return 4
    if ewma <= 70:
        return 3
    if ewma <= 80:
        return 2
    return 1


def score_equity_ratio(series):
    """スコアリングロジック: 自己資本比率"""
    if series.empty:
        return DEFAULT_SCORE

    ewma = calculate_ewma(series)

    if ewma is None:
        return DEFAULT_SCORE
    if ewma >= 40.0:
        return 5
    if ewma >= 35.0:
        return 4
    if ewma >= 30.0:
        return 3
    if ewma >= 15.0:
        return 2
    return 1


def score_cash(series):
    """スコアリングロジック: 現金"""
    if series.empty:
        return DEFAULT_SCORE

    slope = calculate_normalized_slope(series)

    if slope is None:
        return DEFAULT_SCORE
    if slope >= 0.2:
        return 5
    if slope >= 0.05:
        return 4
    if slope >= 0.0:
        return 3
    if slope >= -0.3:
        return 2
    return 1


def calculate_stock_score(df):
    """8つの評価項目と合計のスコアを算出"""
    s = {
        "sales": score_sales(df["sales"]),
        "operating_profit_margin": score_operating_profit_margin(
            df["operating_profit_margin"]
        ),
        "earnings_per_share": score_eps(df["earnings_per_share"]),
        "operating_cash_flow": score_operating_cf(df["operating_cash_flow"]),
        "dividend_per_share": score_dividend_per_share(df["dividend_per_share"]),
        "payout_ratio": score_payout_ratio(df["payout_ratio"]),
        "equity_ratio": score_equity_ratio(df["equity_ratio"]),
        "cash": score_cash(df["cash"]),
    }
    s["total"] = sum(s.values())

    return s


@log_call
def calculateScores(supabase):
    #  銘柄リストを取得
    stocks = fetch_stocks_from_db(supabase)
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
            # 決算情報を取得
            # 各年度の決算データを年の昇順で取得
            # TODO: 同年で複数の決算データがある場合の処理
            history = (
                supabase.table("financial_history")
                .select("*")
                .eq("code", code)
                .order("year", desc=False)
                .execute()
                .data
            )
            if not history:
                send_frontend_log(f"✗ 失敗: {code} {name} (決算データなし)")
                logger.warning(f"✗ 決算データなし: {code} {name}")
                fail_count += 1
                continue
            df = pd.DataFrame(history)

            # スコア算出
            scores = calculate_stock_score(df)

            #  DB保存
            scores["code"] = code
            supabase.table("scores").upsert(scores).execute()

            send_frontend_log(f"✓ 成功: {code} {name} (スコア: {scores['total']})")
            logger.info(f"✓ 更新成功: {code} {name} (スコア: {scores['total']})")
            success_count += 1
        except Exception as e:
            send_frontend_log(f"✗ 失敗: {code} {name} ({e})")
            logger.error(f"✗ 処理失敗: {code} {name} ({e})")
            fail_count += 1

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
    # 環境変数読み込み
    load_env()

    # supabase 接続
    supabase = connect_supabase()

    # スコア計算
    calculateScores(supabase)
    sys.exit()
