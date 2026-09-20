# テーブル定義

## 1. デイリー

### DailyRecord（日ごとの記録）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| date | String | unique | `YYYY-MM-DD` 形式 |
| goal | String | nullable | 目標 |
| reflection | String | nullable | 振り返り |

### ActionType（大分類）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| name | String | | 大分類名 |
| color | String | | HEX色コード |
| sortOrder | Int | default: 0 | 表示順 |

### ActionSubtype（小分類）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| name | String | | 小分類名 |
| typeId | Int | FK → ActionType.id, onDelete: Cascade | 所属する大分類 |
| sortOrder | Int | default: 0 | 表示順 |

### Action（行動ブロック）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| dailyRecordId | Int | FK → DailyRecord.id, onDelete: Cascade | 所属する日 |
| subtypeId | Int | FK → ActionSubtype.id, onDelete: Restrict | 行動の小分類 |
| startMinutes | Int | | 0時からの経過分数（0〜1440） |
| endMinutes | Int | | 0時からの経過分数（0〜1440） |
| detail | String | nullable | 詳細メモ |

---

## 2. やること

### Task

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| title | String | | 内容 |
| detail | String | nullable | 詳細 |
| weight | Int | default: 1 | 重さ (0〜5) |
| deadline | DateTime | nullable | 期限 |
| status | String | default: `"not_started"` | `not_started`(赤) / `completed`(緑) / 自由記述(黄) |
| completedAt | DateTime | nullable | 完了日時（completed に変更時に自動記録） |
| parentTaskId | Int | FK → Task.id, nullable, onDelete: Cascade | 親タスク（null = ルートタスク） |

### RecurringTask（繰り返しタスク）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| title | String | | 内容 |
| detail | String | nullable | 詳細 |
| weight | Int | default: 1 | 重さ (0〜5) |
| repeatType | String | | `daily` / `weekly` / `monthly` / `manual` |
| repeatTime | String | nullable | 時刻 `HH:MM` 形式（manual 時は null） |
| repeatDays | String | nullable | 曜日（weekly: `"1,3,5"` = 月,水,金）/ 日（monthly: `"15"`） |
| deadlineOffset | Int | nullable | 期限の相対分数（タスク追加時刻から何分後か） |

---

## 3. 事実＆思考

### Tag

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| name | String | unique | タグ名 |
| color | String | | HEX色コード |
| sortOrder | Int | default: 0 | 表示順 |

### FactEntry

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| title | String | | タイトル |
| content | String | nullable | 内容 |
| createdAt | DateTime | default: now() | 作成日時 |

### FactEntryTag（中間テーブル）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| entryId | Int | FK → FactEntry.id, onDelete: Cascade | |
| tagId | Int | FK → Tag.id, onDelete: Cascade | |
| @@unique | | [entryId, tagId] | 重複防止 |

### FactSupplement（補足）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| entryId | Int | FK → FactEntry.id, onDelete: Cascade | 所属するエントリー |
| content | String | | 補足の内容 |
| createdAt | DateTime | default: now() | 作成日時 |

---

## 4. やらないこと

### DontEntry

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| content | String | | 内容 |
| createdAt | DateTime | default: now() | 作成日時 |
| deletedAt | DateTime | nullable | 論理削除日時（null = 有効） |

### DontReview（週ごとの振り返り）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| entryId | Int | FK → DontEntry.id, onDelete: Cascade | 対象エントリー |
| weekStart | String | | 週の月曜日 `YYYY-MM-DD` 形式 |
| review | String | | 振り返り内容 |
| @@unique | | [entryId, weekStart] | 同じ週に重複なし |

---

## 5. 文書管理

### Document（自己参照ツリー）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| name | String | | ファイル/フォルダ名 |
| type | String | | `folder` / `document` |
| parentId | Int | FK → Document.id, nullable, onDelete: Cascade | 親フォルダ（null = ルート） |
| content | String | nullable | マークダウン本文（folder 時は null） |
| createdAt | DateTime | default: now() | 作成日時 |
| updatedAt | DateTime | updatedAt | 更新日時 |

---

## 6. 資産

### Transaction（取引）

| カラム | 型 | 制約 | 備考 |
|---|---|---|---|
| id | Int | PK, autoincrement | |
| date | DateTime | | 取引日時 |
| amount | Int | | 金額（プラス=収入、マイナス=支出、ゼロ=金銭移動なし） |
| detail | String | nullable | 詳細 |
