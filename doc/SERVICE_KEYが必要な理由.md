# SERVICE_KEYが必要な理由

## 現在の設定と制限

### 既存の.env.local
```bash
# フロントエンド用（権限制限あり）
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ANON_KEY の制限

#### 1. Row Level Security (RLS) の制約
```sql
-- 既存のポリシー例
CREATE POLICY "Users can view own favorites" 
  ON favorites FOR SELECT 
  USING (auth.uid() = user_id);
```

**ANON_KEYでできること**:
- ✅ ユーザー自身のお気に入りの読み書き
- ✅ 公開されているデータの読み取り

**ANON_KEYでできないこと**:
- ❌ 全ユーザーのデータの読み取り
- ❌ システムテーブルの作成・変更
- ❌ 管理者専用の操作

#### 2. バッチ処理で必要な操作

```javascript
// バッチ処理で実行したい操作
async function syncSakeData() {
  // ❌ ANON_KEYでは権限不足で失敗
  
  // 1. 新しいテーブルの作成
  await supabase.rpc('CREATE TABLE sake_master...');
  
  // 2. 全レコードの一括更新
  await supabase.from('sake_master').upsert(allData);
  
  // 3. システム管理用テーブルへの書き込み
  await supabase.from('sync_generations').insert({...});
  
  // 4. pgvectorインデックスの作成
  await supabase.rpc('CREATE INDEX...');
}
```

## SERVICE_KEY が必要な具体的な理由

### 1. テーブル作成・変更権限

```sql
-- バッチ処理で作成するテーブル
CREATE TABLE sake_master (
  id VARCHAR(50) PRIMARY KEY,
  brand_id INTEGER NOT NULL,
  -- ... 他のフィールド
);

-- ANON_KEY: ❌ permission denied for schema public
-- SERVICE_KEY: ✅ 実行可能
```

### 2. RLS (Row Level Security) のバイパス

```sql
-- 既存のfavoritesテーブル
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- ANON_KEYの場合
SELECT * FROM favorites; 
-- ❌ 自分のデータのみ（auth.uid() = user_id）

-- SERVICE_KEYの場合  
SELECT * FROM favorites;
-- ✅ 全ユーザーのデータを取得可能（RLS無視）
```

### 3. 大量データの一括操作

```javascript
// 3,167件のデータを一括更新
const { error } = await supabase
  .from('sake_master')
  .upsert(allSakeData);

// ANON_KEY: ❌ 件数制限・権限制限でエラー
// SERVICE_KEY: ✅ 一括操作が可能
```

### 4. システム関数の実行

```sql
-- pgvector拡張の有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- ベクトルインデックスの作成
CREATE INDEX idx_flavor_vector ON sake_master 
USING ivfflat (flavor_vector vector_cosine_ops);

-- ANON_KEY: ❌ 拡張・インデックス作成権限なし
-- SERVICE_KEY: ✅ システム管理操作が可能
```

## 権限比較表

| 操作 | ANON_KEY | SERVICE_KEY |
|------|----------|-------------|
| **ユーザーデータ読み取り** | 自分のみ | 全ユーザー |
| **テーブル作成** | ❌ | ✅ |
| **スキーマ変更** | ❌ | ✅ |
| **大量データ更新** | 制限あり | ✅ |
| **システム関数実行** | ❌ | ✅ |
| **RLS無視** | ❌ | ✅ |
| **拡張機能管理** | ❌ | ✅ |

## 実際のエラー例

### ANON_KEYで実行した場合

```javascript
// データベースセットアップ
npm run db:setup

// エラー例:
// ❌ permission denied for relation sake_master
// ❌ must be owner of extension vector
// ❌ permission denied for schema public
// ❌ insufficient privilege to create table
```

### SERVICE_KEYで実行した場合

```javascript
// データベースセットアップ
npm run db:setup

// 成功例:
// ✅ pgvector拡張は既に有効です
// ✅ テーブル作成完了
// ✅ インデックス作成完了
// ✅ データベースセットアップが完了しました！
```

## セキュリティ考慮事項

### なぜSERVICE_KEYは秘密情報？

```javascript
// SERVICE_KEYがあれば以下も可能
await supabase.from('users').select('*');           // 全ユーザー情報
await supabase.from('favorites').delete().neq('id', 0); // 全データ削除
await supabase.rpc('DROP TABLE sake_master');       // テーブル削除
```

### 適切な使用場所

| 環境 | ANON_KEY | SERVICE_KEY |
|------|----------|-------------|
| **ブラウザ** | ✅ 安全 | ❌ 絶対NG |
| **サーバー** | 制限あり | ✅ 適切 |
| **バッチ処理** | ❌ 権限不足 | ✅ 必須 |
| **GitHub Actions** | ❌ 権限不足 | ✅ Secrets使用 |

## 代替案の検討

### Option 1: ANON_KEYのまま手動セットアップ
```sql
-- Supabase Dashboardで手動実行
CREATE TABLE sake_master (...);
CREATE INDEX ...;
-- その後ANON_KEYでデータ更新のみ
```

**問題点**:
- ❌ テーブル構造変更時に手動作業が必要
- ❌ 自動化できない
- ❌ 世代管理テーブルへのアクセス不可

### Option 2: 制限されたSERVICE_KEY
残念ながらSupabaseでは権限を制限したSERVICE_KEYは作成できません。

## 結論

**SERVICE_KEYが必要な理由**:

1. **テーブル作成**: 世代管理用の新しいテーブルが必要
2. **pgvector**: ベクトル検索用の拡張とインデックス
3. **大量データ操作**: 3,167件の一括更新
4. **システム管理**: 同期ログやエラー管理
5. **自動化**: 人の手を介さない完全自動実行

**ANON_KEYだけでは、バッチ処理の核心部分が実行できません。**

SERVICE_KEYは「データベース管理者」として、ANON_KEYは「一般ユーザー」として適切に使い分けることで、安全で強力なシステムを構築できます。