import { Router } from 'express';
import * as analyticsService from '../services/analytics.service.js';
import { analyzeCampaignPerformance } from '../ai/agents/campaign-analyst.js';
import { analyzeAudienceHealth } from '../ai/agents/audience-intel.js';

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

router.get('/audience-intelligence', async (_req, res, next) => {
  try {
    const intel = await analyzeAudienceHealth();
    res.json(intel);
  } catch (err) { next(err); }
});

router.get('/campaign/:id/analysis', async (req, res, next) => {
  try {
    const analysis = await analyzeCampaignPerformance(req.params.id);
    res.json(analysis);
  } catch (err) { next(err); }
});

export default router;
