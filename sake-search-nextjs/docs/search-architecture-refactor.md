# Search Architecture Refactor (Design-Only)

目的: `features → services → repositories → lib` のレイヤード構造へ段階的に移行し、検索機能（useSearch系）の依存と責務を整理する。

## 方針

- 依存関係: `app → features → services → repositories → lib`
- `features` は UI と UI向けhook（状態）に限定。データ取得は service 経由。
- `services` は業務ロジックを保持し、`repositories` による永続化/外部I/Oへ委譲。
- `repositories` は Supabase/HTTP(API)/Cache など I/O を抽象化。`lib` のクライアントを利用。
- Server Components / Server Actions は `server/` で行い、必要に応じて service/repository を呼び出す。

## 現状

- `useSearch` は Server Actions（`app/actions/search.ts`）を呼び出し、サーバ側で `SakeService` → repository を実行
- `/api/search` は段階的廃止（メニューなども Server Actions に統一済み）
- `repositories` は Favorites/Preferences/Recommendations などで Supabase 実装が進行中

## 変更計画（Search領域）

1. Repository 抽象化を導入（設計のみ）
   - `src/repositories/sakes/SakeRepository.ts` に `ISakeRepository` を定義
   - メソッド: `search`, `searchSakes`, `getById`, `getTrending`, `getSuggestions`

2. HTTP 実装の雛形（設計のみ）
   - `src/repositories/sakes/HttpSakeRepository.ts` を追加（`ApiClient` 利用）
   - 実装は未接続のスタブ。ビルドに影響しないよう未使用で配置

3. Service の責務分離（設計のみ）
  - `src/services/SakeService.ts` を repository 依存の形へ（従来ロジックを移植）
  - 古い ApiClient ベースの `SakeService` は廃止済み

4. Provider への接続（検索では非必須）
   - 検索は Server Actions/RSC を既定とし、Providerによる注入は行わない
   - 将来: BFF導入時に `HttpSakeRepository` を Provider 経由で注入可能

5. Hook の移行（次ステップで実装）
  - `useSearchV2` を `SakeService` に付け替え
   - 既存 `useSearch` は段階的に利用箇所を削減 → 廃止

6. Server 側の整理（任意/将来）
   - `server/` に Server Actions を配置し、SSR/SSGのパスからは server 経由で service を呼ぶ
   - Route Handlers は可能なら service/repository に委譲（重複ロジック排除）

## 移行ステップ（小さく安全に）

- Step 1: 本ブランチで設計ファイルのみ追加（ビルド無影響）
- Step 2: Provider に repository/service v2 をオプション注入（デフォルトは現状維持）
- Step 3: `useSearchV2` を v2 service に切替（影響範囲の小さい画面から）
- Step 4: API周りの重複ロジックを service/repository に集約
- Step 5: `useSearch` を廃止、`useSearchV2` を標準化

補足: 検索は Server Actions に統一。`useSearch` は SA を呼び出す薄いフック。

## 期待効果

- UI と I/O の分離によりテスト容易性・保守性向上
- Supabase/HTTP/Cache の切替を repository 層で実現
- Web/Mobile 共通の service ロジックを維持
