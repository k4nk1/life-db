import { Router } from 'express';
import { dailyService } from '../services/daily';

const router = Router();

// Records
router.get('/records/:date', async (req, res) => {
  try {
    const record = await dailyService.getRecord(req.params.date);
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

router.put('/records/:date', async (req, res) => {
  try {
    const record = await dailyService.updateRecord(req.params.date, req.body);
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// Actions
router.post('/records/:date/actions', async (req, res) => {
  try {
    const action = await dailyService.createAction(req.params.date, req.body);
    res.json(action);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create action' });
  }
});

router.put('/actions/:id', async (req, res) => {
  try {
    const action = await dailyService.updateAction(Number(req.params.id), req.body);
    res.json(action);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update action' });
  }
});

router.delete('/actions/:id', async (req, res) => {
  try {
    await dailyService.deleteAction(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete action' });
  }
});

// Stats
router.get('/stats', async (req, res) => {
  try {
    const { start, end, groupBy } = req.query;
    if (typeof start !== 'string' || typeof end !== 'string' || (groupBy !== 'type' && groupBy !== 'subtype')) {
      return res.status(400).json({ error: 'Invalid query parameters' });
    }
    const stats = await dailyService.getStats(start, end, groupBy as 'type' | 'subtype');
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Types
router.get('/types', async (req, res) => {
  try {
    const types = await dailyService.getTypes();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch types' });
  }
});

router.post('/types', async (req, res) => {
  try {
    const type = await dailyService.createType(req.body);
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create type' });
  }
});

router.put('/types/:id', async (req, res) => {
  try {
    const type = await dailyService.updateType(Number(req.params.id), req.body);
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update type' });
  }
});

router.delete('/types/:id', async (req, res) => {
  try {
    await dailyService.deleteType(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete type' });
  }
});

// Subtypes
router.post('/subtypes', async (req, res) => {
  try {
    const subtype = await dailyService.createSubtype(req.body);
    res.json(subtype);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subtype' });
  }
});

router.put('/subtypes/:id', async (req, res) => {
  try {
    const subtype = await dailyService.updateSubtype(Number(req.params.id), req.body);
    res.json(subtype);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subtype' });
  }
});

router.delete('/subtypes/:id', async (req, res) => {
  try {
    await dailyService.deleteSubtype(Number(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2003') { // Prisma foreign key constraint failure
      res.status(400).json({ error: 'Cannot delete subtype that is in use by actions' });
    } else {
      res.status(500).json({ error: 'Failed to delete subtype' });
    }
  }
});

export default router;
