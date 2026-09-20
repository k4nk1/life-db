import { Router } from 'express';
import { tasksService } from '../services/tasks';

const router = Router();

// 完了履歴統計 (/:id より前に定義)
router.get('/completed-stats', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (typeof start !== 'string' || typeof end !== 'string') {
      return res.status(400).json({ error: 'start and end query parameters are required' });
    }
    const stats = await tasksService.getCompletedStats(start, end);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch completed stats' });
  }
});

// 繰り返しタスク一覧 (/:id より前に定義)
router.get('/recurring', async (req, res) => {
  try {
    const recurringTasks = await tasksService.getRecurringTasks();
    res.json(recurringTasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recurring tasks' });
  }
});

// 繰り返しタスク作成
router.post('/recurring', async (req, res) => {
  try {
    const recurringTask = await tasksService.createRecurringTask(req.body);
    res.json(recurringTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create recurring task' });
  }
});

// 繰り返しタスク手動トリガー (/:id より前に定義)
router.post('/recurring/:id/trigger', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const createdTask = await tasksService.triggerRecurringTask(id);
    res.json(createdTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger recurring task' });
  }
});

// 繰り返しタスク更新
router.put('/recurring/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = await tasksService.updateRecurringTask(id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update recurring task' });
  }
});

// 繰り返しタスク削除
router.delete('/recurring/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await tasksService.deleteRecurringTask(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete recurring task' });
  }
});

// タスク一覧・検索・子タスク取得
router.get('/', async (req, res) => {
  try {
    const {
      page,
      limit,
      sort,
      order,
      search,
      status,
      deadlineBefore,
      parentTaskId,
    } = req.query;

    if (parentTaskId !== undefined) {
      const result = await tasksService.getTasks({
        parentTaskId: Number(parentTaskId),
      });
      return res.json(result);
    }

    const result = await tasksService.getTasks({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort: typeof sort === 'string' ? sort : undefined,
      order: order === 'desc' ? 'desc' : order === 'asc' ? 'asc' : undefined,
      search: typeof search === 'string' ? search : undefined,
      status: typeof status === 'string' ? status : undefined,
      deadlineBefore: typeof deadlineBefore === 'string' ? deadlineBefore : undefined,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// タスク作成
router.post('/', async (req, res) => {
  try {
    const task = await tasksService.createTask(req.body);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// タスク更新
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const task = await tasksService.updateTask(id, req.body);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// タスク削除
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await tasksService.deleteTask(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
