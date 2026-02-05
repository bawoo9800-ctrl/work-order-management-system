#!/bin/bash

echo "=================================================="
echo "프론트엔드 재시작 스크립트"
echo "=================================================="
echo ""

# 1단계: 최신 코드 가져오기
echo "📥 1단계: 최신 코드 가져오기"
cd /volume1/web/work-order-management-system
git pull origin main
echo ""

# 2단계: 프론트엔드 재시작
echo "🔄 2단계: 프론트엔드 재시작"
cd /volume1/web/work-order-management-system/frontend
sudo /usr/local/bin/pm2 restart work-order-frontend
sleep 5
echo ""

# 3단계: 로그 확인
echo "📋 3단계: 프론트엔드 로그 확인"
sudo /usr/local/bin/pm2 logs work-order-frontend --lines 30 --nostream
echo ""

# 4단계: 상태 확인
echo "✅ 4단계: 프론트엔드 상태"
sudo /usr/local/bin/pm2 status work-order-frontend
echo ""

echo "=================================================="
echo "✅ 완료!"
echo "=================================================="
echo ""
echo "🌐 브라우저에서 확인:"
echo "   http://wo.doorlife.synology.me"
echo ""
echo "💡 캐시 삭제 방법:"
echo "   1) Ctrl+Shift+Delete → 전체 기간"
echo "   2) Ctrl+Shift+R (강력한 새로고침)"
echo "   3) 시크릿 모드로 접속"
echo ""

