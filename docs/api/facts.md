# 事実＆思考 API

ベースパス: `/api/facts`

## エンドポイント一覧

| Method | Path | 概要 |
|---|---|---|
| GET | `/` | エントリー一覧（ページネーション・タグフィルタ・検索） |
| POST | `/` | エントリーを作成 |
| PUT | `/:id` | エントリーを更新 |
| DELETE | `/:id` | エントリーを削除 |
| POST | `/:id/supplements` | 補足を追加 |
| DELETE | `/supplements/:id` | 補足を削除 |
| GET | `/random` | ランダムに1件取得 |
| GET | `/tags` | タグ一覧 |
| POST | `/tags` | タグを作成 |
| PUT | `/tags/:id` | タグを更新 |
| DELETE | `/tags/:id` | タグを削除 |

## GET /

エントリー一覧（ページネーション）。

Query: `page=1&limit=50&tags=1,2,3&search=keyword`

Response: `{ items: [{ id, title, content, createdAt, tags: [{ id, name, color }], supplements: [{ id, content, createdAt }] }], total }`

## POST /

エントリーを作成。

Body: `{ title, content?, tagIds? }`

## PUT /:id

エントリーを更新。

Body: `{ title?, content?, tagIds? }`

## DELETE /:id

エントリーを削除（補足・タグ関連もカスケード削除）。

## POST /:id/supplements

補足を追加。

Body: `{ content }`

## DELETE /supplements/:id

補足を削除。

## GET /random

ランダムに1件取得（ホーム画面用）。

Response: `{ id, title, content, createdAt, tags: [{ id, name, color }] }`

## GET /tags

タグ一覧。

Response: `[{ id, name, color, sortOrder }]`

## POST /tags

タグを作成。

Body: `{ name, color, sortOrder }`

## PUT /tags/:id

タグを更新。sortOrder 変更時は自動シフト。

Body: `{ name?, color?, sortOrder? }`

## DELETE /tags/:id

タグを削除（中間テーブルのみカスケード削除、エントリーは残る）。
