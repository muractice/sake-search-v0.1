# 酒サーチ MVP アーキテクチャ図

## システム全体構成

```mermaid
graph TB
    subgraph "Client (Browser)"
        UI[React UI Components]
        State[State Management<br/>useState hooks]
    end

    subgraph "Next.js Application"
        subgraph "Frontend"
            Pages[Pages<br/>app/page.tsx]
            Components[Components<br/>- SearchSection<br/>- TasteChart<br/>- SakeDetail<br/>- ComparisonPanel]
            Styles[Styling<br/>Tailwind CSS]
        end

        subgraph "Backend"
            SA[Server Actions<br/>app/actions/search.ts]
            Lib[Libraries<br/>- sakenowaApi.ts<br/>- mockData.ts]
        end
    end

    subgraph "External Services"
        Sakenowa[Sakenowa API<br/>https://muro.sakenowa.com]
    end

    UI --> State
    State --> Pages
    Pages --> Components
    Components --> Styles
    
    Pages --> SA
    SA --> Lib
    Lib --> Sakenowa

    classDef client fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef frontend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef backend fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef external fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    
    class UI,State client
    class Pages,Components,Styles frontend
    class API,Lib backend
    class Sakenowa external
```

## データフロー

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant State as React State
    participant SA as Server Action
    participant Lib as sakenowaApi.ts
    participant Sakenowa as Sakenowa API
    participant Mock as mockData.ts

    User->>UI: 日本酒名を入力
    UI->>State: handleSearch(query)
    State->>SA: searchSakesAction({ query })
    
    alt Sakenowa API使用時
        SA->>Lib: searchRealSakeData(query)
        Lib->>Sakenowa: fetch(/brands, /breweries, /flavor-charts)
        Sakenowa-->>Lib: APIレスポンス
        Lib-->>SA: 変換されたSakeData[]
    else モックデータ使用時
        SA->>Mock: searchMockSakeData(query)
        Mock-->>SA: モックSakeData[]
    end
    
    SA-->>State: SearchResult
    State->>UI: データ更新
    UI->>User: チャートと詳細表示
```

## コンポーネント構成

```mermaid
graph TD
    subgraph "app/page.tsx"
        Home[Home Component<br/>- 全体レイアウト<br/>- 状態管理]
    end

    subgraph "Components"
        Search[SearchSection<br/>- 検索UI<br/>- 検索処理]
        Chart[TasteChart<br/>- 4象限グラフ<br/>- Chart.js統合<br/>- ラベルプラグイン]
        Detail[SakeDetail<br/>- 詳細情報表示<br/>- 味覚プロファイル]
        Compare[ComparisonPanel<br/>- 比較モード管理<br/>- 選択済み表示]
    end

    Home --> Search
    Home --> Chart
    Home --> Detail
    Home --> Compare

    classDef page fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef component fill:#f1f8e9,stroke:#558b2f,stroke-width:2px
    
    class Home page
    class Search,Chart,Detail,Compare component
```

## 主要な技術スタック

| レイヤー | 技術 | 用途 |
|---------|------|------|
| フレームワーク | Next.js 15.4.5 | SSR, API Routes, ルーティング |
| UI ライブラリ | React 19 | コンポーネントベースUI |
| 言語 | TypeScript | 型安全性 |
| スタイリング | Tailwind CSS | ユーティリティファーストCSS |
| グラフ描画 | Chart.js | 散布図による4象限チャート |
| 外部API | Sakenowa API | 日本酒データ取得 |
| 開発ツール | ESLint, PostCSS | コード品質, CSS処理 |

## 主要機能とファイル対応

```mermaid
graph LR
    subgraph "機能"
        F1[日本酒検索]
        F2[4象限チャート表示]
        F3[詳細情報表示]
        F4[複数比較機能]
        F5[API統合]
    end

    subgraph "実装ファイル"
        File1[SearchSection.tsx]
        File2[TasteChart.tsx]
        File3[SakeDetail.tsx]
        File4[ComparisonPanel.tsx]
        File5[sakenowaApi.ts]
    end

    F1 --> File1
    F2 --> File2
    F3 --> File3
    F4 --> File4
    F5 --> File5

    classDef feature fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef file fill:#e8eaf6,stroke:#283593,stroke-width:2px
    
    class F1,F2,F3,F4,F5 feature
    class File1,File2,File3,File4,File5 file
```

## データ取得インターフェース

- Web(既定): Server Actions `searchSakesAction(options)` を利用
- 将来モバイル/BFF: `/api/v1/sakes/search` を追加して共通契約化（未実装）

## デプロイメント構成

```mermaid
graph LR
    subgraph "Development"
        Dev[ローカル開発<br/>npm run dev<br/>localhost:3000]
    end

    subgraph "Production"
        Build[ビルド<br/>npm run build]
        Deploy[デプロイ<br/>Vercel/Netlify等]
    end

    Dev --> Build
    Build --> Deploy

    classDef dev fill:#fff8e1,stroke:#f9a825,stroke-width:2px
    classDef prod fill:#e0f2f1,stroke:#00897b,stroke-width:2px
    
    class Dev dev
    class Build,Deploy prod
```

## セキュリティ考慮事項

1. **環境変数管理**
   - `USE_SAKENOWA_API` - .env.localで管理
   - 本番環境では環境変数として設定

2. **CORS対策**
   - Next.js API Routesを経由してSakenowa APIにアクセス
   - クライアントから直接外部APIを呼ばない

3. **入力検証**
   - 検索クエリのサニタイゼーション
   - APIレスポンスの型検証

## パフォーマンス最適化

1. **キャッシュ戦略**
   - Sakenowa APIレスポンスを1時間キャッシュ
   - `next: { revalidate: 3600 }`

2. **バンドルサイズ**
   - Chart.jsの必要なモジュールのみインポート
   - 動的インポートは現状未使用

3. **レンダリング最適化**
   - React 19の最適化機能を活用
   - 不要な再レンダリングを防ぐ状態管理
