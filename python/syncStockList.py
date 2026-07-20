import argparse
import logging
import sys
import tempfile

import pandas as pd
import requests

# common モジュールのインポート
from common import (
    connect_db,
    make_log_decorator,
    send_frontend_log,
    send_frontend_progress,
    send_frontend_status,
)

###################
# 定数
###################

# JPX (日本取引所グループ) が公開する上場銘柄一覧 (月次更新)
JPX_LIST_URL = (
    "https://www.jpx.co.jp/markets/statistics-equities/misc/"
    "tvdivq0000001vg2-att/data_j.xls"
)

# 取り込む市場区分 → markets テーブルの ID
# ETF・REIT・PRO Market・外国株は対象外 (普通株のみ扱う)
MARKET_IDS = {
    "プライム（内国株式）": 1,
    "スタンダード（内国株式）": 2,
    "グロース（内国株式）": 3,
}

# JPX データが対象とする市場の ID (東証)
# 差分判定はこの市場の銘柄に限定する (名証・札証・福証は JPX データに含まれないため)
TSE_MARKET_IDS = tuple(MARKET_IDS.values())

# 業種が特定できない場合の industries テーブルの ID
OTHER_INDUSTRY_ID = 9999

# 普通株の銘柄コードの文字数
# 5桁コードは優先株・社債型種類株式のため取り込まない
COMMON_STOCK_CODE_LENGTH = 4

###################
# ログ設定
###################

logging.basicConfig(
    level=logging.INFO,
    filename="python/logs/syncStockList.log",
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)
log_call = make_log_decorator(logger)

###################
# functions
###################


@log_call
def fetch_jpx_stocks():
    """JPX の上場銘柄一覧を取得し、普通株だけを {コード: 銘柄情報} で返す"""
    send_frontend_status("JPX から銘柄一覧を取得中...")

    response = requests.get(JPX_LIST_URL, timeout=120)
    response.raise_for_status()

    # pandas で読めるよう一時ファイルに保存
    with tempfile.NamedTemporaryFile(suffix=".xls") as tmp:
        tmp.write(response.content)
        tmp.flush()
        df = pd.read_excel(tmp.name, dtype={"コード": str})

    # 内国株式のみに絞り込み (ETF・REIT・PRO Market・外国株を除く)
    df = df[df["市場・商品区分"].isin(MARKET_IDS)]
    # 普通株のみに絞り込み (5桁コードの優先株・社債型種類株式を除く)
    codes = df["コード"].str.strip()
    df = df[codes.str.len() == COMMON_STOCK_CODE_LENGTH]

    stocks = {}
    for _, row in df.iterrows():
        code = row["コード"].strip()
        stocks[code] = {
            "code": code,
            "name": row["銘柄名"].strip(),
            "market": MARKET_IDS[row["市場・商品区分"]],
            "industry_name": row["33業種区分"],
        }

    logger.info(f"JPX 取得: {len(stocks)}件")
    return stocks


def fetch_db_stocks(conn):
    """DB の東証銘柄を {コード: 銘柄情報} で返す"""
    rows = conn.execute(
        f"""
        select code, name, market, industry, is_excluded
        from stocks
        where market in ({",".join("?" * len(TSE_MARKET_IDS))})
        """,
        TSE_MARKET_IDS,
    ).fetchall()
    return {row["code"]: dict(row) for row in rows}


def fetch_industry_ids(conn):
    """業種名 → industries テーブルの ID"""
    rows = conn.execute("select id, name from industries").fetchall()
    return {row["name"]: row["id"] for row in rows}


