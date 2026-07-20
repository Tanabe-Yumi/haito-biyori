import argparse
import logging
import sys

import numpy as np
import pandas as pd
from scipy import stats

# common モジュールのインポート
import common
from common import (
    connect_db,
    fetch_stocks_from_db,
    fetch_stocks_with_stale_scores,
    make_log_decorator,
    send_frontend_log,
    send_frontend_progress,
    send_frontend_status,
)

# TODO: スコアリングロジックの改修
# - データが1年や数年しかない場合にスコアが高くなってしまう
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
    clean_series = series.dropna()
    if clean_series.empty:
        return None

    # span=3 で直近の値を重視して平滑化
    ewma_latest = clean_series.ewm(span=3).mean().iloc[-1]

    return ewma_latest


def calculate_cagr(series):
    """分析ロジック: CAGR(年平均成長率)"""
    clean = series.dropna()
    if len(clean) < 2:
        return None

    start = clean.iloc[0]
    end = clean.iloc[-1]
    n = len(clean) - 1

    if start <= 0:
        return None

    return (end / start) ** (1 / n) - 1


def calculate_r2(series):
    """分析ロジック: R^2(回帰直線/安定性)"""
    clean = series.dropna()
    if len(clean) < 3:
        return None

    x = np.arange(len(clean))
    y = clean.values

    slope, intercept, r_value, _, _ = stats.linregress(x, y)
    return r_value**2


def calculate_decrease_count(series):
    """分析ロジック: 減少回数"""
    clean = series.dropna()
    if len(clean) < 2:
        return None

    return (clean.diff() < 0).sum()


def calculate_minus_count(series):
    """分析ロジック: マイナス回数"""
    clean = series.dropna()
    if clean.empty:
        return None

    return (clean < 0).sum()


def score_trend(series):
    """スコアリングロジック: 傾向"""
    cagr = calculate_cagr(series)
    r2 = calculate_r2(series)
    decrease = calculate_decrease_count(series)

    if cagr is None or decrease is None:
        return DEFAULT_SCORE
    if cagr > 0 and decrease == 0 and (r2 is not None and r2 >= 0.85):
        return 5
    if cagr > 0 and decrease <= 2:
        return 4
    if -0.02 <= cagr <= 0.02:
        return 3
    if cagr < 0 or decrease >= 5:
        return 2
    return 1


def score_sales(series):
    """スコアリングロジック: 売上"""
    return score_trend(series)


def score_operating_profit_margin(series):
    """スコアリングロジック: 営業利益率"""
    clean = series.dropna()

    if clean.empty:
        return DEFAULT_SCORE

    over_10_count = (clean >= 10).sum()
    minus_count = calculate_minus_count(clean)

    total = len(clean)
    over_10_ratio = over_10_count / total
    minus_ratio = minus_count / total

    if over_10_ratio >= 0.95 and over_10_count > 5:
        return 5
    if over_10_count >= 0.7:
        return 4
    if minus_ratio >= 0.8:
        return 1
    if minus_ratio >= 0.5:
        return 2
    return 3


def score_eps(series):
    """スコアリングロジック: EPS"""
    return score_trend(series)


def score_operating_cf(series, operating_profit_series):
    """スコアリングロジック: 営業CF"""
    cf_minus = calculate_minus_count(series)

    if cf_minus is None:
        return DEFAULT_SCORE

    cf_sum = series.dropna().sum()
    op_sum = operating_profit_series.dropna().sum()

    if cf_minus == 0 and cf_sum >= op_sum:
        return 5
    if cf_minus == 0:
        return 4
    if cf_minus <= 3:
        return 3
    if cf_minus <= 5:
        return 2
    return 1


def score_dividend_per_share(series):
    """スコアリングロジック: 一株配当"""
    decrease = calculate_decrease_count(series)
    cagr = calculate_cagr(series)

    if decrease is None:
        return DEFAULT_SCORE
    if decrease == 0 and cagr is not None and cagr >= 0.03:
        return 5
    if decrease == 0:
        return 4
    if decrease <= 2 and (cagr is None or cagr >= -0.02):
        return 3
    if decrease <= 4:
        return 2
    return 1


