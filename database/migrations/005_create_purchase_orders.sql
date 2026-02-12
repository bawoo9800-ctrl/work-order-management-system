-- =====================================================
-- 발주서 관리 시스템 마이그레이션
-- 작성일: 2026-02-12
-- 설명: purchase_orders 테이블 및 suppliers 테이블 생성
-- =====================================================

USE work_order_management;

-- =====================================================
-- 1. purchase_orders 테이블 생성
-- =====================================================
CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL COMMENT '고유 식별자',
  
  -- 파일 정보
  `original_filename` varchar(500) NOT NULL COMMENT '원본 파일명',
  `storage_path` varchar(1000) DEFAULT NULL COMMENT '단일 이미지 경로 (레거시)',
  `images` JSON DEFAULT NULL COMMENT '다중 이미지 정보 배열',
  `image_count` int(11) DEFAULT 1 COMMENT '이미지 개수',
  `file_size` int(11) DEFAULT NULL COMMENT '파일 크기 (bytes)',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME 타입',
  `image_width` int(11) DEFAULT NULL COMMENT '이미지 가로 크기',
  `image_height` int(11) DEFAULT NULL COMMENT '이미지 세로 크기',
  
  -- 발주 정보
  `supplier_id` int(11) DEFAULT NULL COMMENT '공급업체 ID',
  `supplier_name` varchar(200) DEFAULT NULL COMMENT '공급업체명',
  `supplier_contact` varchar(100) DEFAULT NULL COMMENT '공급업체 연락처',
  `order_date` date DEFAULT NULL COMMENT '발주 날짜',
  `delivery_date` date DEFAULT NULL COMMENT '납품 예정일',
  `order_amount` decimal(15,2) DEFAULT NULL COMMENT '발주 금액',
  `currency` varchar(10) DEFAULT 'KRW' COMMENT '화폐 단위',
  
  -- 품목 정보
  `items` JSON DEFAULT NULL COMMENT '발주 품목 리스트 JSON',
  `item_count` int(11) DEFAULT 0 COMMENT '품목 개수',
  
  -- 상태 관리
  `status` enum('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending' COMMENT '발주 상태',
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal' COMMENT '우선순위',
  
  -- OCR 및 분류
  `ocr_text` text DEFAULT NULL COMMENT 'OCR 추출 텍스트',
  `classification_method` varchar(50) DEFAULT 'pending' COMMENT '분류 방법',
  `confidence_score` float DEFAULT NULL COMMENT '분류 신뢰도',
  `reasoning` text DEFAULT NULL COMMENT '분류 이유',
  
  -- 메모 및 기타
  `memo` text DEFAULT NULL COMMENT '메모',
  `tags` JSON DEFAULT NULL COMMENT '태그',
  
  -- AI 처리 정보
  `api_cost_usd` decimal(10,6) DEFAULT 0.000000 COMMENT 'API 비용 (USD)',
  `processing_time_ms` int(11) DEFAULT 0 COMMENT '처리 시간 (ms)',
  
  -- 업로드 정보
  `uploaded_by` varchar(100) DEFAULT NULL COMMENT '업로더',
  `uploaded_from` varchar(100) DEFAULT NULL COMMENT '업로드 출처 (IP/기기)',
  
  -- 타임스탬프
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_supplier_name` (`supplier_name`),
  KEY `idx_order_date` (`order_date`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='발주서 관리';

-- =====================================================
-- 2. suppliers 테이블 생성
-- =====================================================
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL COMMENT '공급업체명',
  `contact_person` varchar(100) DEFAULT NULL COMMENT '담당자명',
  `phone` varchar(50) DEFAULT NULL COMMENT '전화번호',
  `email` varchar(200) DEFAULT NULL COMMENT '이메일',
  `address` text DEFAULT NULL COMMENT '주소',
  `business_number` varchar(50) DEFAULT NULL COMMENT '사업자등록번호',
  `memo` text DEFAULT NULL COMMENT '메모',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '활성 여부',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='공급업체 마스터';

-- =====================================================
-- 3. 샘플 데이터 삽입 (선택사항)
-- =====================================================

-- 샘플 공급업체 데이터
INSERT IGNORE INTO `suppliers` (`name`, `contact_person`, `phone`, `email`) VALUES
('ABC 자재', '김철수', '02-1234-5678', 'abc@example.com'),
('XYZ 건자재', '이영희', '031-2345-6789', 'xyz@example.com'),
('한국 건설자재', '박민수', '02-3456-7890', 'korea@example.com');

-- =====================================================
-- 4. 권한 설정 (필요시)
-- =====================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON work_order_management.purchase_orders TO 'app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON work_order_management.suppliers TO 'app_user'@'localhost';

-- =====================================================
-- 5. 마이그레이션 완료 확인
-- =====================================================

SELECT 'purchase_orders 테이블 생성 완료' AS status;
SELECT 'suppliers 테이블 생성 완료' AS status;
