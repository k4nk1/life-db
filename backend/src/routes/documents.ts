import { Router } from 'express';
import { documentsService } from '../services/documents';

const router = Router();

// GET / - 指定階層の子要素を取得（本文なし）
// Query: parentId=null (未指定 or null: ルート階層)
router.get('/', async (req, res) => {
  try {
    const parentIdQuery = req.query.parentId;
    let parentId: number | null = null;
    if (parentIdQuery !== undefined && parentIdQuery !== 'null' && parentIdQuery !== '') {
      parentId = Number(parentIdQuery);
    }
    const docs = await documentsService.getDocuments(parentId);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /:id - 単一ドキュメントの本文を取得
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const doc = await documentsService.getDocumentById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// POST / - フォルダ/ドキュメントを作成
router.post('/', async (req, res) => {
  try {
    const { name, type, parentId, content } = req.body;
    const doc = await documentsService.createDocument({
      name,
      type,
      parentId,
      content,
    });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// PUT /:id - 名前変更・本文編集
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, content } = req.body;
    const doc = await documentsService.updateDocument(id, { name, content });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// DELETE /:id - 削除
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await documentsService.deleteDocument(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// PUT /:id/move - 別のフォルダに移動
router.put('/:id/move', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { parentId } = req.body;
    const doc = await documentsService.moveDocument(
      id,
      parentId !== undefined ? parentId : null
    );
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to move document' });
  }
});

// POST /:id/duplicate - 複製
router.post('/:id/duplicate', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const doc = await documentsService.duplicateDocument(id);
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to duplicate document' });
  }
});

export default router;
