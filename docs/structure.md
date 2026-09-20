# ディレクトリ構成

```
LifeDB/
├── docs/                        # 設計ドキュメント
│   ├── rules.md
│   ├── git.md
│   ├── stack.md
│   ├── features.md
│   ├── db.md
│   └── api/
│       ├── daily.md
│       ├── tasks.md
│       ├── facts.md
│       ├── donts.md
│       ├── documents.md
│       └── assets.md
├── specification.md
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma         # テーブル定義
│   │   └── migrations/           # マイグレーションファイル
│   ├── src/
│   │   ├── index.ts              # エントリーポイント（Express起動）
│   │   ├── routes/               # 機能別ルーター
│   │   │   ├── daily.ts
│   │   │   ├── tasks.ts
│   │   │   ├── facts.ts
│   │   │   ├── donts.ts
│   │   │   ├── documents.ts
│   │   │   └── assets.ts
│   │   └── services/             # ビジネスロジック
│   │       ├── daily.ts
│   │       ├── tasks.ts
│   │       ├── facts.ts
│   │       ├── donts.ts
│   │       ├── documents.ts
│   │       └── assets.ts
│   └── tests/                    # テスト（機能別）
│       ├── daily.test.ts
│       ├── tasks.test.ts
│       ├── facts.test.ts
│       ├── donts.test.ts
│       ├── documents.test.ts
│       └── assets.test.ts
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx              # エントリーポイント
│   │   ├── App.tsx               # ルーティング・レイアウト
│   │   ├── theme.ts              # MUIテーマ設定
│   │   ├── api/                  # API呼び出し（機能別）
│   │   │   ├── daily.ts
│   │   │   ├── tasks.ts
│   │   │   ├── facts.ts
│   │   │   ├── donts.ts
│   │   │   ├── documents.ts
│   │   │   └── assets.ts
│   │   ├── components/           # 共通コンポーネント
│   │   │   ├── Layout.tsx        # ナビゲーション・レイアウト
│   │   │   ├── PeriodSelector.tsx # 期間セレクタ（共通）
│   │   │   └── ColorPicker.tsx   # 色選択（共通）
│   │   └── pages/                # 画面（機能別）
│   │       ├── Home.tsx
│   │       ├── daily/
│   │       │   ├── DailyPage.tsx
│   │       │   ├── RecordTab.tsx
│   │       │   ├── StatsTab.tsx
│   │       │   ├── TypesTab.tsx
│   │       │   └── Timeline.tsx
│   │       ├── tasks/
│   │       │   ├── TasksPage.tsx
│   │       │   ├── ListTab.tsx
│   │       │   ├── RecurringTab.tsx
│   │       │   └── HistoryTab.tsx
│   │       ├── facts/
│   │       │   ├── FactsPage.tsx
│   │       │   ├── ListTab.tsx
│   │       │   └── TagsTab.tsx
│   │       ├── donts/
│   │       │   └── DontsPage.tsx
│   │       ├── documents/
│   │       │   ├── DocumentsPage.tsx
│   │       │   ├── Sidebar.tsx
│   │       │   └── Editor.tsx
│   │       └── assets/
│   │           ├── AssetsPage.tsx
│   │           ├── TransactionsTab.tsx
│   │           ├── BalanceTab.tsx
│   │           └── StatsTab.tsx
│   └── tests/                    # テスト
│
└── shared/                       # フロントエンド・バックエンド共有
    └── types/                    # 共有型定義
        ├── daily.ts
        ├── tasks.ts
        ├── facts.ts
        ├── donts.ts
        ├── documents.ts
        └── assets.ts
```

## 方針

- **機能別分離**: routes / services / pages / api をすべて機能名で対応させ、変更箇所が分かりやすくする
- **routes と services の分離**: routes はリクエスト/レスポンスのハンドリングのみ、services にビジネスロジックを置く
- **shared/types**: APIのリクエスト/レスポンス型をフロントエンド・バックエンドで共有し、型安全を確保
- **共通コンポーネント**: 期間セレクタ・色選択など複数画面で使うものは components/ に配置
- **ページ内コンポーネント**: タブやタイムラインなど画面固有のものは pages/機能名/ 内に配置
