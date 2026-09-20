# 事実＆思考

## Tag

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| name | String | unique | タグ名 |
| color | String | | HEX色コード |
| sortOrder | Int | default: 0 | 表示順 |

## FactEntry

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| title | String | | タイトル |
| content | String | nullable | 内容 |
| createdAt | DateTime | default: now() | 作成日時 |

## FactEntryTag（中間テーブル）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| entryId | Int | FK → FactEntry.id, onDelete: Cascade | |
| tagId | Int | FK → Tag.id, onDelete: Cascade | |
| @@unique | | [entryId, tagId] | 重複防止 |

## FactSupplement（補足）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| entryId | Int | FK → FactEntry.id, onDelete: Cascade | 所属するエントリー |
| content | String | | 補足の内容 |
| createdAt | DateTime | default: now() | 作成日時 |
