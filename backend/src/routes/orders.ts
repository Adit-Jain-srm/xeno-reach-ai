import { Router } from 'express';
import * as orderService from '../services/order.service.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await orderService.listOrders({
      customer_id: req.query.customer_id as string,
      page: Number(req.query.page) || 1,
      page_size: Number(req.query.page_size) || 20,
    });
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (err) { next(err); }
});

router.post('/bulk', async (req, res, next) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Body must be an array of orders' });
    }
    const result = await orderService.bulkCreateOrders(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

export default router;
