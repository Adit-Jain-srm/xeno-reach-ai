import { Router } from 'express';
import * as analyticsService from '../services/analytics.service.js';

const router = Router();

router.get('/overview', async (_req, res, next) => {
  try {
    const metrics = await analyticsService.getOverviewMetrics();
    res.json(metrics);
  } catch (err) { next(err); }
});

router.get('/channels', async (_req, res, next) => {
  try {
    const performance = await analyticsService.getChannelPerformance();
    res.json(performance);
  } catch (err) { next(err); }
});

export default router;
