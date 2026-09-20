# 資産 API

ベースパス: `/api/assets`

## エンドポイント一覧

| Method | Path | 概要 |
|---|---|---|
| GET | `/transactions` | 取引一覧（ページネーション） |
| POST | `/transactions` | 取引を作成 |
| PUT | `/transactions/:id` | 取引を更新 |
| DELETE | `/transactions/:id` | 取引を削除 |
| GET | `/stats` | 収支の集計値を取得 |

## GET /transactions

取引一覧（ページネーション）。

Query: `start=YYYY-MM-DD&end=YYYY-MM-DD&type=income|expense&page=1&limit=50`

- type=income: amount > 0 のみ
- type=expense: amount < 0 のみ
- 未指定: 全件

Response: `{ items: [{ id, date, amount, detail }], total }`

## POST /transactions

取引を作成。

Body: `{ date, amount, detail? }`

## PUT /transactions/:id

取引を更新。

Body: `{ date?, amount?, detail? }`

## DELETE /transactions/:id

取引を削除。

## GET /stats

収支の集計値を取得。

Query: `start=YYYY-MM-DD&end=YYYY-MM-DD`

Response: `{ incomeTotal, expenseTotal, netProfit }`
