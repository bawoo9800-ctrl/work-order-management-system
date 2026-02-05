-- 최근 작업지시서 5건의 storage_path 확인
SELECT 
    id,
    original_filename,
    storage_path,
    LENGTH(storage_path) as path_length,
    created_at
FROM work_orders 
ORDER BY created_at DESC 
LIMIT 10;
