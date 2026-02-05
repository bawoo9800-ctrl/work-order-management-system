#!/bin/bash

echo "=========================================="
echo "🔧 이미지 경로 연결 (심볼릭 링크)"
echo "=========================================="

cd /volume1/web/work-order-management-system/backend

# 기존 uploads 디렉토리 백업 (있다면)
if [ -d "uploads" ] && [ ! -L "uploads" ]; then
    echo "📦 기존 uploads 디렉토리 백업 중..."
    mv uploads uploads_backup_$(date +%Y%m%d_%H%M%S)
fi

# 심볼릭 링크 생성
echo "🔗 심볼릭 링크 생성: uploads -> /volume1/work_orders"
ln -sfn /volume1/work_orders uploads

# 확인
echo ""
echo "✅ 연결 확인:"
ls -lh uploads/ | head -10

# 파일 개수 확인
echo ""
echo "📊 이미지 파일 개수:"
find uploads -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l

echo ""
echo "=========================================="
echo "🔄 백엔드 재시작"
echo "=========================================="

cd /volume1/web/work-order-management-system/backend
sudo /usr/local/bin/pm2 restart work-order-backend
sleep 3
sudo /usr/local/bin/pm2 logs work-order-backend --lines 20 --nostream

echo ""
echo "=========================================="
echo "🧪 이미지 URL 테스트"
echo "=========================================="

# 최근 이미지 경로로 테스트
LATEST_PATH=$(mysql -u root -p work_order_management -N -e "SELECT storage_path FROM work_orders ORDER BY created_at DESC LIMIT 1;" 2>/dev/null)

if [ ! -z "$LATEST_PATH" ]; then
    echo "📸 테스트 경로: $LATEST_PATH"
    echo "🌐 로컬 테스트: http://localhost:3200/uploads/$LATEST_PATH"
    echo ""
    curl -I "http://localhost:3200/uploads/$LATEST_PATH" 2>/dev/null
    
    echo ""
    echo "🌐 외부 테스트: http://api.doorlife.synology.me/uploads/$LATEST_PATH"
    curl -I "http://api.doorlife.synology.me/uploads/$LATEST_PATH" 2>/dev/null
else
    echo "❌ 데이터베이스에 작업지시서가 없습니다."
fi

echo ""
echo "=========================================="
echo "✅ 완료!"
echo "=========================================="
echo "브라우저에서 http://wo.doorlife.synology.me 를 새로고침하세요!"

