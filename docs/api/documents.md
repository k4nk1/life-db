# 文書管理 API

ベースパス: `/api/documents`

ツリーは階層別に遅延読み込み。ルート階層を初期表示し、フォルダ展開時に子要素を取得。本文は個別に取得。

## エンドポイント一覧

| Method | Path | 概要 |
|---|---|---|
| GET | `/` | 指定階層の子要素を取得（本文なし） |
| GET | `/:id` | 単一ドキュメントの本文を取得 |
| POST | `/` | フォルダ/ドキュメントを作成 |
| PUT | `/:id` | 名前変更・本文編集 |
| DELETE | `/:id` | 削除 |
| PUT | `/:id/move` | 別のフォルダに移動 |
| POST | `/:id/duplicate` | 複製 |

## GET /

指定階層の子要素を取得（本文なし）。ページネーションなし。

Query: `parentId=null`（未指定 or null: ルート階層）

Response: `[{ id, name, type, parentId, createdAt, updatedAt }]`

## GET /:id

単一ドキュメントの本文を取得。

Response: `{ id, name, type, parentId, content, createdAt, updatedAt }`

## POST /

フォルダ/ドキュメントを作成。

Body: `{ name, type, parentId?, content? }`

## PUT /:id

名前変更・本文編集。

Body: `{ name?, content? }`

## DELETE /:id

削除（フォルダは再帰的にカスケード削除）。

## PUT /:id/move

別のフォルダに移動。

Body: `{ parentId }`（null でルートに移動）

## POST /:id/duplicate

複製。フォルダは再帰的に複製。複製名: "{元の名前}のコピー"。

Response: 複製されたドキュメント/ツリー
