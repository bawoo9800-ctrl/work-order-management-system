/**
 * ========================================
 * Statistics Routes
 * ========================================
 * 파일: src/routes/stats.routes.js
 * 설명: 통계 API 라우팅
 * ========================================
 */

import express from 'express';
import * as statsController from '../controllers/stats.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = express.Router();

// 월별 통계
router.get('/monthly', asyncHandler(statsController.getMonthlyStats));

// 전송자별 통계
router.get('/by-uploader', asyncHandler(statsController.getStatsByUploader));

// 거래처별 통계
router.get('/by-client', asyncHandler(statsController.getStatsByClient));

// 작업 유형별 통계
router.get('/by-work-type', asyncHandler(statsController.getStatsByWorkType));

export default router;
