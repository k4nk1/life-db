# やること

## Task

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

## RecurringTask（繰り返しタスク）

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
