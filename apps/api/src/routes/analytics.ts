import { Router } from 'express';
import {
  fetchGa4CoreReports,
  fetchGa4RealtimeReport,
  Ga4ApiError,
  getGa4ConfigStatus,
  validateAndResolveAnalyticsQuery
} from '../services/ga4.js';

export const analyticsRouter = Router();

analyticsRouter.get('/status', (_req, res) => {
  res.json(getGa4ConfigStatus());
});

analyticsRouter.get('/reports', async (req, res, next) => {
  try {
    const filters = validateAndResolveAnalyticsQuery(req.query as Record<string, unknown>);
    const forceRefresh = String(req.query.refresh || '') === 'true';
    const data = await fetchGa4CoreReports(filters, forceRefresh);
    res.json(data);
  } catch (err) {
    if (err instanceof Ga4ApiError) {
      res.status(err.status).json({ error: err.message, code: err.code });
      return;
    }
    next(err);
  }
});

analyticsRouter.get('/realtime', async (req, res, next) => {
  try {
    const forceRefresh = String(req.query.refresh || '') === 'true';
    const data = await fetchGa4RealtimeReport(forceRefresh);
    res.json(data);
  } catch (err) {
    if (err instanceof Ga4ApiError) {
      res.status(err.status).json({ error: err.message, code: err.code });
      return;
    }
    next(err);
  }
});
