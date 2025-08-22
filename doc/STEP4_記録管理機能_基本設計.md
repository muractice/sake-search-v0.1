# STEP4: 記録管理機能 基本設計書

## 1. アーキテクチャ概要

### 1.1 システム構成
```
┌─────────────────────────────────────────────────┐
│                  Frontend (Next.js)              │
├─────────────────────────────────────────────────┤
│  Pages                                          │
│  ├── /records (記録一覧)                        │
│  ├── /records/new (新規記録)                    │
│  ├── /records/[id] (記録詳細)                   │
│  ├── /records/[id]/edit (記録編集)              │
│  └── /records/stats (統計・マップ)              │
├─────────────────────────────────────────────────┤
│  Components                                     │
│  ├── records/                                   │
│  │   ├── RecordForm                            │
│  │   ├── RecordList                            │
│  │   ├── RecordCard                            │
│  │   ├── RecordCalendar                        │
│  │   ├── RecordStats                           │
│  │   ├── PrefectureMap                         │
│  │   └── BadgeDisplay                          │
│  └── common/                                    │
│      └── ImageUploader                          │
├─────────────────────────────────────────────────┤
│  Hooks                                          │
│  ├── useRecords (CRUD操作)                      │
│  ├── useRecordStats (統計)                      │
│  ├── useBadges (バッジ管理)                     │
│  └── useImageUpload (画像アップロード)          │
├─────────────────────────────────────────────────┤
│  API Routes                                     │
│  ├── /api/records                               │
│  ├── /api/records/stats                         │
│  ├── /api/records/badges                        │
│  └── /api/upload                                │
└─────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────┐
│              Backend (Supabase)                 │
├─────────────────────────────────────────────────┤
│  Database Tables                                │
│  ├── drinking_records                           │
│  ├── record_images                              │
│  ├── user_badges                                │
│  └── user_statistics                            │
├─────────────────────────────────────────────────┤
│  Storage Buckets                                 │
│  └── record-images/                             │
└─────────────────────────────────────────────────┘
```

## 2. データモデル設計

### 2.1 TypeScript型定義

```typescript
// types/record.ts

export interface DrinkingRecord {
  id: string;
  userId: string;
  sakeId: string;
  sake?: SakeData; // JOIN時に含まれる
  date: string; // ISO 8601形式
  locationType: 'home' | 'restaurant' | 'other';
  restaurantName?: string;
  price?: number;
  servingStyle?: 'cold' | 'room' | 'warm' | 'hot';
  pairing?: string;
  rating: number; // 1-5
  tasteRatings?: {
    sweetness?: number; // 1-5
    richness?: number; // 1-5
    aroma?: number; // 1-5
    sharpness?: number; // 1-5
  };
  memo?: string;
  images?: RecordImage[];
  createdAt: string;
  updatedAt: string;
}

export interface RecordImage {
  id: string;
  recordId: string;
  imageUrl: string;
  order: number;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeType: BadgeType;
  badgeLevel: BadgeLevel;
  earnedAt: string;
  isNew?: boolean; // 未読フラグ
}

export type BadgeType = 
  | 'records' // 記録数
  | 'brands' // 銘柄数
  | 'breweries' // 酒蔵数
  | 'prefectures' // 都道府県
  | 'streak' // 連続記録
  | 'special'; // 特殊

export type BadgeLevel = 
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond';

export interface UserStatistics {
  userId: string;
  totalRecords: number;
  uniqueBrands: number;
  uniqueBreweries: number;
  prefecturesVisited: string[]; // 都道府県コードの配列
  currentLevel: number;
  currentStreak: number;
  maxStreak: number;
  favoriteStyle?: 'cold' | 'room' | 'warm' | 'hot';
  averageRating: number;
  monthlyRecords: { [key: string]: number }; // YYYY-MM: count
  updatedAt: string;
}

export interface RecordFormData {
  sakeId: string;
  date: Date;
  locationType: 'home' | 'restaurant' | 'other';
  restaurantName?: string;
  price?: number;
  servingStyle?: 'cold' | 'room' | 'warm' | 'hot';
  pairing?: string;
  rating: number;
  sweetness?: number;
  richness?: number;
  aroma?: number;
  sharpness?: number;
  memo?: string;
  images?: File[];
}
```

