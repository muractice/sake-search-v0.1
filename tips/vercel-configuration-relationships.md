# Vercel設定の関係性：Root Directory・vercel.json・package.json

## 概要
Vercelでのデプロイ設定における3つの重要要素の関係性と優先順位、競合パターンについて解説。

## 基本概念

### 1. Root Directory（Vercelダッシュボード設定）
- **場所**: Vercelダッシュボード → Project Settings → General → Build & Development Settings
- **役割**: Vercelがビルドを実行する起点ディレクトリを指定
- **デフォルト**: 空欄（= Gitリポジトリのルート）

### 2. vercel.json
- **場所**: Gitリポジトリ内の任意の場所
- **役割**: ビルド設定、ルーティング、関数設定などを定義
- **優先度**: 高い（ダッシュボード設定を上書き可能）

### 3. package.json
- **場所**: Node.jsプロジェクトのルートディレクトリ
- **役割**: 依存関係、scripts、プロジェクト情報を定義
- **重要性**: Vercelがプロジェクトタイプを判定する基準

### 4. Framework Settings（Vercelダッシュボード設定）
- **場所**: Vercelダッシュボード → Project Settings → General → Build & Development Settings
- **役割**: フレームワーク固有のビルド設定を定義
- **構成要素**:
  - Framework Preset（Next.js、React、Vue.js等）
  - Build Command
  - Output Directory  
  - Install Command
  - Development Command

---

## 設定の読み込み順序と優先度

### 優先順位（高い順）
1. **vercel.json** の明示的設定
2. **Framework Settings**（Vercelダッシュボード）の手動設定
3. **Framework Preset** のデフォルト設定
4. **自動検出** （package.jsonから推測）

### 読み込みプロセス
```
1. Gitリポジトリをクローン
2. Root Directoryが設定されていれば、そこに移動
3. package.jsonを探してプロジェクトタイプを判定（Next.js、React等）
4. Framework Presetのデフォルト設定を適用
   - Next.js: Build Command = "next build", Output Directory = ".next"
   - React: Build Command = "npm run build", Output Directory = "build"
5. Framework Settings（ダッシュボード）の手動設定で上書き
6. vercel.jsonを探して読み込み、最終上書き
```

---

## パターン別の設定例

### パターン1: シンプルな単一プロジェクト
```
my-app/
├── package.json
├── vercel.json (optional)
├── src/
└── .git/
```

**設定**:
- **Root Directory**: 空欄
- **vercel.json**: 不要（自動検出）
- **結果**: package.jsonから自動判定

---

### パターン2: モノレポ - 各プロジェクトにvercel.json
```
monorepo/
├── packages/
│   ├── frontend/
│   │   ├── package.json
│   │   └── vercel.json
│   └── admin/
│       ├── package.json
│       └── vercel.json
└── .git/
```

**設定**:
- **Root Directory**: `packages/frontend` または `packages/admin`
- **vercel.json**: 各ディレクトリに配置
- **結果**: プロジェクト固有の設定

---

### パターン3: モノレポ - ルートにvercel.json（今回のケース）
```
sake-search/
├── admin-dashboard/
│   └── package.json
├── sake-search-nextjs/
│   └── package.json
├── vercel.json
└── .git/
```

**設定**:
- **Root Directory**: 空欄
- **vercel.json**: ルートに配置、パス明示
- **結果**: vercel.jsonでディレクトリ指定

---

## Framework Settingsの詳細

### Framework Preset別のデフォルト設定

#### Next.js
```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next", 
  "installCommand": "npm install",
  "devCommand": "next dev --port $PORT"
}
```

#### React (Create React App)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "installCommand": "npm install", 
  "devCommand": "npm start"
}
```

#### Vue.js
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run serve"
}
```

### Framework Settings の設定項目

#### 1. Framework Preset
- **Other**: 自動検出なし、手動設定が必要
- **Next.js**: Next.jsプロジェクト用の最適化設定
- **Create React App**: CRA用の設定
- **Vue.js**: Vue CLI/Vite用の設定
- **Nuxt.js**: Nuxtプロジェクト用の設定
- **その他**: Svelte、Angular、Gatsby等

#### 2. Build Command
- **役割**: プロダクションビルドを実行するコマンド
- **例**: `npm run build`, `next build`, `yarn build`
- **注意**: package.jsonのscriptsと整合性が必要

#### 3. Output Directory
- **役割**: ビルド成果物の出力先ディレクトリ
- **例**: `.next`, `build`, `dist`, `out`
- **重要**: 実際のビルド出力先と一致必須

#### 4. Install Command
- **役割**: 依存関係をインストールするコマンド
- **例**: `npm install`, `yarn install`, `pnpm install`
- **最適化**: `npm ci`（CI環境用）が推奨

#### 5. Development Command
- **役割**: 開発サーバーを起動するコマンド（Vercel Dev用）
- **例**: `next dev`, `npm start`, `npm run dev`
- **環境変数**: `$PORT`が利用可能

