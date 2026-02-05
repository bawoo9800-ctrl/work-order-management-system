#!/bin/bash

echo "=========================================="
echo "🔍 1단계: 현재 storage_path 확인"
echo "=========================================="

mysql -u root -p work_order_management << 'EOF'
SELECT 
    id,
    original_filename,
    storage_path,
    created_at
FROM work_orders 
ORDER BY created_at DESC 
LIMIT 5;
EOF

echo ""
echo "=========================================="
echo "🛠️ 2단계: storage_path 수정"
echo "=========================================="

mysql -u root -p work_order_management << 'EOF'
UPDATE work_orders 
SET storage_path = SUBSTRING_INDEX(storage_path, '/work_orders/', -1)
WHERE storage_path LIKE '/volume1/work_orders/%';

SELECT CONCAT('✅ ', ROW_COUNT(), '건의 레코드가 수정되었습니다.') AS result;
EOF

echo ""
echo "=========================================="
echo "✅ 3단계: 수정 후 확인"
echo "=========================================="

mysql -u root -p work_order_management << 'EOF'
SELECT 
    id,
    original_filename,
    storage_path,
    created_at
FROM work_orders 
ORDER BY created_at DESC 
LIMIT 5;
EOF

echo ""
echo "=========================================="
echo "🔄 4단계: 백엔드 재시작"
echo "=========================================="

cd /volume1/web/work-order-management-system/backend
sudo /usr/local/bin/pm2 restart work-order-backend
sleep 3
sudo /usr/local/bin/pm2 logs work-order-backend --lines 10 --nostream

echo ""
echo "=========================================="
echo "🧪 5단계: 이미지 URL 테스트"
echo "=========================================="

# 최근 이미지 경로 가져오기
LATEST_PATH=$(mysql -u root -p work_order_management -N -e "SELECT storage_path FROM work_orders ORDER BY created_at DESC LIMIT 1;")

echo "📸 최근 이미지 경로: $LATEST_PATH"
echo "🌐 테스트 URL: http://localhost:3200/uploads/$LATEST_PATH"
echo ""

curl -I "http://localhost:3200/uploads/$LATEST_PATH"

echo ""
echo "=========================================="
echo "✅ 완료!"
echo "=========================================="
echo "브라우저에서 http://wo.doorlife.synology.me 를 새로고침하세요."
echo "F12 → Network 탭에서 이미지 URL을 확인하세요."

