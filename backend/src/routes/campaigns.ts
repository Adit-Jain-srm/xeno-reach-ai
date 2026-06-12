import { Router } from 'express';
import * as campaignService from '../services/campaign.service.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await campaignService.listCampaigns({
      status: req.query.status as string,
      page: Number(req.query.page) || 1,
      page_size: Number(req.query.page_size) || 20,
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const campaign = await campaignService.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (err) { next(err); }
});

router.get('/:id/communications', async (req, res, next) => {
  try {
    const result = await campaignService.getCampaignCommunications(
      req.params.id,
      Number(req.query.page) || 1,
      Number(req.query.page_size) || 50
    );
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:id/stats', async (req, res, next) => {
  try {
    const stats = await campaignService.getCampaignStats(req.params.id);
    res.json(stats || { campaign_id: req.params.id, total_sent: 0, total_delivered: 0 });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const campaign = await campaignService.createCampaign(req.body);
    res.status(201).json(campaign);
  } catch (err) { next(err); }
});

router.post('/:id/launch', async (req, res, next) => {
  try {
    const result = await campaignService.launchCampaign(req.params.id);
    res.json(result);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const campaign = await campaignService.updateCampaign(req.params.id, req.body);
    res.json(campaign);
  } catch (err) { next(err); }
});

export default router;
