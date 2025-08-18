# バッチ処理セットアップガイド

## 1. 環境変数の設定

### 必要な環境変数
```bash
# Supabaseの設定
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"

# オプション（Slack通知用）
export SLACK_WEBHOOK="your-slack-webhook-url"
```

### Supabase Service Keyの取得方法
1. Supabase Dashboard → Settings → API
2. "Project API keys" セクション
3. "service_role" キーをコピー（秘密鍵として扱う）

## 2. データベースセットアップ

### Step 1: pgvector拡張の有効化
Supabase Dashboard → SQL Editor で実行:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 2: 世代管理テーブルの作成
```bash
cd sake-search-nextjs
node scripts/setup-database.js
```

## 3. テスト実行

### Step 1: DRY RUNテスト
```bash
# API接続とハッシュ計算のテスト
node scripts/test-sync-dry-run.js
```

### Step 2: 初回同期（DRY RUN）
```bash
# 実際の処理をシミュレーション（データ更新なし）
DRY_RUN=true node scripts/sync-sake-data-with-history.js
```

### Step 3: 本番同期
```bash
# 実際にデータを更新
node scripts/sync-sake-data-with-history.js
```

## 4. GitHub Actions設定

### GitHub Secretsの追加
Repository → Settings → Secrets and variables → Actions

```
SUPABASE_URL: https://your-project.supabase.co
SUPABASE_SERVICE_KEY: your-service-role-key
SLACK_WEBHOOK: your-slack-webhook-url (オプション)
```

### 手動実行
1. Actions タブ
2. "Sync Sake Data with History"
3. "Run workflow"
4. DRY RUN: true でテスト実行

## 5. 監視・確認

### 同期履歴の確認
```sql
-- 最近の同期状況
SELECT 
  generation_id,
  sync_started_at,
  sync_status,
  inserted_count,
  updated_count,
  deleted_count
FROM sync_generations
ORDER BY sync_started_at DESC
LIMIT 10;
```

### 変更履歴の確認
```sql
-- 特定銘柄の変更履歴
SELECT 
  generation_id,
  operation,
  changed_fields,
  changed_at
FROM sake_master_history
WHERE brand_id = 1
ORDER BY changed_at DESC;
```

## 6. トラブルシューティング

### エラーパターンと対処法

#### "relation does not exist"
→ データベースセットアップが未完了
```bash
node scripts/setup-database.js
```

#### "permission denied"
→ SERVICE_KEYの権限不足
→ Dashboard設定を確認

#### "API fetch failed"
→ さけのわAPIの一時的な障害
→ しばらく時間をおいて再実行

### ログの確認
```bash
# 実行ログ
ls -la logs/
cat logs/sync-report-*.json
```

## 7. 定期実行の確認

GitHub Actionsは毎日AM2:00（JST）に自動実行されます。

### 実行結果の確認
1. Actions タブで実行履歴を確認
2. Artifacts から詳細レポートをダウンロード
3. Slack通知（設定した場合）

### 緊急時の対応
```bash
# 手動で最新データに同期
# GitHub Actions → "Run workflow" → DRY RUN: false
```