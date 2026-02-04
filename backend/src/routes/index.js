/**
 * ========================================
 * 메인 라우터 (Main Routes)
 * ========================================
 * 파일: src/routes/index.js
 * 설명: API 엔드포인트 통합 라우팅
 * ========================================
 */

import express from 'express';
import clientRoutes from './client.routes.js';
import workOrderRoutes from './workOrder.routes.js';
import * as healthController from '../controllers/health.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = express.Router();

/**
 * 헬스체크 (루트 레벨)
 * GET /health
 */
router.get('/health', asyncHandler(healthController.healthCheck));

/**
 * API v1 라우트
 */
router.use('/api/v1/clients', clientRoutes);
router.use('/api/v1/work-orders', workOrderRoutes);
router.get('/api/v1/stats', asyncHandler(healthController.getStats));

/**
 * API 루트 정보
 * GET /api/v1
 */
router.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    data: {
      message: '작업지시서 관리 시스템 API v1',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        stats: '/api/v1/stats',
        clients: {
          list: 'GET /api/v1/clients',
          get: 'GET /api/v1/clients/:id',
          create: 'POST /api/v1/clients',
          update: 'PUT /api/v1/clients/:id',
          delete: 'DELETE /api/v1/clients/:id',
          stats: 'GET /api/v1/clients/stats',
        },
        workOrders: {
          upload: 'POST /api/v1/work-orders/upload',
          list: 'GET /api/v1/work-orders',
          get: 'GET /api/v1/work-orders/:id',
          getByUuid: 'GET /api/v1/work-orders/uuid/:uuid',
          update: 'PUT /api/v1/work-orders/:id',
          delete: 'DELETE /api/v1/work-orders/:id',
          recent: 'GET /api/v1/work-orders/recent',
          stats: 'GET /api/v1/work-orders/stats/summary',
          reclassify: 'POST /api/v1/work-orders/:id/reclassify',
        },
      },
      documentation: '/docs/API.md',
    },
    error: null,
  });
});

export default router;
