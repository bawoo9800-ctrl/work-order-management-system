-- storage_path에서 절대 경로 부분 제거
-- Before: /volume1/work_orders/unclassified/2026/02/abc.jpg
-- After:  unclassified/2026/02/abc.jpg

UPDATE work_orders 
SET storage_path = SUBSTRING_INDEX(storage_path, '/work_orders/', -1)
WHERE storage_path LIKE '/volume1/work_orders/%';

-- 확인: 수정 후 상태
SELECT 
    id,
    original_filename,
    storage_path,
    created_at
FROM work_orders 
ORDER BY created_at DESC 
LIMIT 5;
