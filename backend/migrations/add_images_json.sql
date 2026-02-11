-- ========================================
-- 작업지시서 다중 이미지 지원
-- ========================================
-- 날짜: 2026-02-11
-- 설명: work_orders 테이블에 images JSON 컬럼 추가
--       기존 storage_path를 유지하면서 추가 이미지 지원
-- ========================================

-- 1. images 컬럼 추가 (JSON 배열)
ALTER TABLE work_orders 
ADD COLUMN images JSON DEFAULT NULL COMMENT '추가 이미지 목록 (JSON 배열)';

-- 2. 기존 데이터 마이그레이션
-- storage_path가 있는 경우, 첫 번째 이미지로 설정
UPDATE work_orders 
SET images = JSON_ARRAY(
  JSON_OBJECT(
    'path', storage_path,
    'filename', original_filename,
    'order', 1,
    'uploaded_at', created_at
  )
)
WHERE storage_path IS NOT NULL AND images IS NULL;

-- 3. 인덱스 추가 (성능 최적화)
-- JSON 배열 길이로 이미지 개수 조회 최적화
ALTER TABLE work_orders 
ADD COLUMN image_count INT DEFAULT 1 COMMENT '이미지 개수';

-- 4. 이미지 개수 업데이트
UPDATE work_orders 
SET image_count = JSON_LENGTH(images)
WHERE images IS NOT NULL;

UPDATE work_orders 
SET image_count = 1
WHERE images IS NULL AND storage_path IS NOT NULL;

UPDATE work_orders 
SET image_count = 0
WHERE images IS NULL AND storage_path IS NULL;

-- 5. 확인 쿼리
SELECT 
  id, 
  client_name, 
  image_count,
  JSON_LENGTH(images) as json_length,
  storage_path
FROM work_orders 
LIMIT 5;
