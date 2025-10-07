# Vercel & Render 自動デプロイ設定メモ

Next.js（フロントエンド）とFastAPI（バックエンド）のモノリポ構成アプリを、VercelとRenderに自動デプロイするための手順。

## 1. プロジェクト初期設定

1.  **ディレクトリ作成:**
    `frontend`と`backend`ディレクトリをルートに作成。

2.  **バックエンド (FastAPI) セットアップ:**
    *   `backend/main.py`: CRUD APIとSQLite設定を記述。
    *   `backend/requirements.txt`: `fastapi`, `uvicorn`, `databases[sqlite]`, `sqlalchemy` 等を記述。

3.  **フロントエンド (Next.js) セットアップ:**
    *   `frontend`内で`npx create-next-app`を実行。
    *   `frontend/src/app/page.tsx`: APIと通信するメモアプリUIを実装。

4.  **.gitignore作成:**
    ルートに`.gitignore`を作成。`node_modules`, `.next`, `.venv`等をバージョン管理から除外。

## 2. バックエンド (Render) デプロイ設定

1.  **`render.yaml`作成:**
    プロジェクトルートに作成。`plan: free`で無料プランを指定。

    ```yaml
    services:
      - type: web
        name: <サービス名>-backend # 任意のサービス名
        runtime: python
        plan: free # 無料プラン
        repo: https://github.com/toyoshin5/vercel_render_test # 実際のGitHubリポジトリ
        branch: main
        buildCommand: "pip install -r backend/requirements.txt"
        startCommand: "uvicorn backend.main:app --host 0.0.0.0 --port $PORT"
    ```

2.  **Renderダッシュボード設定:**
    *   「New Blueprint Instance」からGitHubリポジトリを連携。
    *   `render.yaml`が自動検出されデプロイ開始。
    *   デプロイ完了後、発行されたURLをコピー。

## 3. フロントエンド (Vercel) デプロイ設定

1.  **Vercelダッシュボード設定:**
    *   「Add New... -> Project」からGitHubリポジトリをインポート。
    *   **Configure Project:**
        *   **Framework Preset:** `Next.js`
        *   **Root Directory:** `frontend`
    *   `Deploy`をクリック。

## 4. VercelとRenderの連携

1.  **Vercel環境変数設定:**
    *   プロジェクトの `Settings` > `Environment Variables` に移動。
    *   以下の環境変数を追加。
        *   **Name:** `NEXT_PUBLIC_API_URL`
        *   **Value:** 手順2でコピーしたRenderのURL
    *   保存すると自動で再デプロイ。

## 5. 自動デプロイ(CD)の仕組み

`main`ブランチへのpushで、VercelとRenderがそれぞれ自動でビルド＆デプロイを実行。

## 6. トラブルシューティング

-   **エラー:** `Failed to fetch`
-   **原因:** Vercelの環境変数 `NEXT_PUBLIC_API_URL` が未設定、またはURLが誤っている可能性。
-   **解決策:** 手順4に戻り、RenderのURLがVercelの環境変数に正しく設定されているか確認。

## 7. 開発環境のセットアップとローカル実行

新しい開発者がプロジェクトに参加した場合、以下の手順で環境をセットアップします。

1.  **セットアップスクリプトの実行:**
    プロジェクトのルートで以下のコマンドを実行します。これにより、必要な依存関係のインストールとGitフックの有効化が自動で行われます。

    ```bash
    bash setup.sh
    ```
    *初回実行時や、`setup.sh`自体に変更があった場合は、`chmod +x setup.sh`で実行権限を付与する必要があるかもしれません。*

2.  **バックエンドの実行:**
    *   仮想環境を有効化します。
        ```bash
        source backend/.venv/bin/activate
        ```
    *   FastAPIサーバーを起動します。
        ```bash
        uvicorn backend.main:app --reload
        ```
    *   ブラウザで `http://127.0.0.1:8000/docs` にアクセスすると、APIドキュメントが確認できます。

3.  **フロントエンドの実行:**
    *   `frontend`ディレクトリで開発サーバーを起動します。
        ```bash
        cd frontend
        npm run dev
        ```
    *   ブラウザで `http://localhost:3000` にアクセスすると、アプリケーションが表示されます。

## 8. CI/CD とコード品質

### a. CI (継続的インテグレーション) on GitHub Actions

`main`ブランチへのプルリクエスト時に、フロントエンドとバックエンドのビルドが通るかを自動でチェックします。

1.  **`.github/workflows`ディレクトリ作成:**
    プロジェクトルートに作成します。

2.  **`frontend-ci.yml` (フロントエンドCI):**
    `frontend`ディレクトリの変更を検知し、`npm install`, `npm run lint`, `npm run build` を実行します。

    ```yaml
    name: Frontend CI

    on:
      pull_request:
        branches:
          - main
        paths:
          - 'frontend/**'

    jobs:
      build:
        runs-on: ubuntu-latest

        steps:
          - name: Checkout repository
            uses: actions/checkout@v4

          - name: Set up Node.js
            uses: actions/setup-node@v4
            with:
              node-version: '20'

          - name: Install dependencies
            run: npm install
            working-directory: ./frontend

          - name: Run linter
            run: npm run lint
            working-directory: ./frontend

          - name: Build project
            run: npm run build
            working-directory: ./frontend
    ```

3.  **`backend-ci.yml` (バックエンドCI):**
    `backend`ディレクトリの変更を検知し、`pip install`を実行します。

    ```yaml
    name: Backend CI

    on:
      pull_request:
        branches:
          - main
        paths:
          - 'backend/**'

    jobs:
      build:
        runs-on: ubuntu-latest

        steps:
          - name: Checkout repository
            uses: actions/checkout@v4

          - name: Set up Python
            uses: actions/setup-python@v5
            with:
              python-version: '3.11'

          - name: Install dependencies
            run: pip install -r backend/requirements.txt
    ```

### b. コード品質チェック (pre-commit, Husky & lint-staged)

`setup.sh`を実行することで、Gitコミット時に自動でコード品質チェックが走る仕組み（Gitフック）が有効になります。

*   **Python (`.py`ファイル):**
    *   `pre-commit`フレームワークを利用します。
    *   `black`による自動フォーマットと、`flake8`による文法チェックが実行されます。
    *   設定はルートの`.pre-commit-config.yaml`に記述されています。

*   **Frontend (`.ts`, `.tsx`ファイル):**
    *   `husky`と`lint-staged`を利用します。
    *   `eslint --fix`が実行され、コードのチェックと自動修正が行われます。
    *   設定は`frontend/package.json`に記述されています。
