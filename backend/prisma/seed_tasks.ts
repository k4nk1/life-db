import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const defaultDbPath = path.resolve(__dirname, 'dev.db');
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl === 'file:./dev.db') {
  databaseUrl = `file:${defaultDbPath}`;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function main() {
  console.log('Clearing existing tasks in dev.db...');
  await prisma.task.deleteMany();

  console.log('Inserting 50 tasks...');
  const now = new Date();

  // ルートタスクを順に作成
  const createdTasks: any[] = [];
  for (let i = 1; i <= 50; i++) {
    const numStr = String(i).padStart(2, '0');
    const weight = (i % 6); // 0〜5
    
    // ステータスと完了日時の割り当て
    let status = 'not_started';
    let completedAt: Date | null = null;
    if (i % 10 === 0) {
      status = 'completed';
      completedAt = new Date(now.getTime() - (i * 3600 * 1000));
    } else if (i % 7 === 0) {
      status = '進行中';
    } else if (i % 11 === 0) {
      status = '確認待ち';
    }

    // 期限の割り当て
    const deadline = i % 3 === 0
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + (i % 14), 23, 45, 0)
      : null;

    // 前提タスクの割り当て（いくつかのタスクを前のタスクの子にする）
    let parentTaskId: number | null = null;
    if (i > 1 && i % 8 === 0 && createdTasks.length > 0) {
      // 1つ前のタスクを親にする
      parentTaskId = createdTasks[createdTasks.length - 1]!.id;
    }

    const task = await prisma.task.create({
      data: {
        title: `タスク ${numStr}`,
        detail: i % 2 === 0 ? `タスク ${numStr} の詳細メモ。重要度や補足情報がここに記載されます。` : null,
        weight,
        deadline,
        status,
        completedAt,
        parentTaskId,
      },
    });

    createdTasks.push(task);
  }

  console.log('Successfully inserted 50 tasks!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
