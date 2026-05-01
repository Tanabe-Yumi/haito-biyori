# 高配当株データ処理スクリプト (Python)

Supabase と連携し、株価データの取得およびスコアリングを行う Python スクリプト群です。  
フロントエンド（Next.js）から API 経由でリアルタイムに実行することもできます。

## スクリプト構成

| ファイル | 内容 |
|---|---|
| `fetchStockPrices.py` | Yahoo Finance から最新の株価・配当利回りを取得し、`stocks` テーブルを更新 |
| `calculateScores.py` | `financial_history` の過去データを集計し、スコアを `scores` テーブルに保存 |
| `common.py` | Supabase クライアント生成・ログ設定・中断処理など、各スクリプト共通のユーティリティ |

## セットアップ

### 1. Python 環境構築

> **重要**: Turbopack との互換性のため、`--copies` オプションが必要です。  
> 通常の `python -m venv venv` で作成した venv は Next.js のビルド時にエラーになります。

```bash
cd python

# --copies を付けて venv を作成（シンボリックリンクではなくバイナリのコピーを使用）
python -m venv --copies venv

# 依存パッケージをインストール
./venv/bin/pip install -r requirements.txt
```

### 2. 環境変数設定

プロジェクトルートの `.env.local` に以下を設定します。Python スクリプトは `python-dotenv` 経由でこのファイルを参照します。

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 実行方法

### フロントエンドから実行（推奨）

管理画面（`/admin`）のボタンから実行できます。SSE（Server-Sent Events）でリアルタイムにログを受信でき、実行中のキャンセルも可能です。

| 機能 | API ルート |
|---|---|
| 株価更新 | `GET /api/exec/fetch-stocks` |
| スコア再計算 | `GET /api/exec/calc-scores` |
| キャンセル | `POST /api/exec/fetch-stocks` または `POST /api/exec/calc-scores` |

### ローカルから直接実行

```bash
cd python
source venv/bin/activate  # macOS/Linux
# または venv\Scripts\activate  # Windows

python fetchStockPrices.py
python calculateScores.py
```

### GitHub Actions での自動実行

`.github/workflows/fetch-stock-prices.yml` によって定期的に株価取得が自動実行されます。

## 処理内容詳細

### 株価取得 (`fetchStockPrices.py`)

- `stocks` テーブルから銘柄リストを取得
- 各銘柄について `yfinance` で現在の株価・配当利回りを取得
- `stocks` テーブルの `price`、`dividend_yield`、`updated_at` を更新
- API 制限を避けるため、リクエスト間に待機時間を設定

### スコア計算 (`calculateScores.py`)

- `financial_history` テーブルから全年度の財務情報を取得
- `pandas` / `scipy` を使用して売上成長性（傾き）や営業利益率（EWMA）などを分析
- 8 指標（売上・営利・EPS・営業CF・一株配当・配当性向・自己資本・現金）を 5 段階評価（計 40 点満点）
- 結果を `scores` テーブルに UPSERT
- 財務データが不足している銘柄にはデフォルトスコアを適用
