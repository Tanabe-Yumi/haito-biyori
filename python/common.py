import functools
import json
import logging
import os
import signal
import sqlite3
import warnings
from pathlib import Path

###################
# ログ設定
###################

# FutureWarning を無視
warnings.simplefilter("ignore", FutureWarning)

# common モジュールの logger
# 呼び出し元のログファイルに出力される
logger = logging.getLogger(__name__)

###################
# 中断処理
###################

# 中断フラグ (フロントから受け取り)
stopRequested = False


def handleInterrupt(signum, frame):
    """中断処理"""
    global stopRequested
    print(json.dumps({"type": "status", "message": "処理を中断します"}))
    stopRequested = True


# 信号: SIGINT を受け取ったときに handleInterrupt を実行
signal.signal(signal.SIGINT, handleInterrupt)

###################
# util functions
###################


def make_log_decorator(logger_arg):
    """logger を受け取り、log_call デコレータを返す"""

    def log_call(func):
        """関数の前後にログ出力
        関数定義の1つ上の行に`@log_call`を記述するとログ出力が可能
        """

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            logger_arg.info(f"{func.__name__}: start")
            result = func(*args, **kwargs)
            logger_arg.info(f"{func.__name__}: end")
            return result

        return wrapper

    return log_call


# common モジュール内の関数用の log_call
log_call = make_log_decorator(logger)


def send_frontend_message(msgObj):
    """フロントへのメッセージ"""
    print(json.dumps(msgObj))


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


def send_frontend_status(msg: str):
    """フロントへのメッセージ (type: status)"""
    send_frontend_message({"type": "status", "message": msg})


def send_frontend_log(msg: str):
    """フロントへのメッセージ (type: log)"""
    send_frontend_message({"type": "log", "message": msg})


###################
# functions
###################


def get_db_path():
    """SQLite の DB ファイルパスを取得
    環境変数 SQLITE_DB_PATH で上書き可能
    """
    env_path = os.getenv("SQLITE_DB_PATH")
    if env_path:
        return Path(env_path)

    # リポジトリルート/data/haito-biyori.db
    return Path(__file__).resolve().parent.parent / "data" / "haito-biyori.db"


@log_call
def connect_db():
    """SQLite接続"""
    send_frontend_status("データベース接続中...")

    db_path = get_db_path()

    # DB ファイルが存在しない場合は終了 (アプリ側/移行スクリプトで作成される)
    if not db_path.exists():
        send_frontend_status("データベース接続失敗。DBファイルが見つかりません。")
        logger.error(f"SQLite の DB ファイルが見つかりません: {db_path}")
        return None

    conn = sqlite3.connect(db_path)
    # カラム名でアクセスできるようにする
    conn.row_factory = sqlite3.Row
    conn.execute("pragma foreign_keys = on")
    return conn


@log_call
def fetch_stocks_from_db(conn):
    """SQLite から銘柄リストを取得"""
    try:
        rows = conn.execute("select code, name from stocks order by code").fetchall()
        return [dict(row) for row in rows]
    except Exception as e:
        logger.warning(f"銘柄リスト取得エラー: {e}")
    return []
