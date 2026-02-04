-- ========================================
-- 작업지시서 관리 시스템 - 데이터베이스 스키마
-- ========================================
-- MariaDB 10.11+ 버전용
-- 작성일: 2026-02-04
-- ========================================

-- 데이터베이스 생성 (이미 존재하는 경우 스킵)
CREATE DATABASE IF NOT EXISTS work_order_management
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE work_order_management;

-- ========================================
-- 1. 거래처 테이블 (clients)
-- ========================================
-- 작업지시서를 분류할 거래처 마스터 데이터
-- ========================================
CREATE TABLE IF NOT EXISTS clients (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '거래처 고유 ID',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT '거래처 코드 (예: SAMSUNG_ELEC)',
    name VARCHAR(200) NOT NULL COMMENT '거래처 정식 명칭 (예: 삼성전자)',
    
    -- 분류 키워드 (JSON 배열)
    -- 예: ["삼성", "삼성전자", "Samsung", "SAMSUNG"]
    keywords JSON NOT NULL DEFAULT '[]' COMMENT 'OCR 텍스트 매칭용 키워드 배열',
    
    -- 거래처 별칭 (JSON 배열)
    -- 예: ["삼성전자 주식회사", "삼성전자(주)", "Samsung Electronics"]
    aliases JSON NOT NULL DEFAULT '[]' COMMENT '거래처 별칭 목록',
    
    -- 연락처 정보 (JSON 객체)
    -- 예: {"phone": "02-1234-5678", "email": "contact@samsung.com", "address": "서울시 강남구"}
    contact_info JSON DEFAULT NULL COMMENT '연락처 정보 (전화, 이메일, 주소)',
    
    -- 상태 및 메타데이터
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '활성 상태 (비활성화 시 분류에서 제외)',
    priority INT NOT NULL DEFAULT 100 COMMENT '분류 우선순위 (낮을수록 우선)',
    notes TEXT DEFAULT NULL COMMENT '비고',
    
    -- 타임스탬프
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    
    -- 인덱스
    INDEX idx_code (code),
    INDEX idx_name (name),
    INDEX idx_active (is_active),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='거래처 마스터 테이블';

-- ========================================
-- 2. 작업지시서 테이블 (work_orders)
-- ========================================
-- 업로드된 작업지시서 이미지 및 분류 결과
-- ========================================
CREATE TABLE IF NOT EXISTS work_orders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '작업지시서 고유 ID',
    uuid CHAR(36) NOT NULL UNIQUE COMMENT '글로벌 고유 식별자 (UUID v4)',
    
    -- 파일 정보
    original_filename VARCHAR(500) NOT NULL COMMENT '원본 파일명',
    storage_path VARCHAR(1000) NOT NULL COMMENT '저장 경로 (NAS 또는 로컬)',
    file_size_bytes INT UNSIGNED NOT NULL COMMENT '파일 크기 (바이트)',
    mime_type VARCHAR(100) NOT NULL COMMENT 'MIME 타입 (예: image/jpeg)',
    
    -- 이미지 메타데이터
    image_width INT UNSIGNED DEFAULT NULL COMMENT '이미지 너비 (픽셀)',
    image_height INT UNSIGNED DEFAULT NULL COMMENT '이미지 높이 (픽셀)',
    
    -- 분류 결과
    client_id INT UNSIGNED DEFAULT NULL COMMENT '분류된 거래처 ID (미분류 시 NULL)',
    classification_method ENUM('keyword', 'ai_text', 'ai_vision', 'manual', 'pending') NOT NULL DEFAULT 'pending' COMMENT '분류 방법',
    confidence_score DECIMAL(5,4) DEFAULT NULL COMMENT '분류 신뢰도 (0.0000 ~ 1.0000)',
    reasoning TEXT DEFAULT NULL COMMENT '분류 근거 설명 (AI 응답)',
    
    -- OCR 결과
    ocr_text TEXT DEFAULT NULL COMMENT 'OCR 추출 텍스트 (전체)',
    ocr_confidence DECIMAL(5,4) DEFAULT NULL COMMENT 'OCR 평균 신뢰도',
    ocr_processed_at DATETIME DEFAULT NULL COMMENT 'OCR 처리 완료 시각',
    
    -- 작업 정보
    work_date DATE DEFAULT NULL COMMENT '작업 예정일 (OCR/AI에서 추출)',
    work_type VARCHAR(100) DEFAULT NULL COMMENT '작업 유형 (예: 설치, 점검, 수리)',
    
    -- 상태 관리
    status ENUM('pending', 'processing', 'classified', 'failed', 'archived') NOT NULL DEFAULT 'pending' COMMENT '처리 상태',
    error_message TEXT DEFAULT NULL COMMENT '에러 메시지 (실패 시)',
    
    -- 비용 및 성능 추적
    api_cost_usd DECIMAL(10,6) DEFAULT 0.000000 COMMENT 'API 호출 비용 (USD)',
    processing_time_ms INT UNSIGNED DEFAULT NULL COMMENT '총 처리 시간 (밀리초)',
    
    -- 업로드 정보
    uploaded_by VARCHAR(100) DEFAULT NULL COMMENT '업로드한 사용자 (추후 인증 구현 시)',
    uploaded_from VARCHAR(100) DEFAULT NULL COMMENT '업로드 출처 (예: mobile, web, api)',
    
    -- 타임스탬프
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    
    -- 외래키
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- 인덱스
    INDEX idx_uuid (uuid),
    INDEX idx_client (client_id),
    INDEX idx_status (status),
    INDEX idx_classification_method (classification_method),
    INDEX idx_work_date (work_date),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX idx_ocr_text (ocr_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='작업지시서 테이블';

-- ========================================
-- 3. 분류 피드백 테이블 (classification_feedback)
-- ========================================
-- AI/키워드 분류 결과에 대한 사용자 피드백
-- 학습 데이터로 활용 가능
-- ========================================
CREATE TABLE IF NOT EXISTS classification_feedback (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '피드백 고유 ID',
    work_order_id INT UNSIGNED NOT NULL COMMENT '작업지시서 ID',
    
    -- 분류 결과
    predicted_client_id INT UNSIGNED DEFAULT NULL COMMENT 'AI/키워드가 예측한 거래처 ID',
    actual_client_id INT UNSIGNED NOT NULL COMMENT '사용자가 확정한 실제 거래처 ID',
    
    -- 피드백 정보
    is_correct BOOLEAN NOT NULL COMMENT '예측이 정확했는지 여부',
    correction_reason VARCHAR(500) DEFAULT NULL COMMENT '수정 이유',
    corrected_by VARCHAR(100) DEFAULT NULL COMMENT '수정한 사용자',
    
    -- 타임스탬프
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '피드백 생성일시',
    
    -- 외래키
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (predicted_client_id) REFERENCES clients(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (actual_client_id) REFERENCES clients(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- 인덱스
    INDEX idx_work_order (work_order_id),
    INDEX idx_predicted_client (predicted_client_id),
    INDEX idx_actual_client (actual_client_id),
    INDEX idx_is_correct (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='분류 피드백 테이블';

-- ========================================
-- 4. API 비용 추적 테이블 (api_cost_tracking)
-- ========================================
-- OpenAI API 사용량 및 비용 일별 집계
-- ========================================
CREATE TABLE IF NOT EXISTS api_cost_tracking (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '추적 레코드 ID',
    date DATE NOT NULL COMMENT '집계 날짜',
    
    -- API 제공자 및 모델
    api_provider VARCHAR(50) NOT NULL COMMENT 'API 제공자 (예: openai, tesseract)',
    api_model VARCHAR(100) NOT NULL COMMENT '사용한 모델 (예: gpt-4o, gpt-4o-mini)',
    
    -- 사용량
    total_calls INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '총 호출 횟수',
    total_tokens INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '총 토큰 사용량',
    
    -- 비용
    total_cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0.000000 COMMENT '총 비용 (USD)',
    
    -- 타임스탬프
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    
    -- 유니크 제약 (날짜 + 제공자 + 모델 조합)
    UNIQUE KEY uk_date_provider_model (date, api_provider, api_model),
    
    -- 인덱스
    INDEX idx_date (date),
    INDEX idx_provider (api_provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API 비용 추적 테이블';

-- ========================================
-- 5. 시스템 로그 테이블 (system_logs)
-- ========================================
-- 중요 시스템 이벤트 로그 (파일 로깅 보완용)
-- ========================================
CREATE TABLE IF NOT EXISTS system_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '로그 ID',
    
    -- 로그 정보
    level ENUM('debug', 'info', 'warn', 'error', 'fatal') NOT NULL COMMENT '로그 레벨',
    category VARCHAR(100) NOT NULL COMMENT '로그 카테고리 (예: ocr, ai, upload, db)',
    message TEXT NOT NULL COMMENT '로그 메시지',
    
    -- 컨텍스트 데이터 (JSON)
    context JSON DEFAULT NULL COMMENT '추가 컨텍스트 정보',
    
    -- 연관 데이터
    work_order_id INT UNSIGNED DEFAULT NULL COMMENT '관련 작업지시서 ID',
    user_id VARCHAR(100) DEFAULT NULL COMMENT '관련 사용자 ID',
    
    -- 시스템 정보
    hostname VARCHAR(255) DEFAULT NULL COMMENT '호스트명',
    process_id INT DEFAULT NULL COMMENT '프로세스 ID',
    
    -- 타임스탬프
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    
    -- 외래키
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- 인덱스
    INDEX idx_level (level),
    INDEX idx_category (category),
    INDEX idx_work_order (work_order_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='시스템 로그 테이블';

-- ========================================
-- 데이터베이스 사용자 생성 및 권한 부여
-- ========================================
-- 보안상 필요에 따라 실행

-- CREATE USER IF NOT EXISTS 'work_order_user'@'%' IDENTIFIED BY 'your_secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON work_order_management.* TO 'work_order_user'@'%';
-- FLUSH PRIVILEGES;

-- ========================================
-- 스키마 생성 완료
-- ========================================
