# RestaurantRecommendations コンポーネント分割設計

## 現状の問題

- `RestaurantRecommendations.tsx` が約400行と肥大化
- 複数の責任が一つのコンポーネントに集約されている
- ガチャ機能、レコメンド取得、UI表示が混在
- テスト・保守が困難

## 分割設計

### ディレクトリ構成

```
src/features/recommendations/
├── RestaurantRecommendations/
│   ├── index.tsx (メインコンポーネント)
│   ├── components/
│   │   ├── RecommendationTypeSelector.tsx (タイプ選択ボタン)
│   │   ├── GachaSlotAnimation.tsx (ガチャスロット演出)
│   │   ├── GachaResult.tsx (ガチャ結果表示)
│   │   ├── RecommendationList.tsx (レコメンド結果リスト)
│   │   └── EmptyState.tsx (空状態表示)
│   ├── hooks/
│   │   ├── useRecommendations.ts (レコメンドロジック)
│   │   └── useGachaAnimation.ts (ガチャアニメーションロジック)
│   └── types.ts (型定義)
└── RestaurantRecommendations.tsx (移行前ファイル - 削除予定)
```

### 責任の分離

| コンポーネント | 責任 | 行数目安 |
|--------------|------|---------|
| **RestaurantRecommendations/index.tsx** | 全体の調整、状態管理 | ~100行 |
| **RecommendationTypeSelector** | レコメンドタイプの選択UI | ~50行 |
| **GachaSlotAnimation** | スロット演出のUI | ~80行 |
| **GachaResult** | ガチャ結果の表示 | ~60行 |
| **RecommendationList** | レコメンド結果のリスト表示 | ~100行 |
| **EmptyState** | 空状態表示 | ~30行 |
| **useRecommendations** | APIコール、データ取得ロジック | ~80行 |
| **useGachaAnimation** | ガチャアニメーションのロジック | ~100行 |

### 段階的実装計画

#### Phase 1: ガチャ機能の分離 (最優先)
- `GachaSlotAnimation.tsx` の作成
- `GachaResult.tsx` の作成  
- `useGachaAnimation.ts` の作成
- 理由: 最も独立性が高く、影響範囲が限定的

#### Phase 2: レコメンドロジックの分離
- `useRecommendations.ts` の作成
- `RecommendationList.tsx` の作成
- ビジネスロジックをUIから分離

#### Phase 3: UIコンポーネントの分離
- `RecommendationTypeSelector.tsx` の作成
- `EmptyState.tsx` の作成
- 再利用性の向上

### 型定義の整理

```typescript
// types.ts
export type RestaurantRecommendationType = 'similarity' | 'pairing' | 'random';

export interface RecommendationResult {
  sake: SakeData;
  score: number;
  type: string;
  reason: string;
  similarityScore: number;
  predictedRating: number;
}

export interface GachaAnimationState {
  isSlotAnimating: boolean;
  slotItems: SakeData[];
  selectedGachaItem: RecommendationResult | null;
}
```

### インターフェースの統一

各コンポーネントは以下のパターンでpropsを受け取る：

```typescript
// データとアクションをグループ化
interface ComponentProps {
  data: {
    // 表示用データ
  };
  actions: {
    // イベントハンドラ
  };
  state: {
    // UI状態
  };
}
```

## メリット

1. **保守性**: 各コンポーネントの責任が明確
2. **テスタビリティ**: 小さな単位でテスト可能
3. **再利用性**: 独立したコンポーネントとして再利用可能
4. **並行開発**: 複数人で並行して開発可能
5. **可読性**: 各ファイルが100行以下で読みやすい

## 実装時の注意点

- 既存のpropsインターフェースを維持（破壊的変更を避ける）
- 型安全性を保つ
- 各コンポーネントの単体テストを作成
- パフォーマンスの劣化がないことを確認

## 完了後のファイル構成

```
RestaurantRecommendations/index.tsx (100行)
├── RecommendationTypeSelector (50行)
├── GachaSlotAnimation (80行) 
├── GachaResult (60行)
├── RecommendationList (100行)
├── EmptyState (30行)
├── useRecommendations (80行)
└── useGachaAnimation (100行)
```

**合計**: 約600行 → 各ファイル100行以下の8ファイルに分割