-- work_orders 테이블의 status 컬럼 확인
DESCRIBE work_orders;

-- status 컬럼 상세 확인
SHOW COLUMNS FROM work_orders LIKE 'status';

-- status ENUM에 'deleted' 추가
ALTER TABLE work_orders 
MODIFY COLUMN status ENUM('pending', 'classified', 'unclassified', 'deleted') 
DEFAULT 'pending';

-- 확인
SHOW COLUMNS FROM work_orders LIKE 'status';