## 3. API設計

### 3.1 記録管理API

```typescript
// /api/records/route.ts

// GET: 記録一覧取得
interface GetRecordsQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  rating?: number;
  locationType?: string;
  sakeId?: string;
  orderBy?: 'date' | 'rating' | 'created';
  order?: 'asc' | 'desc';
}

// POST: 記録作成
interface CreateRecordBody {
  record: RecordFormData;
}

// /api/records/[id]/route.ts

// GET: 記録詳細取得
// PUT: 記録更新
// DELETE: 記録削除

// /api/records/stats/route.ts

// GET: 統計情報取得
interface GetStatsQuery {
  period?: 'week' | 'month' | 'year' | 'all';
}

// /api/records/badges/route.ts

// GET: バッジ一覧取得
// POST: バッジ既読化
```

### 3.2 画像アップロードAPI

```typescript
// /api/upload/route.ts

// POST: 画像アップロード
interface UploadImageBody {
  image: string; // Base64
  recordId?: string;
}

interface UploadImageResponse {
  url: string;
  id: string;
}
```

## 4. コンポーネント設計

### 4.1 記録フォームコンポーネント

```tsx
// components/records/RecordForm.tsx

interface RecordFormProps {
  initialData?: Partial<RecordFormData>;
  onSubmit: (data: RecordFormData) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

const RecordForm: React.FC<RecordFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  mode
}) => {
  // フォームステップ
  // Step 1: 日本酒選択
  // Step 2: 基本情報（日付、場所、価格）
  // Step 3: 評価（星評価、味覚評価）
  // Step 4: 詳細（写真、メモ、ペアリング）
  
  return (
    <div className="record-form">
      {/* ステップインジケーター */}
      {/* 各ステップのフォーム */}
      {/* 送信ボタン */}
    </div>
  );
};
```

### 4.2 記録一覧コンポーネント

```tsx
// components/records/RecordList.tsx

interface RecordListProps {
  view: 'timeline' | 'calendar' | 'grid';
  filters?: RecordFilters;
  onRecordClick: (record: DrinkingRecord) => void;
}

const RecordList: React.FC<RecordListProps> = ({
  view,
  filters,
  onRecordClick
}) => {
  const { records, loading, loadMore } = useRecords(filters);
  
  return (
    <div className="record-list">
      {view === 'timeline' && <TimelineView records={records} />}
      {view === 'calendar' && <CalendarView records={records} />}
      {view === 'grid' && <GridView records={records} />}
      {/* 無限スクロール */}
    </div>
  );
};
```

### 4.3 都道府県マップコンポーネント

```tsx
// components/records/PrefectureMap.tsx

interface PrefectureMapProps {
  visitedPrefectures: string[];
  recordCounts: { [prefecture: string]: number };
  onPrefectureClick?: (prefecture: string) => void;
}

const PrefectureMap: React.FC<PrefectureMapProps> = ({
  visitedPrefectures,
  recordCounts,
  onPrefectureClick
}) => {
  return (
    <div className="prefecture-map">
      {/* SVG日本地図 */}
      {/* 訪問済み都道府県のハイライト */}
      {/* ホバー時の情報表示 */}
      {/* 達成率表示 */}
    </div>
  );
};
```

### 4.4 バッジ表示コンポーネント

```tsx
// components/records/BadgeDisplay.tsx

interface BadgeDisplayProps {
  badges: UserBadge[];
  showAll?: boolean;
  onBadgeClick?: (badge: UserBadge) => void;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badges,
  showAll = false,
  onBadgeClick
}) => {
  return (
    <div className="badge-display">
      {/* 獲得済みバッジ */}
      {/* 未獲得バッジ（グレーアウト） */}
      {/* NEW表示 */}
      {/* ツールチップ */}
    </div>
  );
};
```

## 5. 状態管理設計

### 5.1 カスタムフック

