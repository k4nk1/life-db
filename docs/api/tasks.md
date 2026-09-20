# やること API

ベースパス: `/api/tasks`

## エンドポイント一覧

| Method | Path | 概要 |
|---|---|---|
| GET | `/` | タスク一覧（ページネーション・ソート・検索・フィルタ） |
| POST | `/` | タスクを作成 |
| PUT | `/:id` | タスクを更新 |
| DELETE | `/:id` | タスクを削除 |
| GET | `/completed-stats` | 完了履歴の統計 |
| GET | `/recurring` | 繰り返しタスク一覧 |
| POST | `/recurring` | 繰り返しタスクを作成 |
| PUT | `/recurring/:id` | 繰り返しタスクを更新 |
| DELETE | `/recurring/:id` | 繰り返しタスクを削除 |
| POST | `/recurring/:id/trigger` | 手動でタスク一覧に追加 |

## GET /

タスク一覧を取得。動作モードが2つある。

**モード1: ルート/検索（ページネーションあり）**

Query: `page=1&limit=50&sort=weight|deadline|status&search=keyword&status=not_started&deadlineBefore=ISO8601`

Response: `{ items: [{ id, title, detail, weight, totalWeight, deadline, status, completedAt, parentTaskId }], total }`

- `search` 未指定時はルートタスク（parentTaskId=null）のみ返す
- `search` 指定時は全階層からフラットに検索

**モード2: 子タスク取得（ページネーションなし）**

Query: `parentTaskId=5`

Response: `[{ id, title, detail, weight, totalWeight, deadline, status, completedAt, parentTaskId }]`

- 指定タスクの直接の子タスクを全件返す

※ `totalWeight`（自身 + 全子孫の重さ合計）はサーバー側で計算

## POST /

タスクを作成。

Body: `{ title, detail?, weight?, deadline?, status?, parentTaskId? }`

## PUT /:id

タスクを更新。status → completed 時に completedAt を自動記録。

Body: `{ title?, detail?, weight?, deadline?, status?, parentTaskId? }`

## DELETE /:id

タスクを削除（子タスクもカスケード削除）。

## GET /completed-stats

完了履歴の統計。

Query: `start=YYYY-MM-DD&end=YYYY-MM-DD`

Response: `{ count, totalWeight }`

## GET /recurring

繰り返しタスク一覧。

Response: `[{ id, title, detail, weight, repeatType, repeatTime, repeatDays, deadlineOffset }]`

## POST /recurring

繰り返しタスクを作成。

Body: `{ title, detail?, weight?, repeatType, repeatTime?, repeatDays?, deadlineOffset? }`

## PUT /recurring/:id

繰り返しタスクを更新。

Body: `{ title?, detail?, weight?, repeatType?, repeatTime?, repeatDays?, deadlineOffset? }`

## DELETE /recurring/:id

繰り返しタスクを削除。

## POST /recurring/:id/trigger

手動でタスク一覧に追加。

Response: 作成されたTask

## 自動トリガー

`node-cron` で定期チェックし、daily/weekly/monthly の繰り返しタスクを自動生成する（APIエンドポイントではない）。
