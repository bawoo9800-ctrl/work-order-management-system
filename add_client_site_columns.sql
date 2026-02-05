-- ========================================
-- work_orders 테이블에 client_name, site_name 컬럼 추가
-- ========================================

USE work_order_management;

-- 현재 테이블 구조 확인
DESCRIBE work_orders;

-- client_name 컬럼 추가 (거래처명)
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS client_name VARCHAR(255) DEFAULT NULL 
AFTER client_id;

-- site_name 컬럼 추가 (현장명)
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS site_name VARCHAR(255) DEFAULT NULL 
AFTER client_name;

-- 수정 후 테이블 구조 확인
DESCRIBE work_orders;

-- 기존 데이터에 client_name 채우기 (clients 테이블에서 가져오기)
UPDATE work_orders wo
LEFT JOIN clients c ON wo.client_id = c.id
SET wo.client_name = c.name
WHERE wo.client_id IS NOT NULL AND wo.client_name IS NULL;

-- 확인: 최근 10개 레코드
SELECT id, client_id, client_name, site_name, original_filename, created_at 
FROM work_orders 
ORDER BY id DESC 
LIMIT 10;
