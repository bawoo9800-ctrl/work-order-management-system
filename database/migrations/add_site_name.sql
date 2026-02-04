-- 작업지시서 테이블에 현장명 필드 추가
ALTER TABLE work_orders 
ADD COLUMN site_name VARCHAR(200) DEFAULT NULL COMMENT '현장명' AFTER client_id;

-- 인덱스 추가
CREATE INDEX idx_site_name ON work_orders(site_name);

-- 확인
DESCRIBE work_orders;