@log_call
def syncStockList(conn, dry_run=False):
    jpx_stocks = fetch_jpx_stocks()
    if not jpx_stocks:
        send_frontend_status("JPX から銘柄を取得できませんでした")
        logger.warning("JPX 取得が0件. 処理を終了")
        return

    db_stocks = fetch_db_stocks(conn)
    industry_ids = fetch_industry_ids(conn)

    # 差分を集計
    added = []  # 新規上場
    delisted = []  # 上場廃止 (JPX に無い)
    relisted = []  # 対象外フラグが立っているが JPX に存在する
    updated = []  # 銘柄名・市場・業種の変更

    send_frontend_status("差分を判定中...")

    for code, jpx in jpx_stocks.items():
        industry = industry_ids.get(jpx["industry_name"], OTHER_INDUSTRY_ID)
        db = db_stocks.get(code)

        if db is None:
            added.append({**jpx, "industry": industry})
        else:
            if db["is_excluded"] == 1:
                relisted.append({**jpx, "industry": industry})
            # 銘柄名・市場・業種の変更を検出
            if (
                db["name"] != jpx["name"]
                or db["market"] != jpx["market"]
                or db["industry"] != industry
            ):
                updated.append({**jpx, "industry": industry, "before": db})

    # DB にあって JPX に無い銘柄 = 上場廃止 (既に対象外の銘柄は除く)
    for code, db in db_stocks.items():
        if code not in jpx_stocks and db["is_excluded"] == 0:
            delisted.append(db)

    total_changes = len(added) + len(delisted) + len(relisted) + len(updated)
    send_frontend_status(
        f"差分: 新規 {len(added)}件 / 廃止 {len(delisted)}件 / "
        f"再開 {len(relisted)}件 / 情報更新 {len(updated)}件"
    )

    if total_changes == 0:
        send_frontend_status("変更はありませんでした")
        logger.info("差分なし")
        return

    if dry_run:
        for s in added:
            send_frontend_log(f"[追加予定] {s['code']} {s['name']}")
        for s in delisted:
            send_frontend_log(f"[対象外予定] {s['code']} {s['name']}")
        for s in relisted:
            send_frontend_log(f"[対象外解除予定] {s['code']} {s['name']}")
        for s in updated:
            send_frontend_log(f"[情報更新予定] {s['code']} {s['name']}")
        send_frontend_status(
            f"[確認のみ] {total_changes}件の変更が可能です (DBは更新していません)"
        )
        logger.info(f"dry-run: {total_changes}件の差分")
        return

    # DB を更新
    done = 0
    try:
        # 新規上場を追加
        for s in added:
            conn.execute(
                """
                insert into stocks (code, name, market, industry)
                values (:code, :name, :market, :industry)
                on conflict (code) do nothing
                """,
                {k: s[k] for k in ("code", "name", "market", "industry")},
            )
            send_frontend_log(f"✓ 追加: {s['code']} {s['name']}")
            done += 1
            send_frontend_progress(done, total_changes, s["code"], s["name"])

        # 上場廃止を対象外にする (データは削除しない)
        for s in delisted:
            conn.execute(
                "update stocks set is_excluded = 1 where code = ?", (s["code"],)
            )
            send_frontend_log(f"✓ 対象外: {s['code']} {s['name']} (上場廃止)")
            done += 1
            send_frontend_progress(done, total_changes, s["code"], s["name"])

        # JPX に存在する銘柄の対象外フラグを解除
        for s in relisted:
            conn.execute(
                "update stocks set is_excluded = 0 where code = ?", (s["code"],)
            )
            send_frontend_log(f"✓ 対象外解除: {s['code']} {s['name']}")
            done += 1
            send_frontend_progress(done, total_changes, s["code"], s["name"])

        # 銘柄名・市場・業種の変更を反映
        for s in updated:
            conn.execute(
                """
                update stocks set name = :name, market = :market, industry = :industry
                where code = :code
                """,
                {k: s[k] for k in ("code", "name", "market", "industry")},
            )
            send_frontend_log(f"✓ 情報更新: {s['code']} {s['name']}")
            done += 1
            send_frontend_progress(done, total_changes, s["code"], s["name"])

        conn.commit()
    except Exception as e:
        conn.rollback()
        send_frontend_status(f"更新に失敗しました: {e}")
        logger.error(f"DB更新エラー: {e}")
        return

    send_frontend_status(
        f"[結果] 新規 {len(added)}件 / 対象外 {len(delisted)}件 / "
        f"対象外解除 {len(relisted)}件 / 情報更新 {len(updated)}件"
    )
    logger.info(
        f"同期完了: 新規 {len(added)}件, 対象外 {len(delisted)}件, "
        f"対象外解除 {len(relisted)}件, 情報更新 {len(updated)}件"
    )


###################
# main process
###################

if __name__ == "__main__":
    # --dry-run: DB を更新せず、差分の確認だけを行う
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    # SQLite 接続
    conn = connect_db()
    if conn is None:
        sys.exit(1)

    # 銘柄リストの同期
    syncStockList(conn, dry_run=args.dry_run)
    conn.close()
    sys.exit()
