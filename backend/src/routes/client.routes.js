/**
 * ========================================
 * 거래처 라우터 (Client Routes)
 * ========================================
 * 파일: src/routes/client.routes.js
 * 설명: 거래처 관련 API 엔드포인트
 * ========================================
 */

import express from 'express';
import * as clientController from '../controllers/client.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/v1/clients
 * @desc    모든 거래처 조회
 * @query   active=true/false (기본: true)
 * @access  Public
 */
router.get('/', asyncHandler(clientController.getClients));

/**
 * @route   GET /api/v1/clients/stats
 * @desc    거래처 통계 조회
 * @access  Public
 */
router.get('/stats', asyncHandler(clientController.getClientStats));

/**
 * @route   GET /api/v1/clients/:id
 * @desc    특정 거래처 조회
 * @access  Public
 */
router.get('/:id', asyncHandler(clientController.getClientById));

/**
 * @route   POST /api/v1/clients
 * @desc    거래처 생성
 * @body    { code, name, keywords, aliases, contact_info, priority, notes }
 * @access  Public (추후 인증 추가)
 */
router.post('/', asyncHandler(clientController.createClient));

/**
 * @route   PUT /api/v1/clients/:id
 * @desc    거래처 수정
 * @body    { name, keywords, aliases, contact_info, is_active, priority, notes }
 * @access  Public (추후 인증 추가)
 */
router.put('/:id', asyncHandler(clientController.updateClient));

/**
 * @route   DELETE /api/v1/clients/:id
 * @desc    거래처 삭제 (소프트 삭제)
 * @access  Public (추후 인증 추가)
 */
router.delete('/:id', asyncHandler(clientController.deleteClient));

export default router;
