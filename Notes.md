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

## 7. CI/CD と開発環境の設定

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

### b. ローカル開発環境の自動整形 (Husky & lint-staged)

Gitコミット時に、ステージングされたファイルに対して自動で`eslint`を実行し、コードスタイルを統一します。

1.  **必要なパッケージのインストール:**
    `frontend`ディレクトリで以下を実行。

    ```bash
    npm install --save-dev husky lint-staged
    ```

2.  **`package.json`の設定:**
    `scripts`と`lint-staged`の設定を追加。

    ```json
    // frontend/package.json

    "scripts": {
      // ...
      "prepare": "husky"
    },
    "lint-staged": {
      "*.{ts,tsx}": [
        "eslint --fix"
      ]
    }
    ```

3.  **Huskyの設定:**
    `frontend`ディレクトリで以下を実行し、`pre-commit`フックを作成。

    ```bash
    npx husky init
    echo "npx lint-staged" > .husky/pre-commit
    ```
