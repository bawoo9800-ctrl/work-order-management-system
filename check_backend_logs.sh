#!/bin/bash

echo "=================================================="
echo "백엔드 로그 확인"
echo "=================================================="
echo ""
echo "NAS에서 실행:"
echo "  cd /volume1/web/work-order-management-system"
echo "  sudo /usr/local/bin/pm2 logs work-order-backend --lines 50 --nostream"
echo ""
echo "또는 실시간 로그:"
echo "  sudo /usr/local/bin/pm2 logs work-order-backend"
echo ""
echo "=================================================="

