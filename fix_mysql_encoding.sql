-- 데이터베이스 인코딩 확인
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';

-- work_orders 테이블 인코딩 확인
SHOW CREATE TABLE work_orders;

-- 테이블 인코딩을 UTF-8로 변경
ALTER TABLE work_orders CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- clients 테이블도 변경
ALTER TABLE clients CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 확인
SELECT 
    id,
    original_filename,
    storage_path,
    created_at
FROM work_orders 
ORDER BY created_at DESC 
LIMIT 5;