def score_payout_ratio(series):
    """スコアリングロジック: 配当性向"""
    clean = series.dropna()

    if clean.empty:
        return DEFAULT_SCORE

    valid = clean[(clean >= 0) & (clean <= 200)]
    if valid.empty:
        return 1

    # 理想
    ideal_count = ((valid >= 30) & (valid <= 50)).sum()
    # やや危険
    warning_count = (
        ((valid >= 20) & (valid < 30)) | ((valid > 50) & (valid <= 80))
    ).sum()
    # 危険
    danger_count = ((valid < 20) | (valid > 80)).sum()

    total = len(valid)
    ideal_ratio = ideal_count / total
    warning_ratio = warning_count / total
    danger_ratio = danger_count / total

    if ideal_ratio >= 0.95:
        return 5
    if ideal_ratio >= 0.7:
        return 4
    if danger_ratio >= 0.5:
        return 1
    if warning_ratio >= 0.5:
        return 2
    if ideal_ratio >= 0.4:
        return 3
    return 2


def score_equity_ratio(series):
    """スコアリングロジック: 自己資本比率"""
    clean = series.dropna()

    if clean.empty:
        return DEFAULT_SCORE

    ewma = calculate_ewma(clean)
    min_val = clean.min()

    # 40%以上だった年数
    stable_count = (clean >= 40).sum()
    stable_ratio = stable_count / len(clean)

    if min_val < 20:
        return 1
    if ewma >= 70 and stable_ratio >= 0.9:
        return 5
    if ewma >= 40 and stable_ratio >= 0.7:
        return 4
    if ewma >= 30:
        return 3
    if ewma >= 20:
        return 2
    return 1


def score_cash(series):
    """スコアリングロジック: 現金"""
    return score_trend(series)


def calculate_stock_score(df):
    """8つの評価項目と合計のスコアを算出"""
    s = {
        "sales": score_sales(df["sales"]),
        "operating_profit_margin": score_operating_profit_margin(
            df["operating_profit_margin"]
        ),
        "earnings_per_share": score_eps(df["earnings_per_share"]),
        "operating_cash_flow": score_operating_cf(
            df["operating_cash_flow"], df["operating_profit"]
        ),
        "dividend_per_share": score_dividend_per_share(df["dividend_per_share"]),
        "payout_ratio": score_payout_ratio(df["payout_ratio"]),
        "equity_ratio": score_equity_ratio(df["equity_ratio"]),
        "cash": score_cash(df["cash"]),
    }
    s["total"] = sum(s.values())

    return s


@log_call
def calculateScores(conn, updated_before=None):
    #  銘柄リストを取得
    # updated_before 指定時は、スコアが未計算または古い銘柄だけを対象にする
    if updated_before:
        stocks = fetch_stocks_with_stale_scores(conn, updated_before)
    else:
        stocks = fetch_stocks_from_db(conn)
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
            # 直近10年分(降順で取得し後で並び替え)
            history = [
                dict(row)
                for row in conn.execute(
                    """
                    select * from financial_history
                    where code = ?
                    order by year desc
                    limit 10
                    """,
                    (code,),
                ).fetchall()
            ]
            if not history:
                send_frontend_log(f"✗ 失敗: {code} {name} (決算データなし)")
                logger.warning(f"✗ 決算データなし: {code} {name}")
                fail_count += 1
                continue

            # 昇順にソート
            df = pd.DataFrame(history).sort_values("year").reset_index(drop=True)

            # スコア算出
            scores = calculate_stock_score(df)

            #  DB保存
            scores["code"] = code
            conn.execute(
                """
                insert into scores (
                  code, sales, operating_profit_margin, earnings_per_share,
                  operating_cash_flow, dividend_per_share, payout_ratio,
                  equity_ratio, cash, total
                )
                values (
                  :code, :sales, :operating_profit_margin, :earnings_per_share,
                  :operating_cash_flow, :dividend_per_share, :payout_ratio,
                  :equity_ratio, :cash, :total
                )
                on conflict (code) do update set
                  sales                   = excluded.sales,
                  operating_profit_margin = excluded.operating_profit_margin,
                  earnings_per_share      = excluded.earnings_per_share,
                  operating_cash_flow     = excluded.operating_cash_flow,
                  dividend_per_share      = excluded.dividend_per_share,
                  payout_ratio            = excluded.payout_ratio,
                  equity_ratio            = excluded.equity_ratio,
                  cash                    = excluded.cash,
                  total                   = excluded.total
                """,
                scores,
            )
            conn.commit()

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
    # --updated-before YYYY-MM-DD:
    # スコアが未計算、またはその日より前に計算された銘柄だけを対象にする (中断した計算の再開用)
    parser = argparse.ArgumentParser()
    parser.add_argument("--updated-before", default=None)
    args = parser.parse_args()

    # SQLite 接続
    conn = connect_db()
    if conn is None:
        sys.exit(1)

    # スコア計算
    calculateScores(conn, updated_before=args.updated_before)
    conn.close()
    sys.exit()
