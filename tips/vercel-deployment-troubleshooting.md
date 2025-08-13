# Vercelデプロイ問題の完全解決ガイド

## 概要
複雑なGitリポジトリ構造（モノレポ風）でのNext.jsプロジェクトのVercelデプロイで発生した問題と、その解決プロセスの完全記録。

## プロジェクト構造
```
sake-search/ (Gitリポジトリルート)
├── admin-dashboard/
│   └── package.json
├── sake-search-nextjs/ (Next.jsプロジェクト)
│   ├── package.json
│   ├── app/
│   ├── components/
│   └── ...
├── vercel.json (最終配置場所)
└── .git/
```

## 発生した問題と解決策

### 1. **モノレポでのRoot Directory設定ミス**
**問題**: 同じGitリポジトリから複数のプロジェクトを作成していたが、Root Directory設定が正しくなかった

**現状**: 
- `sake-search-nextjs` プロジェクト
- `sake-search-v0-1` プロジェクト（別名）
- どちらも同じリポジトリを参照

**症状**: 
```
npm error path /vercel/path0/package.json
npm error errno -2
npm error enoent Could not read package.json
```

**根本原因**: 
- Vercelは公式にモノレポをサポートしている
- 問題は「重複接続」ではなく「Root Directory設定の誤り」

**解決策**: 
- 各プロジェクトで正しいRoot Directoryを設定
  - `admin-dashboard` → Root Directory: `admin-dashboard`
  - `sake-search-nextjs` → Root Directory: `sake-search-nextjs`
- または、不要なプロジェクトを削除して単一プロジェクトで運用

---

### 2. **Node.jsバージョン互換性問題**
**問題**: Node.js 22.x と Next.js 15.4.5 の互換性問題

**症状**:
```
Error: No Next.js version detected
Warning: Could not identify Next.js version
```

**解決策**: 
- Node.js **20.x** に変更
- Next.js 15.4.5は20.xで最も安定動作
- 22.xはまだNext.jsエコシステムで完全検証されていない

---

### 3. **Root Directory設定の混乱**
**問題**: Root Directory設定とvercel.jsonの競合

**試行錯誤**:
1. ❌ Root Directory: `sake-search-nextjs` → package.json見つからず
2. ❌ Root Directory: 空欄 + vercel.jsonなし → ディレクトリ構造認識できず
3. ✅ **Root Directory: 空欄 + vercel.jsonで明示的パス指定**

**最終解決策**:
- **Root Directory**: 空欄
- **vercel.json**: Gitルートに配置、パス明示

---

### 4. **vercel.json設定の問題**

#### 4.1 重複設定
**問題**: 2つのvercel.jsonが存在
- `/sake-search/vercel.json`
- `/sake-search/sake-search-nextjs/vercel.json`

**解決策**: サブディレクトリのvercel.jsonを削除

#### 4.2 不正なfunctions設定
**問題**:
```json
{
  "functions": {
    "sake-search-nextjs/pages/api/**/*.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

**エラー**: `Function Runtimes must have a valid version`

**解決策**: functions設定を削除（Next.jsでは不要）

#### 4.3 最終的な正解設定
```json
{
  "framework": "nextjs",
  "buildCommand": "cd sake-search-nextjs && npm run build",
  "outputDirectory": "sake-search-nextjs/.next",
  "installCommand": "cd sake-search-nextjs && npm install"
}
```

---

### 5. **ローカル設定とリモート設定の競合**

**問題**: 
- ローカル`.vercel`フォルダの古い設定
- Vercelプロジェクトの内部キャッシュ

**解決策**:
```bash
rm -rf .vercel
npx vercel link --yes
```

---

## 成功までのタイムライン

### フェーズ1: 初期問題の発見
- 手動デプロイ: ✅ 成功
- Git自動デプロイ: ❌ 失敗

### フェーズ2: 原因調査
- 重複Gitリポジトリ接続を発見
- Node.js 22.x問題を特定
- Root Directory設定の矛盾を確認

### フェーズ3: 段階的解決
1. 重複接続を解除
2. Node.js 20.xに変更
3. Root Directory設定を調整
4. vercel.json重複を解消
5. 設定の統一化

### フェーズ4: 最終成功
- 手動デプロイ: ✅ 成功（52秒）
- Git自動デプロイ: ✅ 成功

---

## 重要な学び

### 1. **モノレポ構造での鉄則**
- 各プロジェクトに適切なRoot Directoryを設定
- プロジェクト固有のvercel.jsonは各ディレクトリに配置
- Vercelは公式にモノレポをサポート（一つのリポジトリ→複数プロジェクト可能）
- Root Directory設定とvercel.jsonの競合を避ける

### 2. **Node.jsバージョン選択**
- 最新 ≠ 最適
- LTSバージョン（20.x）が安定
- Next.jsとの互換性を最優先

### 3. **デバッグのアプローチ**
- 手動デプロイから始める
- エラーメッセージの変化を注視
- 一つずつ設定を変更してテスト

### 4. **vercel.json設計原則**
- 最小限の設定から始める
- 明示的なパス指定
- 不要な設定は追加しない

---

## トラブルシューティングチェックリスト

### デプロイ失敗時の確認項目

1. **環境設定**
   - [ ] Node.jsバージョン（20.x推奨）
   - [ ] 重複Vercelプロジェクトの確認
   - [ ] Root Directory設定（通常は空欄）

2. **ファイル構成**
   - [ ] vercel.jsonの重複チェック
   - [ ] package.jsonの場所確認
   - [ ] .vercelフォルダのクリア

3. **設定内容**
   - [ ] vercel.jsonのパス指定
   - [ ] buildCommand/installCommandの確認
   - [ ] outputDirectoryの正確性

4. **テスト手順**
   - [ ] ローカルでのnpm run build成功
   - [ ] 手動デプロイテスト
   - [ ] Git自動デプロイテスト

---

## 最終成功設定

### Vercelダッシュボード設定
- **Framework**: Next.js（自動検出）
- **Root Directory**: 空欄
- **Node.js Version**: 20.x
- **Build Command**: 自動（vercel.jsonで上書き）
- **Output Directory**: 自動（vercel.jsonで上書き）

### vercel.json（Gitルートに配置）
```json
{
  "framework": "nextjs",
  "buildCommand": "cd sake-search-nextjs && npm run build",
  "outputDirectory": "sake-search-nextjs/.next", 
  "installCommand": "cd sake-search-nextjs && npm install"
}
```

### 結果
- ✅ ビルド時間: 52秒
- ✅ 手動デプロイ: 成功
- ✅ Git自動デプロイ: 成功
- ✅ 全テスト: 69個成功

---

## 今後の注意点

1. **vercel.jsonの変更は慎重に**: 動作している設定を不用意に変更しない
2. **Node.jsバージョンの固定**: 20.xを維持
3. **モノレポ構造**: 新しいプロジェクト追加時は設定を見直す
4. **定期的なテスト**: 大きな変更後は必ず手動デプロイでテスト

---

**作成日**: 2025年8月13日  
**最終成功**: 2025年8月13日 09:08 JST  
**総所要時間**: 約2時間  
**試行回数**: 20回以上