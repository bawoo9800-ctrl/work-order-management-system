/**
 * ========================================
 * 알림 라우트
 * ========================================
 * 파일: src/routes/notification.routes.js
 * 설명: FCM 알림 관련 API 라우트
 * ========================================
 */

import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';

const router = express.Router();

// FCM 토큰 등록
router.post('/register', notificationController.registerToken);

// FCM 토큰 삭제 (구독 해제)
router.delete('/unregister', notificationController.unregisterToken);

// 알림 상태 확인
router.get('/status', notificationController.getNotificationStatus);

// 테스트 알림 전송
router.post('/test', notificationController.sendTestNotification);

export default router;
