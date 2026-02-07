-- FCM 토큰 저장 테이블
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  token VARCHAR(500) NOT NULL UNIQUE COMMENT 'FCM 디바이스 토큰',
  user_id INT DEFAULT NULL COMMENT '사용자 ID (선택)',
  device_info VARCHAR(500) DEFAULT NULL COMMENT '디바이스 정보',
  is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 사용 시간',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active),
  INDEX idx_last_used_at (last_used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='FCM 토큰 관리 테이블';

-- 만료된 토큰 자동 비활성화 (30일 이상 미사용)
-- 크론잡으로 실행 권장
-- UPDATE fcm_tokens SET is_active = FALSE WHERE last_used_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
