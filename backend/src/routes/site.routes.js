/**
 * ========================================
 * 현장 API 라우트
 * ========================================
 * 파일: src/routes/site.routes.js
 * 설명: 현장 관련 엔드포인트
 * ========================================
 */

import express from 'express';
import siteController from '../controllers/site.controller.js';

const router = express.Router();

/**
 * @route   GET /api/v1/sites/search
 * @desc    현장 검색 (자동완성용)
 * @query   clientId, q, limit
 * @access  Public
 */
router.get('/search', siteController.searchSites);

/**
 * @route   GET /api/v1/sites
 * @desc    현장 목록 조회
 * @query   clientId, active
 * @access  Public
 */
router.get('/', siteController.getSites);

/**
 * @route   GET /api/v1/sites/:id
 * @desc    현장 상세 조회
 * @access  Public
 */
router.get('/:id', siteController.getSiteById);

/**
 * @route   POST /api/v1/sites
 * @desc    현장 생성
 * @body    { client_id, name, address, manager, phone, memo }
 * @access  Public
 */
router.post('/', siteController.createSite);

/**
 * @route   PUT /api/v1/sites/:id
 * @desc    현장 수정
 * @body    { name, address, manager, phone, memo, is_active }
 * @access  Public
 */
router.put('/:id', siteController.updateSite);

/**
 * @route   DELETE /api/v1/sites/:id
 * @desc    현장 삭제 (소프트 삭제)
 * @access  Public
 */
router.delete('/:id', siteController.deleteSite);

export default router;
