import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import cron from 'node-cron';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// APIルーティング
import dailyRouter from './routes/daily';
import tasksRouter from './routes/tasks';
import factsRouter from './routes/facts';
import dontsRouter from './routes/donts';

app.use('/api/daily', dailyRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/facts', factsRouter);
app.use('/api/donts', dontsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 毎分実行: 繰り返しタスクの自動生成
import { tasksService } from './services/tasks';
cron.schedule('* * * * *', async () => {
  try {
    await tasksService.checkAndCreateRecurringTasks();
  } catch (err) {
    console.error('Failed to run recurring tasks cron job:', err);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
