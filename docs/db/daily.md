# デイリー

## DailyRecord（日ごとの記録）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| date | String | unique | `YYYY-MM-DD` 形式 |
| goal | String | nullable | 目標 |
| reflection | String | nullable | 振り返り |

## ActionType（大分類）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| name | String | | 大分類名 |
| color | String | | HEX色コード |
| sortOrder | Int | default: 0 | 表示順 |

## ActionSubtype（小分類）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| name | String | | 小分類名 |
| typeId | Int | FK → ActionType.id, onDelete: Cascade | 所属する大分類 |
| sortOrder | Int | default: 0 | 表示順 |

## Action（行動ブロック）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| dailyRecordId | Int | FK → DailyRecord.id, onDelete: Cascade | 所属する日 |
| subtypeId | Int | FK → ActionSubtype.id, onDelete: Restrict | 行動の小分類 |
| startMinutes | Int | | 0時からの経過分数（0〜1440） |
| endMinutes | Int | | 0時からの経過分数（0〜1440） |
| detail | String | nullable | 詳細メモ |
