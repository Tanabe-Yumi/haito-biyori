# 配当びより (Haito Biyori)

日本の高配当株投資をサポートするための分析・管理アプリケーションです。  
独自に収集した各種財務データと株価指標に基づき、高配当銘柄の選定や詳細な分析を直感的なUIで行うことができます。

## 概要

高配当株の分析手法とモダンなWeb技術を組み合わせて開発された、日本の高配当株に特化したWebアプリケーションです。  
単なる情報表示にとどまらず、**「高速なフィルタリング・検索体験」「データの視覚化」「自動化されたデータ収集パイプライン」**を一気通貫で構築し、複雑な株式データを分かりやすく整理しています。

## 主な機能

- **条件に合った銘柄をサクサク検索**:
  - 気になる条件（配当利回り、業種など）で素早く絞り込みや並び替えが可能。検索条件はURLとして保存・共有できるため、いつでもお気に入りの検索結果を呼び出せます。
- **直感的にわかるデータ視覚化**:
  - 複雑な財務状況や過去の配当推移などを、レーダーチャートやグラフで分かりやすく表示。有望な銘柄を視覚的にパッと発掘できます。
- **快適な使い心地とダークモード対応**:
  - PCでもスマートフォンでも見やすく、洗練されたデザイン。端末のテーマ設定に合わせたダークモードにも完全対応しており、長時間の分析でも目が疲れにくい設計です。
- **最新データに基づく独自スコアリング**:
  - 定期的なデータ自動更新により、最新の株価や企業情報を取得。独自のアルゴリズムで算出したスコアを活用して、次の投資先選びを強力にサポートします。

## 技術スタック (Tech Stack)

このプロジェクトは、フロントエンドからバックエンドAPI、データ収集バッチまで、最新のモダン技術スタックを採用して構築しています。  
フロントエンドはタイプセーフで保守性の高いReactエコシステムを中心に、バックエンド・インフラはBaaSを活用して俊敏な開発を実現しました。フルスタックでの開発力と、ユーザー体験を損なわないモダンなUI構築スキルを活かしています。

### フロントエンド (Frontend)

- **フレームワーク (Framework)**: [Next.js](https://nextjs.org/) (App Router, v16)
- **UIライブラリ (UI Library)**: [React](https://react.dev/) (v19)
- **言語 (Language)**: TypeScript
- **スタイリング (Styling)**: Tailwind CSS v4
- **コンポーネントライブラリ (Component Library)**: shadcn/ui, Radix UI
- **アイコン (Icons)**: Lucide React
- **データテーブル (Data Table)**: TanStack Table v8
- **状態管理 (State Management)**: nuqs (Type-safe search params state)
- **データ可視化 (Data Visualization)**: Recharts

### バックエンド・データベース (Backend & Database)

- **BaaS / データベース (Database)**: [Supabase](https://supabase.com/) (PostgreSQL)
  - 認証やデータベースの提供、フロントからのセキュアなエンドポイント通信

### データ収集・分析パイプライン (Data Pipeline)

- **言語 (Language)**: Python 3.10+
- **データ収集 (Data Collection)**: `yfinance`
- **データ分析 (Data Analysis)**: `pandas`, `scipy`
- **データベース接続 (Database Connection)**: `supabase-python`

## ローカル環境構築 (Getting Started)

### 1. 前提条件 (Prerequisites)

- [Node.js](https://nodejs.org/ja/) (v20以上推奨)
- [Python](https://www.python.org/) (バッチ処理用)
- Supabase アカウントとプロジェクト

### 2. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、Supabaseの接続情報を設定

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. DB設定

`supabase/schema.sql` を実行し、DBの設定を実施

### 4. フロントエンドの起動

npm を使用してパッケージをインストールし、開発サーバーを起動

```bash
# パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

起動後、ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスするとアプリケーションを確認できます。

### 5. (任意) 初期データの投入

Supabaseへ初期データを投入

1. `data/` ディレクトリにインポート用のCSVファイル（`stocks.csv` や `financial_history.csv`）を配置
2. プロジェクトのルートディレクトリで以下のコマンドを実行し、データを投入

```bash
# 銘柄データのインポート
npx tsx scripts/import_stocks.ts

# 財務履歴データのインポート
npx tsx scripts/import_financial_history.ts
```

※「銘柄データ」「財務履歴データ」は手元のデータからのインポートのみ対応しています。システムでの収集は行いません。

### 6. (任意) Pythonデータ収集バッチの実行

データ収集・分析を行うPythonスクリプトを実行

```bash
cd python

# 仮想環境の作成と有効化 (macOS/Linux)
python -m venv venv
source venv/bin/activate
# Windowsの場合は `venv\Scripts\activate`

# 依存関係のインストール
pip install -r requirements.txt

# 最新の「株価」「配当利回り」を取得
python fetchStockPrices.py

# 財務履歴データをもとにスコアリング
python calculateScores.py
```

## 開発の背景

本プロジェクトは、個人開発としてモダンなWeb技術への取り組みの一環として、**パフォーマンスやユーザー体験を意識した設計**を行っています。  
また、Pythonを用いたデータ前処理・保存パイプラインを自作し、フルスタックの全体像（データ取得 → バックエンドへの蓄積 → フロントエンドでの描画）を網羅的に構築できるアーキテクチャ設計および実装力をアピールできる構成としています。
