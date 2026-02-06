-- work_orders 테이블에 작업 유형과 메모 필드 추가
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS work_type VARCHAR(50) DEFAULT NULL COMMENT '작업 유형 (FSD/SD/기타품목)',
ADD COLUMN IF NOT EXISTS memo TEXT DEFAULT NULL COMMENT '메모';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_work_type ON work_orders(work_type);
