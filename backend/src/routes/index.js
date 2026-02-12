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
import purchaseOrderRoutes from './purchaseOrder.routes.js';
import supplierRoutes from './supplier.routes.js';
import siteRoutes from './site.routes.js';
import userRoutes from './user.routes.js';
import statsRoutes from './stats.routes.js';
import notificationRoutes from './notification.routes.js';
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
router.use('/api/v1/purchase-orders', purchaseOrderRoutes);
router.use('/api/v1/suppliers', supplierRoutes);
router.use('/api/v1/sites', siteRoutes);
router.use('/api/v1/users', userRoutes);
router.use('/api/v1/stats', statsRoutes);
router.use('/api/v1/notifications', notificationRoutes);
router.get('/api/v1/stats-old', asyncHandler(healthController.getStats));

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
        users: {
          list: 'GET /api/v1/users',
          get: 'GET /api/v1/users/:id',
          create: 'POST /api/v1/users',
          delete: 'DELETE /api/v1/users/:id',
        },
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
        purchaseOrders: {
          upload: 'POST /api/v1/purchase-orders/upload',
          list: 'GET /api/v1/purchase-orders',
          get: 'GET /api/v1/purchase-orders/:id',
          update: 'PUT /api/v1/purchase-orders/:id',
          delete: 'DELETE /api/v1/purchase-orders/:id',
          stats: 'GET /api/v1/purchase-orders/stats',
          bySupplier: 'GET /api/v1/purchase-orders/stats/by-supplier',
        },
        suppliers: {
          list: 'GET /api/v1/suppliers',
          get: 'GET /api/v1/suppliers/:id',
          create: 'POST /api/v1/suppliers',
          update: 'PUT /api/v1/suppliers/:id',
          delete: 'DELETE /api/v1/suppliers/:id',
          search: 'GET /api/v1/suppliers/search',
        },
        sites: {
          list: 'GET /api/v1/sites',
          get: 'GET /api/v1/sites/:id',
          create: 'POST /api/v1/sites',
          update: 'PUT /api/v1/sites/:id',
          delete: 'DELETE /api/v1/sites/:id',
          search: 'GET /api/v1/sites/search',
        },
        notifications: {
          register: 'POST /api/v1/notifications/register',
          unregister: 'DELETE /api/v1/notifications/unregister',
          status: 'GET /api/v1/notifications/status',
          test: 'POST /api/v1/notifications/test',
        },
      },
      documentation: '/docs/API.md',
    },
    error: null,
  });
});

export default router;
