#!/bin/bash

echo "=========================================="
echo "🔍 backend/.env 설정 확인"
echo "=========================================="

if [ -f "backend/.env" ]; then
    echo "✅ .env 파일 존재"
    echo ""
    echo "NAS_STORAGE_PATH 설정:"
    grep NAS_STORAGE_PATH backend/.env || echo "❌ NAS_STORAGE_PATH 설정 없음"
else
    echo "❌ backend/.env 파일이 없습니다!"
fi

