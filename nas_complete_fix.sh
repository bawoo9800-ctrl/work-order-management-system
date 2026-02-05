#!/bin/bash

echo "=========================================="
echo "🔧 완전 복구 스크립트"
echo "=========================================="

cd /volume1/web/work-order-management-system

echo ""
echo "1️⃣ Git 상태 확인"
echo "=========================================="
git status
git log -1 --oneline

echo ""
echo "2️⃣ 최신 코드 가져오기 (강제)"
echo "=========================================="
git fetch origin
git reset --hard origin/main
git log -1 --oneline

echo ""
echo "3️⃣ imageProcessor.js 확인"
echo "=========================================="
echo "relativePath 라인 확인:"
grep -n "relativePath" backend/src/utils/imageProcessor.js | tail -5

echo ""
echo "4️⃣ 데이터베이스 수정"
echo "=========================================="
mysql -u root -p work_order_management << 'EOF'
-- 현재 상태 확인
SELECT 
    id,
    storage_path,
    created_at
FROM work_orders 
ORDER BY created_at DESC 
LIMIT 3;

-- 잘못된 경로 수정
UPDATE work_orders 
SET storage_path = REPLACE(storage_path, '/volume1/work_orders/', '')
WHERE storage_path LIKE '/volume1/work_orders/%';

-- 수정 후 확인
SELECT 
    id,
    storage_path,
    created_at
FROM work_orders 
ORDER BY created_at DESC 
LIMIT 3;
EOF

echo ""
echo "5️⃣ 백엔드 완전 재시작"
echo "=========================================="
cd backend
sudo /usr/local/bin/pm2 delete work-order-backend
sudo /usr/local/bin/pm2 start src/server.js --name work-order-backend
sleep 5
sudo /usr/local/bin/pm2 logs work-order-backend --lines 30 --nostream

echo ""
echo "6️⃣ 테스트 업로드"
echo "=========================================="
echo "업로드 페이지에서 새 이미지를 업로드한 후,"
echo "아래 명령어로 storage_path 확인:"
echo ""
echo "mysql -u root -p work_order_management -e \"SELECT id, storage_path FROM work_orders ORDER BY created_at DESC LIMIT 1;\""
echo ""

echo "=========================================="
echo "✅ 완료!"
echo "=========================================="

