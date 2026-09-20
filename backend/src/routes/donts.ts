import { Router } from 'express';
import { dontsService } from '../services/donts';

const router = Router();

// GET / - エントリー一覧取得（週フィルタ、振り返り付き）
router.get('/', async (req, res) => {
  try {
    const weekStart = req.query.weekStart as string | undefined;
    const entries = await dontsService.getEntries(weekStart);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dont entries' });
  }
});

// POST / - エントリー作成
router.post('/', async (req, res) => {
  try {
    const { content } = req.body;
    const entry = await dontsService.createEntry({ content });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create dont entry' });
  }
});

// PUT /:id - エントリー更新
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { content } = req.body;
    const entry = await dontsService.updateEntry(id, { content });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update dont entry' });
  }
});

// DELETE /:id - 論理削除
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await dontsService.deleteEntry(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete dont entry' });
  }
});

// PUT /:id/reviews/:weekStart - 振り返りの作成・更新（upsert）
router.put('/:id/reviews/:weekStart', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { weekStart } = req.params;
    const { review } = req.body;
    const result = await dontsService.upsertReview(id, weekStart, review);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update dont review' });
  }
});

export default router;
