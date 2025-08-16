# 開発ワークフローガイド

このプロジェクトでは品質保証のための開発ワークフローとツールが整備されています。

## 概要

3つのツールが連携して品質を保証します：

| ツール | タイミング | 実行方法 | 目的 |
|--------|------------|----------|------|
| `workflow` | 開始時 | 手動 | 手順確認 |
| `check-all` | 修正後 | 手動 | 事前チェック |
| `pre-commit` | コミット時 | 自動 | 最終防壁 |

## 1. `workflow` - 手順確認用

**使用タイミング**: 作業開始時  
**目的**: 手順の確認とリマインダー

```bash
npm run workflow
```

**出力例**:
```
🔄 Full development workflow:
1. Create branch: git checkout -b feature/your-change
2. Make changes
3. Run: npm run check-all
4. Test locally: npm run dev
5. Commit and merge
```

**使用場面**:
- 久しぶりに開発するとき
- 新しいメンバーがワークフローを覚えるとき
- 手順を忘れたとき

## 2. `check-all` - 手動品質チェック

**使用タイミング**: コード修正完了後、コミット前  
**目的**: 品質チェックを手動で実行

```bash
npm run check-all
```

**実行内容**:
```bash
npm run lint    # ESLintチェック
npm run test    # テスト実行
npm run build   # ビルドチェック
```

**使用場面**:
- コミット前の最終確認
- 修正が完了したとき
- CIが失敗しそうかを事前確認

## 3. `pre-commit` - 自動品質チェック

**使用タイミング**: `git commit`実行時（自動）  
**目的**: コミット前の強制品質チェック

```bash
git commit -m "修正完了"
# ↓ 自動で pre-commit が実行される
```

**実行内容**:
```bash
🔍 Pre-commit checks running...
📝 Running lint...
🧪 Running tests...
🏗️ Running build...
✅ All pre-commit checks passed!
```

**特徴**:
- 品質に問題があるとコミットを阻止
- 自動実行されるため忘れることがない

## 実際の開発フロー

### 📋 1. 開発開始時

```bash
npm run workflow  # 手順確認
git checkout -b feature/new-feature-20241216
```

### 🔧 2. 開発中

```bash
# コード修正...
npm run dev  # 動作確認（http://localhost:3000）
```

### ✅ 3. 修正完了時

```bash
npm run check-all  # 手動で品質チェック
```

### 💾 4. コミット時

```bash
git add .
git commit -m "新機能追加"
# ↑ この時点で pre-commit が自動実行
```

### 🔄 5. マージ・クリーンアップ

```bash
git checkout main
git merge feature/new-feature-20241216
git branch -d feature/new-feature-20241216
```

## 二重チェックの意味

**なぜ`check-all`と`pre-commit`両方あるのか？**

1. **`check-all`**: 事前に問題を発見して修正
2. **`pre-commit`**: 万が一の見落としをキャッチ

これにより「品質問題のあるコードがコミットされる確率」をほぼゼロにできます。

## トラブルシューティング

### Git Hooksが動作しない場合

```bash
# Hooks設定を確認
git config --get core.hooksPath

# 設定されていない場合
git config core.hooksPath .githooks

# 実行権限を確認
chmod +x .githooks/pre-commit
```

### check-allでエラーが発生した場合

```bash
# 個別に実行して問題を特定
npm run lint    # リントエラー
npm run test    # テストエラー
npm run build   # ビルドエラー
```

## ファイル構成

- `package.json`: npm scripts定義
- `.githooks/pre-commit`: Git pre-commitフック
- `CLAUDE.md`: 詳細な開発ワークフロー
- `docs/development-workflow.md`: この文書

## 関連文書

- [CLAUDE.md](../CLAUDE.md): 詳細なワークフロー手順
- [README.md](../README.md): プロジェクト概要
- [docs/](./): その他の技術文書