/**
 * ========================================
 * 알림 서비스 (Notification Service)
 * ========================================
 * 파일: src/services/notification.service.js
 * 설명: Firebase Cloud Messaging을 통한 푸시 알림
 * ========================================
 */

import admin from 'firebase-admin';
import logger from '../utils/logger.js';

let firebaseInitialized = false;

/**
 * Firebase Admin 초기화
 */
export const initializeFirebase = () => {
  if (firebaseInitialized) {
    return;
  }

  try {
    // 환경 변수에서 Firebase 서비스 계정 정보 가져오기
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      logger.warn('Firebase credentials not configured. Push notifications disabled.');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseInitialized = true;
    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
  }
};

/**
 * 단일 디바이스에 알림 전송
 * @param {string} token - FCM 디바이스 토큰
 * @param {object} notification - 알림 내용
 * @param {object} data - 추가 데이터
 * @returns {Promise<boolean>}
 */
export const sendNotification = async (token, notification, data = {}) => {
  if (!firebaseInitialized) {
    logger.warn('Firebase not initialized. Skipping notification.');
    return false;
  }

  try {
    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        icon: '/logo192.png', // 아이콘 경로
      },
      data: {
        ...data,
        click_action: data.click_action || '/',
      },
      webpush: {
        fcmOptions: {
          link: data.click_action || '/',
        },
      },
    };

    const response = await admin.messaging().send(message);
    logger.info('Notification sent successfully:', { token, response });
    return true;
  } catch (error) {
    logger.error('Failed to send notification:', error);
    return false;
  }
};

/**
 * 여러 디바이스에 알림 전송 (멀티캐스트)
 * @param {string[]} tokens - FCM 디바이스 토큰 배열
 * @param {object} notification - 알림 내용
 * @param {object} data - 추가 데이터
 * @returns {Promise<object>}
 */
export const sendMulticastNotification = async (tokens, notification, data = {}) => {
  if (!firebaseInitialized) {
    logger.warn('Firebase not initialized. Skipping notification.');
    return { successCount: 0, failureCount: tokens.length };
  }

  try {
    const message = {
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
        icon: '/logo192.png',
      },
      data: {
        ...data,
        click_action: data.click_action || '/',
      },
      webpush: {
        fcmOptions: {
          link: data.click_action || '/',
        },
      },
    };

    const response = await admin.messaging().sendMulticast(message);
    logger.info('Multicast notification sent:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error) {
    logger.error('Failed to send multicast notification:', error);
    return { successCount: 0, failureCount: tokens.length };
  }
};

/**
 * 작업지시서 등록 알림
 * @param {string[]} tokens - 구독자 토큰 배열
 * @param {object} workOrder - 작업지시서 정보
 * @returns {Promise<object>}
 */
export const notifyWorkOrderCreated = async (tokens, workOrder) => {
  const notification = {
    title: '📋 새 작업지시서 등록',
    body: `${workOrder.client_name || '거래처 미지정'} - ${workOrder.uploaded_by || '전송자 미상'}`,
  };

  const data = {
    type: 'work_order_created',
    work_order_id: String(workOrder.id),
    client_name: workOrder.client_name || '',
    uploaded_by: workOrder.uploaded_by || '',
    click_action: '/', // 홈 페이지로 이동
  };

  return await sendMulticastNotification(tokens, notification, data);
};

/**
 * 작업지시서 수정 알림
 * @param {string[]} tokens - 구독자 토큰 배열
 * @param {object} workOrder - 작업지시서 정보
 * @returns {Promise<object>}
 */
export const notifyWorkOrderUpdated = async (tokens, workOrder) => {
  const notification = {
    title: '✏️ 작업지시서 수정',
    body: `${workOrder.client_name || '거래처 미지정'} - 정보가 수정되었습니다.`,
  };

  const data = {
    type: 'work_order_updated',
    work_order_id: String(workOrder.id),
    client_name: workOrder.client_name || '',
    click_action: '/',
  };

  return await sendMulticastNotification(tokens, notification, data);
};

/**
 * 작업지시서 삭제 알림
 * @param {string[]} tokens - 구독자 토큰 배열
 * @param {object} workOrder - 작업지시서 정보
 * @returns {Promise<object>}
 */
export const notifyWorkOrderDeleted = async (tokens, workOrder) => {
  const notification = {
    title: '🗑️ 작업지시서 삭제',
    body: `${workOrder.client_name || '거래처 미지정'} - 작업지시서가 삭제되었습니다.`,
  };

  const data = {
    type: 'work_order_deleted',
    work_order_id: String(workOrder.id),
    client_name: workOrder.client_name || '',
    click_action: '/',
  };

  return await sendMulticastNotification(tokens, notification, data);
};
