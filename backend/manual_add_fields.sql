-- work_orders 테이블에 work_type, memo 컬럼 수동 추가
ALTER TABLE work_orders 
ADD COLUMN work_type VARCHAR(50) DEFAULT NULL COMMENT '작업 유형 (FSD/SD/기타품목)' AFTER site_name,
ADD COLUMN memo TEXT DEFAULT NULL COMMENT '메모' AFTER work_type;

-- 인덱스 추가
CREATE INDEX idx_work_type ON work_orders(work_type);

-- 확인
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'work_order_management' 
  AND TABLE_NAME = 'work_orders' 
  AND COLUMN_NAME IN ('work_type', 'memo');
