-- storage_path에서 /volume1/work_orders/ 제거
UPDATE work_orders 
SET storage_path = REPLACE(storage_path, '/volume1/work_orders/', '')
WHERE storage_path LIKE '/volume1/work_orders/%';

-- 확인
SELECT 
    id,
    original_filename,
    storage_path,
    created_at
FROM work_orders 
ORDER BY created_at DESC 
LIMIT 5;
