# デイリー API

ベースパス: `/api/daily`

## エンドポイント一覧

| Method | Path | 概要 |
|---|---|---|
| GET | `/records/:date` | 日の記録と行動一覧を取得 |
| PUT | `/records/:date` | 目標・振り返りを更新 |
| POST | `/records/:date/actions` | 行動ブロックを作成 |
| PUT | `/actions/:id` | 行動ブロックを更新 |
| DELETE | `/actions/:id` | 行動ブロックを削除 |
| GET | `/stats` | 期間・グループ別の統計 |
| GET | `/types` | 大分類一覧（小分類を含む） |
| POST | `/types` | 大分類を作成 |
| PUT | `/types/:id` | 大分類を更新 |
| DELETE | `/types/:id` | 大分類を削除 |
| POST | `/subtypes` | 小分類を作成 |
| PUT | `/subtypes/:id` | 小分類を更新 |
| DELETE | `/subtypes/:id` | 小分類を削除 |

## GET /records/:date

日の記録と行動一覧を取得。レコード未存在時は空データで返す。

Response: `{ id, date, goal, reflection, actions: [{ id, subtypeId, startMinutes, endMinutes, detail }] }`

## PUT /records/:date

目標・振り返りを更新。レコード未存在時は自動作成。

Body: `{ goal?, reflection? }`

## POST /records/:date/actions

行動ブロックを作成。レコード未存在時は自動作成。

Body: `{ subtypeId, startMinutes, endMinutes, detail? }`

## PUT /actions/:id

行動ブロックを更新。

Body: `{ subtypeId?, startMinutes?, endMinutes?, detail? }`

## DELETE /actions/:id

行動ブロックを削除。

## GET /stats

期間・グループ別の統計。

Query: `start=YYYY-MM-DD&end=YYYY-MM-DD&groupBy=type|subtype`

Response: `[{ id, name, color, totalMinutes, percentage, dailyAverageMinutes }]`

## GET /types

大分類一覧（小分類を含む）。

Response: `[{ id, name, color, sortOrder, subtypes: [{ id, name, sortOrder }] }]`

## POST /types

大分類を作成。

Body: `{ name, color, sortOrder }`

## PUT /types/:id

大分類を更新。sortOrder 変更時は同グループ内の他アイテムを自動シフト。

Body: `{ name?, color?, sortOrder? }`

## DELETE /types/:id

大分類を削除（小分類もカスケード削除）。

## POST /subtypes

小分類を作成。

Body: `{ name, typeId, sortOrder }`

## PUT /subtypes/:id

小分類を更新。

Body: `{ name?, sortOrder? }`

## DELETE /subtypes/:id

小分類を削除（行動が参照している場合は 400 エラー）。
