# やらないこと API

ベースパス: `/api/donts`

## エンドポイント一覧

| Method | Path | 概要 |
|---|---|---|
| GET | `/` | エントリー一覧（週フィルタ、振り返り付き） |
| POST | `/` | エントリーを作成 |
| PUT | `/:id` | エントリーの内容を更新 |
| DELETE | `/:id` | 論理削除 |
| PUT | `/:id/reviews/:weekStart` | 振り返りを作成・更新（upsert） |

## GET /

エントリー一覧（週フィルタ、振り返り付き）。ページネーションなし。

Query: `weekStart=YYYY-MM-DD`

Response: `[{ id, content, createdAt, deletedAt, review }]`

- 表示条件: deletedAt が null、または deletedAt > 選択週の日曜日
- review は指定された weekStart の振り返りのみ返す（なければ null）

## POST /

エントリーを作成。

Body: `{ content }`

## PUT /:id

エントリーの内容を更新。

Body: `{ content }`

## DELETE /:id

論理削除（deletedAt = now() を記録）。

## PUT /:id/reviews/:weekStart

振り返りを作成・更新（upsert）。

Body: `{ review }`