---

## 設定の競合パターンと解決策

### 競合パターン1: Root Directory vs vercel.json
**問題**:
```
Root Directory: "frontend"
vercel.json (ルートに配置): { "buildCommand": "cd backend && npm run build" }
```

**結果**: Vercelは`frontend/`に移動後、`cd backend`を実行 → 失敗

**解決策**:
- Root Directoryを空欄にする
- または、vercel.jsonを適切な場所に移動

### 競合パターン2: 複数のvercel.json
**問題**:
```
/vercel.json
/frontend/vercel.json
```

**結果**: どちらが優先されるか不明確

**解決策**:
- 一つのvercel.jsonのみ使用
- Root Directory設定と整合性を保つ

### 競合パターン3: Framework Settings vs vercel.json
**問題**:
```
Framework Settings: Build Command = "npm run build"
vercel.json: { "buildCommand": "next build" }
```

**結果**: vercel.jsonが優先され、`next build`が実行される

**解決策**:
- vercel.jsonで統一する（推奨）
- またはvercel.jsonから該当設定を削除

### 競合パターン4: package.json検出エラー
**問題**:
```
Error: No Next.js version detected
Warning: Could not identify Next.js version
```

**原因**:
- Root Directoryとpackage.jsonの場所が不整合
- Framework Presetが正しく検出されていない
- vercel.jsonのパス指定が間違っている

**解決策**:
- パスの整合性を確認
- Framework Presetを手動設定
- 明示的なinstallCommand指定

---

## ベストプラクティス

### 1. 単一プロジェクトの場合
```
✅ 推奨
Root Directory: 空欄
vercel.json: なし（自動検出に任せる）

❌ 避ける
Root Directory: 設定 + vercel.json: ルートに配置
```

### 2. モノレポの場合

#### オプションA: Root Directory方式
```
✅ 推奨
Root Directory: "packages/app"
vercel.json: packages/app/vercel.json

❌ 避ける
Root Directory: "packages/app"
vercel.json: ルートに配置
```

#### オプションB: ルートvercel.json方式（今回採用）
```
✅ 推奨
Root Directory: 空欄
vercel.json: ルートに配置、明示的パス指定
{
  "buildCommand": "cd packages/app && npm run build",
  "outputDirectory": "packages/app/.next",
  "installCommand": "cd packages/app && npm install"
}
```

### 3. 設定の一貫性チェック
```bash
# 確認すべき項目
1. Root Directory設定の場所
2. vercel.jsonの配置場所
3. package.jsonの場所
4. buildCommand/installCommandのパス
5. outputDirectoryのパス
```

---

## トラブルシューティング手順

### 1. 設定の可視化
```bash
# 現在の設定を確認
npx vercel inspect <deployment-url>

# ローカル設定の確認
cat .vercel/project.json
```

### 2. パスの検証
```bash
# vercel.jsonで指定したパスが存在するか確認
ls -la packages/frontend/package.json

# ビルドコマンドを手動実行
cd packages/frontend && npm run build
```

### 3. 段階的テスト
```bash
# 1. 最小構成でテスト
echo '{"framework": "nextjs"}' > vercel.json

# 2. 段階的に設定を追加
# buildCommand → installCommand → outputDirectory
```

---

## 実際の設定例

### 成功例（今回のプロジェクト）
```json
// vercel.json (Gitルートに配置)
{
  "framework": "nextjs",
  "buildCommand": "cd sake-search-nextjs && npm run build",
  "outputDirectory": "sake-search-nextjs/.next",
  "installCommand": "cd sake-search-nextjs && npm install"
}
```

```
Vercelダッシュボード設定:
- Root Directory: 空欄
- Framework: Next.js
- Node.js Version: 20.x
```

```
結果:
1. Vercelがリポジトリルートから開始
2. vercel.jsonを読み込み
3. "cd sake-search-nextjs && npm install" でインストール
4. sake-search-nextjs/package.json でNext.js検出
5. "cd sake-search-nextjs && npm run build" でビルド
6. sake-search-nextjs/.next をデプロイ
```

---

## まとめ

### 重要なポイント
1. **一貫性が最重要**: Root Directory・vercel.json・package.jsonの場所が整合していること
2. **シンプルな設定を優先**: 複雑な設定は問題の温床
3. **明示的な指定**: 自動検出に頼らず、パスを明確に指定
4. **段階的テスト**: 最小構成から始めて徐々に追加

### 設定チェックリスト
- [ ] Root Directory設定とvercel.jsonの場所が整合している
- [ ] vercel.jsonのパス指定が正確
- [ ] package.jsonが指定された場所に存在する
- [ ] buildCommand/installCommandが手動実行で成功する
- [ ] outputDirectoryに成果物が生成される

**適切な設定により、Vercelの強力なモノレポサポートを最大限活用できます。**