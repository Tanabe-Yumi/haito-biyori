import functools
import json
import logging
import os
import signal
import warnings

from dotenv import load_dotenv
from supabase import create_client

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


@log_call
def load_env():
    """環境変数の読み込み"""
    load_dotenv("../.env.local")


@log_call
def connect_supabase():
    """Supabase接続"""
    send_frontend_status("データベース接続中...")

    # 環境変数読み込み
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    # 環境変数が設定されていない場合は終了
    missing = []
    if not supabase_url:
        missing.append("NEXT_PUBLIC_SUPABASE_URL")
    if not supabase_key:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if missing:
        send_frontend_status("データベース接続失敗。少し待ってリトライしてください。")
        logger.error(f"Supabase環境変数が設定されていません: {', '.join(missing)}")
        return None

    return create_client(supabase_url, supabase_key)


@log_call
def fetch_stocks_from_db(supabase):
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
