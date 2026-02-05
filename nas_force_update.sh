#!/bin/bash

echo "=================================================="
echo "NAS 강제 업데이트 + 프론트엔드 재시작"
echo "=================================================="
echo ""

# 1단계: 충돌 파일 제거
echo "🗑️  1단계: 충돌 파일 제거"
cd /volume1/web/work-order-management-system
rm -f nas_complete_fix.sh nas_restart_frontend.sh
echo "✅ 충돌 파일 제거 완료"
echo ""

# 2단계: 최신 코드 가져오기
echo "📥 2단계: 최신 코드 가져오기"
git pull origin main
echo ""

# 3단계: 최신 커밋 확인
echo "📋 3단계: 최신 커밋 확인"
git log --oneline -1
echo ""

# 4단계: 프론트엔드 재시작
echo "🔄 4단계: 프론트엔드 재시작"
cd /volume1/web/work-order-management-system/frontend
sudo /usr/local/bin/pm2 restart work-order-frontend
sleep 5
echo ""

# 5단계: 로그 확인
echo "📋 5단계: 프론트엔드 로그 확인"
sudo /usr/local/bin/pm2 logs work-order-frontend --lines 30 --nostream
echo ""

# 6단계: 상태 확인
echo "✅ 6단계: 프론트엔드 상태"
sudo /usr/local/bin/pm2 status work-order-frontend
echo ""

echo "=================================================="
echo "✅ 완료!"
echo "=================================================="
echo ""
echo "🌐 브라우저에서 확인:"
echo "   1) 시크릿 모드로 접속: Ctrl+Shift+N"
echo "   2) http://wo.doorlife.synology.me"
echo ""
echo "💡 확인 사항:"
echo "   ✅ 좌측 사이드바 제거"
echo "   ✅ 6열 그리드 (1920×1080)"
echo "   ✅ A4 비율 카드"
echo "   ✅ 아이콘 버튼 (✎, ✓, ✕)"
echo ""

