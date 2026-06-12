import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import customersRouter from './routes/customers.js';
import ordersRouter from './routes/orders.js';
import campaignsRouter from './routes/campaigns.js';
import segmentsRouter from './routes/segments.js';
import analyticsRouter from './routes/analytics.js';
import webhooksRouter from './routes/webhooks.js';
import agentRouter from './routes/agent.js';

import { getQueueStats } from './queue/producer.js';

config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check with system status
app.get('/api/health', async (_req, res) => {
  const queue = getQueueStats();
  res.json({
    status: 'ok',
    service: 'crm-backend',
    timestamp: new Date().toISOString(),
    config: {
      supabase: !!process.env.SUPABASE_URL,
      azure_openai: !!process.env.AZURE_OPENAI_API_KEY,
      channel_service: process.env.CHANNEL_SERVICE_URL || 'http://localhost:3002',
    },
    queue,
  });
});

// Mount routes
app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/segments', segmentsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/agent', agentRouter);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  const status = (err as any).status || 500;
  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    status,
  });
});

app.listen(PORT, () => {
  console.log(`[CRM Backend] Running on port ${PORT}`);
  console.log(`[CRM Backend] Health: http://localhost:${PORT}/api/health`);
});

export default app;
