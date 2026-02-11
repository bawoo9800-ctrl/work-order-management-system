#!/bin/bash
# ========================================
# 다중 이미지 기능 NAS 배포 스크립트
# ========================================

echo "🚀 작업지시서 다중 이미지 기능 배포 시작..."
echo ""

# 1️⃣ 데이터베이스 마이그레이션
echo "=== 1️⃣ 데이터베이스 마이그레이션 ==="
echo "다음 SQL을 MariaDB에서 실행하세요:"
echo ""
cat << 'EOF'
-- images 컬럼 추가
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS images JSON DEFAULT NULL COMMENT '추가 이미지 목록 (JSON 배열)';

-- 이미지 개수 컬럼 추가
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS image_count INT DEFAULT 1 COMMENT '이미지 개수';

-- 기존 데이터 마이그레이션
UPDATE work_orders 
SET images = JSON_ARRAY(
  JSON_OBJECT(
    'path', storage_path,
    'filename', original_filename,
    'order', 1,
    'uploaded_at', created_at
  )
),
image_count = 1
WHERE storage_path IS NOT NULL AND images IS NULL;

-- 확인
SELECT id, client_name, image_count, JSON_LENGTH(images) as json_images 
FROM work_orders 
WHERE images IS NOT NULL
LIMIT 5;
EOF

echo ""
read -p "데이터베이스 마이그레이션을 완료했습니까? (y/n): " db_done
if [ "$db_done" != "y" ]; then
  echo "❌ 데이터베이스 마이그레이션을 먼저 완료해주세요."
  exit 1
fi

# 2️⃣ 최신 코드 가져오기
echo ""
echo "=== 2️⃣ 최신 코드 가져오기 ==="
cd /volume1/web/work-order-management-system
git fetch origin main
git pull origin main
git log --oneline -1

# 3️⃣ 백엔드 재시작
echo ""
echo "=== 3️⃣ 백엔드 재시작 ==="
pm2 restart work-order-backend
sleep 3
pm2 logs work-order-backend --lines 10 --nostream

# 4️⃣ 프론트엔드 재빌드
echo ""
echo "=== 4️⃣ 프론트엔드 재빌드 ==="
cd frontend
rm -rf dist node_modules/.vite
npm run build

# 5️⃣ 프론트엔드 재시작
echo ""
echo "=== 5️⃣ 프론트엔드 재시작 ==="
pm2 restart work-order-frontend
sleep 3

# 6️⃣ 상태 확인
echo ""
echo "=== 6️⃣ 상태 확인 ==="
pm2 status

echo ""
echo "✅ 배포 완료!"
echo "🌐 https://wo.doorlife.synology.me"