```typescript
// hooks/useRecords.ts
export const useRecords = (filters?: RecordFilters) => {
  const [records, setRecords] = useState<DrinkingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const loadRecords = async () => {
    // API呼び出し
  };
  
  const createRecord = async (data: RecordFormData) => {
    // 記録作成
    // バッジチェック
    // 統計更新
  };
  
  const updateRecord = async (id: string, data: Partial<RecordFormData>) => {
    // 記録更新
  };
  
  const deleteRecord = async (id: string) => {
    // 記録削除
    // 統計更新
  };
  
  return {
    records,
    loading,
    hasMore,
    loadMore,
    createRecord,
    updateRecord,
    deleteRecord
  };
};

// hooks/useRecordStats.ts
export const useRecordStats = (period?: StatsPeriod) => {
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  
  const loadStats = async () => {
    // 統計データ取得
  };
  
  const refreshStats = async () => {
    // 統計データ再計算
  };
  
  return {
    stats,
    loading,
    refreshStats
  };
};

// hooks/useBadges.ts
export const useBadges = () => {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [newBadges, setNewBadges] = useState<UserBadge[]>([]);
  
  const checkAndAwardBadges = async (stats: UserStatistics) => {
    // バッジ条件チェック
    // 新規バッジ付与
  };
  
  const markBadgeAsRead = async (badgeId: string) => {
    // 既読化
  };
  
  return {
    badges,
    newBadges,
    checkAndAwardBadges,
    markBadgeAsRead
  };
};
```

## 6. UI/UXフロー

### 6.1 記録作成フロー

```
1. 「記録を追加」ボタンタップ
   ↓
2. 日本酒選択
   - 検索バー
   - 最近飲んだ日本酒
   - お気に入りから選択
   ↓
3. 基本情報入力
   - 日付（デフォルト：今日）
   - 場所選択
   - （飲食店の場合）店名入力
   ↓
4. 評価入力
   - 5段階星評価（必須）
   - 味覚評価（任意）
   - クイック評価ボタン
   ↓
5. 詳細入力（任意）
   - 写真追加
   - メモ入力
   - ペアリング入力
   ↓
6. 確認・保存
   - プレビュー表示
   - 保存ボタン
   ↓
7. 完了
   - バッジ獲得チェック
   - 共有オプション表示
```

### 6.2 記録閲覧フロー

```
1. 記録タブ選択
   ↓
2. 表示形式選択
   - タイムライン（デフォルト）
   - カレンダー
   - グリッド
   ↓
3. フィルター適用（任意）
   - 期間
   - 評価
   - 場所
   ↓
4. 記録選択
   - 詳細表示
   - 編集/削除オプション
```

## 7. パフォーマンス最適化

### 7.1 画像最適化
- アップロード時に自動リサイズ（最大1920x1920）
- サムネイル生成（300x300）
- WebP形式への変換
- 遅延ロード実装

### 7.2 データ取得最適化
- ページネーション（20件/ページ）
- 無限スクロール
- キャッシュ戦略（SWR使用）
- 楽観的UI更新

### 7.3 統計計算最適化
- バックグラウンドでの事前計算
- キャッシュ活用（1時間）
- 差分更新

## 8. セキュリティ対策

### 8.1 認証・認可
- Supabase RLSによるデータアクセス制御
- ユーザーごとのデータ分離
- APIキーの環境変数管理

### 8.2 入力検証
- フロントエンド：Zodによるスキーマ検証
- バックエンド：入力サニタイゼーション
- SQLインジェクション対策

### 8.3 ファイルアップロード
- ファイルタイプ検証（画像のみ）
- ファイルサイズ制限（5MB/枚）
- ウイルススキャン（将来実装）

## 9. エラーハンドリング

### 9.1 エラーパターン
- ネットワークエラー
- 認証エラー
- バリデーションエラー
- サーバーエラー

### 9.2 ユーザーフィードバック
- トースト通知
- エラーメッセージ表示
- リトライオプション
- オフライン対応

## 10. テスト戦略

### 10.1 単体テスト
- コンポーネントテスト（Jest + React Testing Library）
- フックテスト
- ユーティリティ関数テスト

### 10.2 統合テスト
- API連携テスト
- データフローテスト

### 10.3 E2Eテスト
- 記録作成フロー
- 記録編集フロー
- 統計表示