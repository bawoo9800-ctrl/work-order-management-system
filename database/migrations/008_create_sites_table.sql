-- =====================================================
-- 현장 마스터 테이블 마이그레이션
-- 작성일: 2026-02-12
-- 설명: sites 테이블 생성 및 purchase_orders에 site_id 추가
-- =====================================================

USE work_order_management;

-- =====================================================
-- 1. sites 테이블 생성
-- =====================================================
CREATE TABLE IF NOT EXISTS `sites` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `client_id` int(10) unsigned NOT NULL COMMENT '거래처 ID',
  `name` varchar(200) NOT NULL COMMENT '현장명',
  `address` text DEFAULT NULL COMMENT '현장 주소',
  `manager` varchar(100) DEFAULT NULL COMMENT '현장 담당자',
  `phone` varchar(50) DEFAULT NULL COMMENT '연락처',
  `memo` text DEFAULT NULL COMMENT '메모',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '활성 여부',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_client_id` (`client_id`),
  KEY `idx_name` (`name`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_sites_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='현장 마스터';

-- =====================================================
-- 2. purchase_orders 테이블에 site_id 컬럼 추가
-- =====================================================
ALTER TABLE `purchase_orders` 
ADD COLUMN `site_id` int(10) unsigned DEFAULT NULL COMMENT '현장 ID' AFTER `supplier_contact`,
ADD KEY `idx_site_id` (`site_id`);

-- =====================================================
-- 3. 기존 데이터 마이그레이션
-- =====================================================
-- 기존 purchase_orders의 site_name을 sites 테이블로 이동
INSERT INTO `sites` (`client_id`, `name`, `is_active`)
SELECT 
  c.id AS client_id,
  po.site_name AS name,
  1 AS is_active
FROM `purchase_orders` po
INNER JOIN `clients` c ON c.name = po.supplier_name
WHERE po.site_name IS NOT NULL 
  AND po.site_name != ''
  AND po.supplier_name IS NOT NULL
GROUP BY c.id, po.site_name
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- purchase_orders의 site_id 업데이트
UPDATE `purchase_orders` po
INNER JOIN `clients` c ON c.name = po.supplier_name
INNER JOIN `sites` s ON s.client_id = c.id AND s.name = po.site_name
SET po.site_id = s.id
WHERE po.site_name IS NOT NULL AND po.site_name != '';

-- =====================================================
-- 4. work_orders 테이블에도 site_id 추가 (선택사항)
-- =====================================================
ALTER TABLE `work_orders` 
ADD COLUMN `site_id` int(10) unsigned DEFAULT NULL COMMENT '현장 ID' AFTER `site_name`,
ADD KEY `idx_site_id` (`site_id`);

-- =====================================================
-- 5. 마이그레이션 완료 확인
-- =====================================================
SELECT '✅ sites 테이블 생성 완료' AS status;
SELECT COUNT(*) AS site_count FROM sites;
SELECT '✅ purchase_orders에 site_id 추가 완료' AS status;
SELECT COUNT(*) AS updated_count FROM purchase_orders WHERE site_id IS NOT NULL;
