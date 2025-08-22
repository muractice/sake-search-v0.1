# Supabase マイグレーションガイド

## Phase2 都道府県マップ機能のデータベース設定

### 概要
都道府県データを、Sake NoWaのマスターデータとJOINする方式に変更しました。
これにより、データの重複を避け、常に最新の蔵元・地域情報を参照できます。

### 実行手順

#### 1. Supabaseでマイグレーションを実行

以下のSQLをSupabaseのSQL Editorで順番に実行してください。

##### ステップ1: 蔵元・地域マスターテーブルを作成
```sql
-- ファイル: supabase/migrations/create_breweries_areas_tables.sql
-- このファイルの内容をSupabaseのSQL Editorで実行
```

##### ステップ2: drinking_recordsテーブルを修正
```sql
-- ファイル: supabase/migrations/modify_drinking_records_for_join.sql
-- このファイルの内容をSupabaseのSQL Editorで実行
```

#### 2. マスターデータを同期

蔵元と地域データをSake NoWaから取得してSupabaseに保存します。

```bash
# 環境変数を確認（.env.localに以下が必要）
# NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# スクリプトを実行
node scripts/sync-breweries-areas.js
```

期待される出力：
```
🍶 Sake NoWa データ同期スクリプト
================================

📍 地域データの同期を開始...
  取得した地域数: 47
✅ 47件の地域データを同期しました

🏭 蔵元データの同期を開始...
  取得した蔵元数: 1800+
  バッチ 1: 500件挿入
  バッチ 2: 500件挿入
  ...
✅ 1800+件の蔵元データを同期しました

📊 統計情報を取得中...

=== 同期結果 ===
地域数: 47
蔵元数: 1800+

地域別蔵元数（上位10）:
  新潟県: 90蔵
  長野県: 80蔵
  ...

✨ 同期完了（処理時間: XX秒）
```

### データベース構造

#### 新しいテーブル構造

```
areas (地域マスター)
├── id: INTEGER (PRIMARY KEY)
├── name: VARCHAR(20) 
├── created_at: TIMESTAMP
└── updated_at: TIMESTAMP

breweries (蔵元マスター)
├── id: INTEGER (PRIMARY KEY)
├── name: VARCHAR(255)
├── area_id: INTEGER (FOREIGN KEY -> areas.id)
├── created_at: TIMESTAMP
└── updated_at: TIMESTAMP

drinking_records (飲酒記録)
├── id: UUID
├── user_id: UUID
├── sake_id: VARCHAR(255)
├── sake_name: VARCHAR(255)
├── sake_brewery: VARCHAR(255)
├── brewery_id: INTEGER (FOREIGN KEY -> breweries.id) ← 新規追加
├── date: DATE
├── rating: INTEGER
├── memo: TEXT
├── created_at: TIMESTAMP
└── updated_at: TIMESTAMP
```

#### ビュー

```sql
drinking_records_with_area
-- drinking_records + breweries + areas をJOINしたビュー
-- 記録取得時はこのビューを使用することで、都道府県情報も同時に取得
```

### データの流れ

1. **記録作成時**
   - ユーザーが日本酒を記録
   - SakeDataから`breweryId`を取得
   - drinking_recordsに`brewery_id`として保存

2. **記録取得時**
   - `drinking_records_with_area`ビューから取得
   - 自動的にbreweries、areasテーブルとJOIN
   - 都道府県名（area_name）が含まれた状態で取得

3. **統計集計時**
   - 記録データのarea_nameを使用して都道府県別に集計
   - 制覇率、ランキングなどを算出

### 定期同期（将来実装）

現在は手動実行ですが、将来的には以下のような定期実行を想定：

```javascript
// 例：Vercelのcron jobsで毎日午前3時に実行
// vercel.json
{
  "crons": [{
    "path": "/api/sync-breweries",
    "schedule": "0 3 * * *"
  }]
}
```

### トラブルシューティング

#### Q: マイグレーション実行時にエラーが出る
A: 既存のテーブルやカラムが存在する可能性があります。`IF NOT EXISTS`句があるので基本的には問題ありませんが、エラーメッセージを確認してください。

#### Q: 同期スクリプトが失敗する
A: 環境変数を確認してください。特に`SUPABASE_SERVICE_ROLE_KEY`が必要です。

#### Q: 記録作成時にbrewery_idがnullになる
A: Sake NoWaのAPIデータにbreweryIdが含まれているか確認してください。

#### Q: 都道府県が表示されない
A: drinking_records_with_areaビューが正しく作成されているか確認してください。

### メンテナンス

#### マスターデータの更新
```bash
# 手動で実行（月1回程度を推奨）
node scripts/sync-breweries-areas.js
```

#### データの整合性チェック
```sql
-- brewery_idがnullの記録を確認
SELECT COUNT(*) FROM drinking_records WHERE brewery_id IS NULL;

-- 地域情報がない蔵元を確認
SELECT COUNT(*) FROM breweries WHERE area_id IS NULL;
```