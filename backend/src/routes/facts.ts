import { Router } from 'express';
import { factsService } from '../services/facts';

const router = Router();

// ランダムに1件取得 (/:id より前に定義)
router.get('/random', async (req, res) => {
  try {
    const fact = await factsService.getRandomFact();
    res.json(fact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch random fact' });
  }
});

// タグ一覧 (/:id より前に定義)
router.get('/tags', async (req, res) => {
  try {
    const tags = await factsService.getTags();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// タグ作成 (/:id より前に定義)
router.post('/tags', async (req, res) => {
  try {
    const tag = await factsService.createTag(req.body);
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// タグ更新 (/:id より前に定義)
router.put('/tags/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const tag = await factsService.updateTag(id, req.body);
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// タグ削除 (/:id より前に定義)
router.delete('/tags/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await factsService.deleteTag(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// 補足更新 (/:id より前に定義)
router.put('/supplements/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { content } = req.body;
    const supplement = await factsService.updateSupplement(id, content);
    res.json(supplement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update supplement' });
  }
});

// 補足削除 (/:id より前に定義)
router.delete('/supplements/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await factsService.deleteSupplement(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete supplement' });
  }
});

// エントリー一覧（ページネーション・タグフィルタ・検索）
router.get('/', async (req, res) => {
  try {
    const { page, limit, tags, search } = req.query;
    const result = await factsService.getFacts({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      tags: typeof tags === 'string' ? tags : undefined,
      search: typeof search === 'string' ? search : undefined,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch facts' });
  }
});

// エントリー作成
router.post('/', async (req, res) => {
  try {
    const fact = await factsService.createFact(req.body);
    res.json(fact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create fact' });
  }
});

// 補足追加
router.post('/:id/supplements', async (req, res) => {
  try {
    const entryId = Number(req.params.id);
    const { content } = req.body;
    const supplement = await factsService.createSupplement(entryId, content);
    res.json(supplement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create supplement' });
  }
});

// エントリー更新
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const fact = await factsService.updateFact(id, req.body);
    res.json(fact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update fact' });
  }
});

// エントリー削除
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await factsService.deleteFact(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete fact' });
  }
});

export default router;
