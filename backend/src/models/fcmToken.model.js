/**
 * ========================================
 * FCM 토큰 모델
 * ========================================
 * 파일: src/models/fcmToken.model.js
 * 설명: FCM 디바이스 토큰 관리
 * ========================================
 */

import { query, execute, queryOne } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * FCM 토큰 저장 또는 업데이트
 * @param {string} token - FCM 토큰
 * @param {number} userId - 사용자 ID (선택)
 * @param {string} deviceInfo - 디바이스 정보 (선택)
 * @returns {Promise<number>}
 */
export const saveToken = async (token, userId = null, deviceInfo = null) => {
  const sql = `
    INSERT INTO fcm_tokens (token, user_id, device_info, is_active, last_used_at)
    VALUES (?, ?, ?, TRUE, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      device_info = VALUES(device_info),
      is_active = TRUE,
      last_used_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `;

  const result = await execute(sql, [token, userId, deviceInfo]);
  logger.info('FCM token saved/updated', { token: token.substring(0, 20) + '...', userId });
  return result.affectedRows;
};

/**
 * FCM 토큰 삭제
 * @param {string} token - FCM 토큰
 * @returns {Promise<number>}
 */
export const deleteToken = async (token) => {
  const sql = 'DELETE FROM fcm_tokens WHERE token = ?';
  const result = await execute(sql, [token]);
  logger.info('FCM token deleted', { token: token.substring(0, 20) + '...' });
  return result.affectedRows;
};

/**
 * 활성화된 모든 FCM 토큰 조회
 * @returns {Promise<Array>}
 */
export const getAllActiveTokens = async () => {
  const sql = `
    SELECT token, user_id, device_info, last_used_at
    FROM fcm_tokens
    WHERE is_active = TRUE
    ORDER BY last_used_at DESC
  `;

  const tokens = await query(sql);
  logger.info('Active FCM tokens retrieved', { count: tokens.length });
  return tokens;
};

/**
 * 특정 사용자의 FCM 토큰 조회
 * @param {number} userId - 사용자 ID
 * @returns {Promise<Array>}
 */
export const getTokensByUserId = async (userId) => {
  const sql = `
    SELECT token, device_info, last_used_at
    FROM fcm_tokens
    WHERE user_id = ? AND is_active = TRUE
    ORDER BY last_used_at DESC
  `;

  const tokens = await query(sql, [userId]);
  return tokens;
};

/**
 * 만료된 토큰 비활성화 (30일 이상 미사용)
 * @returns {Promise<number>}
 */
export const deactivateExpiredTokens = async () => {
  const sql = `
    UPDATE fcm_tokens
    SET is_active = FALSE
    WHERE last_used_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND is_active = TRUE
  `;

  const result = await execute(sql);
  logger.info('Expired FCM tokens deactivated', { count: result.affectedRows });
  return result.affectedRows;
};

/**
 * 토큰 통계 조회
 * @returns {Promise<object>}
 */
export const getTokenStats = async () => {
  const sql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive,
      SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) as with_user
    FROM fcm_tokens
  `;

  const stats = await queryOne(sql);
  return stats || { total: 0, active: 0, inactive: 0, with_user: 0 };
};
