/**
 * ========================================
 * 발주서 라우트 (Purchase Order Routes)
 * ========================================
 * 파일: src/routes/purchaseOrder.routes.js
 * 설명: 발주서 관련 API 엔드포인트
 * ========================================
 */

import express from 'express';
import * as purchaseOrderController from '../controllers/purchaseOrder.controller.js';
import { uploadMultiple } from '../middleware/upload.middleware.js';

const router = express.Router();

/**
 * POST /api/v1/purchase-orders/upload
 * 발주서 업로드 (다중 이미지)
 */
router.post(
  '/upload',
  uploadMultiple,
  purchaseOrderController.uploadPurchaseOrder
);

/**
 * GET /api/v1/purchase-orders/stats
 * 발주서 통계
 */
router.get('/stats', purchaseOrderController.getPurchaseOrderStats);

/**
 * GET /api/v1/purchase-orders/stats/by-supplier
 * 공급업체별 발주 통계
 */
router.get('/stats/by-supplier', purchaseOrderController.getPurchaseOrdersBySupplier);

/**
 * GET /api/v1/purchase-orders
 * 모든 발주서 조회 (페이징)
 */
router.get('/', purchaseOrderController.getAllPurchaseOrders);

/**
 * GET /api/v1/purchase-orders/:id
 * ID로 발주서 조회
 */
router.get('/:id', purchaseOrderController.getPurchaseOrderById);

/**
 * PUT /api/v1/purchase-orders/:id
 * 발주서 수정
 */
router.put('/:id', purchaseOrderController.updatePurchaseOrder);

/**
 * DELETE /api/v1/purchase-orders/:id
 * 발주서 삭제 (취소)
 */
router.delete('/:id', purchaseOrderController.deletePurchaseOrder);

/**
 * POST /api/v1/purchase-orders/:id/rotate-image
 * 발주서 이미지 회전 및 저장
 */
router.post('/:id/rotate-image', purchaseOrderController.rotatePurchaseOrderImage);

export default router;
