# やらないこと

## DontEntry

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| content | String | | 内容 |
| createdAt | DateTime | default: now() | 作成日時 |
| deletedAt | DateTime | nullable | 論理削除日時（null = 有効） |

## DontReview（週ごとの振り返り）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| entryId | Int | FK → DontEntry.id, onDelete: Cascade | 対象エントリー |
| weekStart | String | | 週の月曜日 `YYYY-MM-DD` 形式 |
| review | String | | 振り返り内容 |
| @@unique | | [entryId, weekStart] | 同じ週に重複なし |
