import { Router } from 'express';
import * as segmentService from '../services/segment.service.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const segments = await segmentService.listSegments();
    res.json(segments);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const segment = await segmentService.getSegment(req.params.id);
    if (!segment) return res.status(404).json({ error: 'Segment not found' });
    res.json(segment);
  } catch (err) { next(err); }
});

router.get('/:id/customers', async (req, res, next) => {
  try {
    const result = await segmentService.getSegmentCustomers(
      req.params.id,
      Number(req.query.page) || 1,
      Number(req.query.page_size) || 20
    );
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description, filter_config, natural_language_query } = req.body;
    if (!name || !filter_config) {
      return res.status(400).json({ error: 'name and filter_config are required' });
    }
    const segment = await segmentService.createSegment({ name, description, filter_config, natural_language_query });
    res.status(201).json(segment);
  } catch (err) { next(err); }
});

router.post('/preview', async (req, res, next) => {
  try {
    const { filter_config } = req.body;
    if (!filter_config) {
      return res.status(400).json({ error: 'filter_config is required' });
    }
    const result = await segmentService.previewSegment(filter_config);
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
