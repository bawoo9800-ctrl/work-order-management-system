/**
 * ========================================
 * User Routes
 * ========================================
 * 파일: src/routes/user.routes.js
 * 설명: 사용자(전송자) 관리 라우팅
 * ========================================
 */

import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = express.Router();

// 모든 사용자 조회
router.get('/', asyncHandler(userController.getAllUsers));

// 사용자 ID로 조회
router.get('/:id', asyncHandler(userController.getUserById));

// 사용자 생성
router.post('/', asyncHandler(userController.createUser));

// 사용자 삭제
router.delete('/:id', asyncHandler(userController.deleteUser));

export default router;
