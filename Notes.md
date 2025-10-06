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
        name: fastapi
        runtime: python
        plan: free # 無料プラン
        repo: https://github.com/your-username/your-repo-name # 自身のGitHubリポジトリ
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

## 5. 自動デプロイの仕組み

`main`ブランチへのpushで、VercelとRenderがそれぞれ自動でビルド＆デプロイを実行。

## 6. トラブルシューティング

-   **エラー:** `Failed to fetch`
-   **原因:** Vercelの環境変数 `NEXT_PUBLIC_API_URL` が未設定、またはURLが誤っている可能性。
-   **解決策:** 手順4に戻り、RenderのURLがVercelの環境変数に正しく設定されているか確認。
