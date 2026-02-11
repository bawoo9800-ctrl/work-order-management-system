/**
 * ========================================
 * 작업지시서 라우트 (Work Order Routes)
 * ========================================
 * 파일: src/routes/workOrder.routes.js
 * 설명: 작업지시서 관련 API 엔드포인트
 * ========================================
 */

import express from 'express';
import * as workOrderController from '../controllers/workOrder.controller.js';
import { uploadSingle, uploadMultiple, handleMulterError } from '../middleware/upload.middleware.js';

const router = express.Router();

/**
 * POST /api/v1/work-orders/upload
 * 작업지시서 업로드 및 처리 (단일 또는 다중 이미지 → OCR → 자동 분류)
 */
router.post('/upload', uploadMultiple, handleMulterError, workOrderController.uploadWorkOrder);

/**
 * GET /api/v1/work-orders
 * 작업지시서 목록 조회 (페이징, 필터링)
 */
router.get('/', workOrderController.getWorkOrders);

/**
 * GET /api/v1/work-orders/recent
 * 최근 작업지시서 조회
 */
router.get('/recent', workOrderController.getRecentWorkOrders);

/**
 * GET /api/v1/work-orders/trash
 * 휴지통 작업지시서 조회
 */
router.get('/trash', workOrderController.getTrashWorkOrders);

/**
 * GET /api/v1/work-orders/stats/summary
 * 작업지시서 통계
 */
router.get('/stats/summary', workOrderController.getWorkOrderStats);

/**
 * GET /api/v1/work-orders/uuid/:uuid
 * UUID로 작업지시서 조회
 */
router.get('/uuid/:uuid', workOrderController.getWorkOrderByUuid);

/**
 * GET /api/v1/work-orders/:id
 * 작업지시서 상세 조회
 */
router.get('/:id', workOrderController.getWorkOrderById);

/**
 * PUT /api/v1/work-orders/:id
 * 작업지시서 수정
 */
router.put('/:id', workOrderController.updateWorkOrder);

/**
 * DELETE /api/v1/work-orders/:id
 * 작업지시서 삭제 (휴지통으로 이동)
 */
router.delete('/:id', workOrderController.deleteWorkOrder);

/**
 * POST /api/v1/work-orders/:id/restore
 * 작업지시서 복구
 */
router.post('/:id/restore', workOrderController.restoreWorkOrder);

/**
 * DELETE /api/v1/work-orders/:id/permanent
 * 작업지시서 영구 삭제
 */
router.delete('/:id/permanent', workOrderController.permanentlyDeleteWorkOrder);

/**
 * POST /api/v1/work-orders/:id/reclassify
 * 작업지시서 재분류 (수동)
 */
router.post('/:id/reclassify', workOrderController.reclassifyWorkOrder);

/**
 * POST /api/v1/work-orders/:id/upload-edited-image
 * 편집된 이미지 업로드
 */
router.post('/:id/upload-edited-image', uploadSingle, handleMulterError, workOrderController.uploadEditedImage);

/**
 * POST /api/v1/work-orders/:id/add-images
 * 작업지시서에 이미지 추가 (추가촬영 - 다중 지원)
 */
router.post('/:id/add-images', uploadMultiple, handleMulterError, workOrderController.addImagesToWorkOrder);

export default router;
