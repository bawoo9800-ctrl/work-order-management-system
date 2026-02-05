#!/bin/bash

echo "=========================================="
echo "🔍 백엔드 정적 파일 설정 진단"
echo "=========================================="
echo ""

# 1. 실제 파일 존재 여부 확인
echo "1️⃣ 업로드된 파일 확인:"
echo "---"
if [ -d "backend/uploads" ]; then
    echo "✅ backend/uploads 디렉토리 존재"
    echo ""
    echo "최근 업로드된 이미지 파일 5개:"
    find backend/uploads -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | head -5
    echo ""
    echo "파일 개수:"
    find backend/uploads -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) 2>/dev/null | wc -l
else
    echo "❌ backend/uploads 디렉토리가 없습니다!"
fi

echo ""
echo "=========================================="
echo "2️⃣ app.js에서 정적 파일 제공 설정 확인:"
echo "---"

if [ -f "backend/src/app.js" ]; then
    echo "✅ app.js 파일 존재"
    echo ""
    echo "정적 파일 제공 관련 코드:"
    grep -n "static\|uploads" backend/src/app.js || echo "❌ 정적 파일 제공 설정이 없습니다!"
else
    echo "❌ backend/src/app.js 파일이 없습니다!"
fi

echo ""
echo "=========================================="
echo "3️⃣ 라우트 파일 확인:"
echo "---"

if [ -f "backend/src/routes/index.js" ]; then
    echo "✅ routes/index.js 파일 존재"
    echo ""
    cat backend/src/routes/index.js
else
    echo "❌ routes/index.js 파일이 없습니다!"
fi

