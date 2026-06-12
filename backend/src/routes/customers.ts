import { Router } from 'express';
import * as customerService from '../services/customer.service.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await customerService.listCustomers({
      page: Number(req.query.page) || 1,
      page_size: Number(req.query.page_size) || 20,
      city: req.query.city as string,
      loyalty_tier: req.query.loyalty_tier as string,
      preferred_channel: req.query.preferred_channel as string,
      min_spent: req.query.min_spent ? Number(req.query.min_spent) : undefined,
      max_spent: req.query.max_spent ? Number(req.query.max_spent) : undefined,
      min_orders: req.query.min_orders ? Number(req.query.min_orders) : undefined,
      search: req.query.search as string,
      segment_tag: req.query.segment_tag as string,
      inactive_days: req.query.inactive_days ? Number(req.query.inactive_days) : undefined,
      sort_by: req.query.sort_by as string,
      sort_order: req.query.sort_order as 'asc' | 'desc',
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerWithOrders(req.params.id);
    res.json(customer);
  } catch (err) { next(err); }
});

router.get('/:id/timeline', async (req, res, next) => {
  try {
    const timeline = await customerService.getCustomerTimeline(req.params.id);
    res.json(timeline);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json(customer);
  } catch (err) { next(err); }
});

router.post('/bulk', async (req, res, next) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Body must be an array of customers' });
    }
    const result = await customerService.bulkCreateCustomers(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

export default router;
