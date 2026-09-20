import { Router } from 'express';
import { assetsService } from '../services/assets';
import { TransactionType } from '../../../shared/types/assets';

const router = Router();

// GET /transactions - 取引一覧（ページネーション・フィルタ）
router.get('/transactions', async (req, res) => {
  try {
    const { start, end, type, page, limit } = req.query;
    const result = await assetsService.getTransactions({
      start: start as string | undefined,
      end: end as string | undefined,
      type: type as TransactionType | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /transactions - 取引作成
router.post('/transactions', async (req, res) => {
  try {
    const { date, amount, detail } = req.body;
    const item = await assetsService.createTransaction({
      date,
      amount,
      detail,
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// PUT /transactions/:id - 取引更新
router.put('/transactions/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { date, amount, detail } = req.body;
    const item = await assetsService.updateTransaction(id, {
      date,
      amount,
      detail,
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// DELETE /transactions/:id - 取引削除
router.delete('/transactions/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await assetsService.deleteTransaction(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// GET /stats - 収支の集計値を取得
router.get('/stats', async (req, res) => {
  try {
    const { start, end } = req.query;
    const stats = await assetsService.getStats(
      start as string | undefined,
      end as string | undefined
    );
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch asset stats' });
  }
});

export default router;
