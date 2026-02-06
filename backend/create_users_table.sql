-- ========================================
-- 사용자(전송자) 테이블
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE COMMENT '사용자명 (전송자명)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_name (name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자(전송자) 관리 테이블';

-- 기본 사용자 추가
INSERT INTO users (name) VALUES 
  ('관리자'),
  ('홍길동'),
  ('김철수')
ON DUPLICATE KEY UPDATE name=name;
