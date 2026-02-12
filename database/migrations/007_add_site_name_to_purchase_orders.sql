-- ========================================
-- 발주서 테이블에 현장명 컬럼 추가
-- ========================================
-- 파일: database/migrations/007_add_site_name_to_purchase_orders.sql
-- 작성일: 2026-02-12
-- 설명: purchase_orders 테이블에 site_name 필드 추가
-- ========================================

USE work_order_management;

-- 1. site_name 컬럼 추가 (supplier_name 다음에 배치)
ALTER TABLE purchase_orders
ADD COLUMN site_name VARCHAR(255) NULL COMMENT '현장명' AFTER supplier_name;

-- 2. 인덱스 추가 (검색 성능 향상)
CREATE INDEX idx_site_name ON purchase_orders(site_name);

-- 3. 변경 사항 확인
DESCRIBE purchase_orders;

-- 완료
SELECT '✅ 현장명 컬럼 추가 완료' AS status;
