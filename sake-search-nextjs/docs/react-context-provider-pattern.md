# React Context と Provider パターンの解説

このドキュメントでは、本プロジェクトで使用している React Context と Provider パターンについて解説します。

## 目次
1. [基本概念](#基本概念)
2. [プロジェクトでの実装](#プロジェクトでの実装)
3. [データフローの詳細](#データフローの詳細)
4. [コンポーネントでの活用](#コンポーネントでの活用)
5. [実装のポイント](#実装のポイント)

## 基本概念

### Context とは
React Context は、コンポーネントツリー全体でデータを共有するための仕組みです。props drilling（深い階層へのプロパティの受け渡し）を避けることができます。

### Provider パターン
Provider は Context を通じてデータを配布する「配送センター」のような役割を果たします。

```typescript
<FavoritesContext.Provider value={データ}>
  {children}  // この範囲内でデータにアクセス可能
</FavoritesContext.Provider>
```

## プロジェクトでの実装

### 1. Context の作成
```typescript
// contexts/FavoritesContext.tsx
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);
```

- `<FavoritesContextType | undefined>`: ジェネリクスで型を指定
- `(undefined)`: デフォルト値（Provider外で使用時に返される）

### 2. Provider コンポーネント
```typescript
export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const favoritesData = useFavorites();  // カスタムフックでデータ取得
  
  return (
    <FavoritesContext.Provider value={favoritesData}>
      {children}
    </FavoritesContext.Provider>
  );
};
```

### 3. カスタムフックでエラーハンドリング
```typescript
export const useFavoritesContext = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
};
```

## データフローの詳細

### 全体の流れ
```
1. page.tsx が FavoritesProvider でアプリ全体をラップ
   ↓
2. FavoritesProvider 内で useFavorites() を実行
   ↓
3. useFavorites が以下を返す:
   - favorites（お気に入りリスト）
   - addFavorite（追加関数）
   - removeFavorite（削除関数）
   - user（ユーザー情報）
   - 認証関数（signIn/signUp/signOut）
   ↓
4. Context.Provider の value に設定
   ↓
5. 子コンポーネントが useFavoritesContext() で取得
```

### 状態更新と再描画
```
1. コンポーネントで addFavorite() 実行
   ↓
2. useFavorites 内で setFavorites() が呼ばれる
   ↓
3. favorites state が更新
   ↓
4. Provider の value が更新
   ↓
5. favorites を使用している全コンポーネントが自動的に再描画
```

## コンポーネントでの活用

### 実装箇所と使用データ

```
page.tsx（FavoritesProvider で全体をラップ）
    ↓ データ提供
├── UserProfile.tsx
│   └── user, favorites, showFavorites, signOut を使用
│
├── SakeDetail.tsx
│   └── FavoriteButton.tsx
│       └── user, isFavorite, addFavorite, removeFavorite を使用
│
└── AuthForm.tsx（モーダル）
    └── signInWithEmail, signUpWithEmail を使用
```

### 具体的な使用例

#### FavoriteButton.tsx
```typescript
const { user, isFavorite, addFavorite, removeFavorite } = useFavoritesContext();

// お気に入りボタンのクリック処理
const handleClick = () => {
  if (isFavorite(sake.id)) {
    removeFavorite(sake.id);
  } else {
    addFavorite(sake);
  }
};
```

#### UserProfile.tsx
```typescript
const { user, favorites, showFavorites, toggleShowFavorites, signOut } = useFavoritesContext();

// お気に入りリストの表示
return (
  <div>
    <p>お気に入り: {favorites.length}件</p>
    {showFavorites && favorites.map(sake => (
      <div key={sake.id}>{sake.name}</div>
    ))}
  </div>
);
```

## 実装のポイント

### 1. children プロパティの特殊性
`children` は React の予約語で、コンポーネントタグの間に書いた要素が自動的に渡されます。

```typescript
// これは同じ意味
<FavoritesProvider>
  <Header />
</FavoritesProvider>

// 内部的にはこうなっている
<FavoritesProvider children={<Header />} />
```

### 2. Provider の配置場所
最上位（page.tsx）で全体をラップすることで、すべての子コンポーネントがデータにアクセス可能になります。

### 3. エラーハンドリング
カスタムフック（useFavoritesContext）でundefinedチェックを行うことで、型安全性を確保しています。

### 4. パフォーマンス最適化
- useFavorites は Provider 内で一度だけ呼ばれる
- 状態の一元管理により、無駄な API コールを防止
- 必要なデータだけを各コンポーネントで取得

## メリット

1. **Props Drilling の回避**: 深い階層へのプロパティ受け渡しが不要
2. **状態の一元管理**: 一箇所で状態を管理し、全体で共有
3. **自動同期**: どこで更新しても全体に反映
4. **関心の分離**: 各コンポーネントは必要な機能だけを取得
5. **型安全性**: TypeScript による型チェック

## 関連ファイル

- `/contexts/FavoritesContext.tsx`: Context の定義と Provider
- `/hooks/useFavorites.ts`: お気に入り機能のロジック
- `/app/page.tsx`: Provider の使用箇所
- `/components/FavoriteButton.tsx`: Context データの活用例
- `/components/UserProfile.tsx`: Context データの活用例
- `/components/AuthForm.tsx`: Context データの活用例