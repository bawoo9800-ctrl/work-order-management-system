/**
 * ========================================
 * 알림 컨트롤러
 * ========================================
 * 파일: src/controllers/notification.controller.js
 * 설명: FCM 토큰 및 알림 관리 API
 * ========================================
 */

import * as fcmTokenModel from '../models/fcmToken.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

/**
 * FCM 토큰 등록/업데이트
 * POST /api/v1/notifications/register
 */
export const registerToken = asyncHandler(async (req, res) => {
  const { token, userId, deviceInfo } = req.body;

  if (!token) {
    throw new AppError('FCM 토큰이 필요합니다.', 400);
  }

  await fcmTokenModel.saveToken(token, userId, deviceInfo);

  res.json({
    success: true,
    data: {
      message: '알림 구독이 완료되었습니다.',
    },
    error: null,
  });
});

/**
 * FCM 토큰 삭제 (구독 해제)
 * DELETE /api/v1/notifications/unregister
 */
export const unregisterToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('FCM 토큰이 필요합니다.', 400);
  }

  await fcmTokenModel.deleteToken(token);

  res.json({
    success: true,
    data: {
      message: '알림 구독이 해제되었습니다.',
    },
    error: null,
  });
});

/**
 * 알림 권한 상태 확인
 * GET /api/v1/notifications/status
 */
export const getNotificationStatus = asyncHandler(async (req, res) => {
  const stats = await fcmTokenModel.getTokenStats();

  res.json({
    success: true,
    data: {
      stats,
    },
    error: null,
  });
});

/**
 * 테스트 알림 전송
 * POST /api/v1/notifications/test
 */
export const sendTestNotification = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('FCM 토큰이 필요합니다.', 400);
  }

  const { sendNotification } = await import('../services/notification.service.js');
  
  const notification = {
    title: '🔔 테스트 알림',
    body: '알림이 정상적으로 작동합니다!',
  };

  const data = {
    type: 'test',
    timestamp: new Date().toISOString(),
  };

  const success = await sendNotification(token, notification, data);

  if (!success) {
    throw new AppError('알림 전송에 실패했습니다.', 500);
  }

  res.json({
    success: true,
    data: {
      message: '테스트 알림이 전송되었습니다.',
    },
    error: null,
  });
});
