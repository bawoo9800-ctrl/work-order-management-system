# 🚀 배포 가이드

## NAS 배포 절차

### 1️⃣ 코드 업데이트

```bash
# NAS SSH 접속
ssh doorlife21@192.168.0.109

# 프로젝트 디렉토리로 이동
cd /volume1/web/work-order-management-system

# 최신 코드 가져오기
git pull origin main
```

---

### 2️⃣ 데이터베이스 마이그레이션

```bash
# MariaDB 접속
mysql -u root -p work_order_management

# 마이그레이션 실행
source /volume1/web/work-order-management-system/database/migrations/add_site_name.sql
```

**마이그레이션 내용:**
- `work_orders` 테이블에 `site_name` 필드 추가 (현장명)

---

### 3️⃣ 백엔드 설정

```bash
cd /volume1/web/work-order-management-system/backend

# 환경 변수 확인
cat .env | grep -E "OPENAI|DB_"

# 필요 시 추가 패키지 설치
npm install
```

**환경 변수 확인 항목:**
```bash
# OpenAI API (필수)
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://www.genspark.ai/api/llm_proxy/v1

# 데이터베이스 (Unix Socket)
DB_SOCKET_PATH=/run/mysqld/mysqld10.sock
DB_HOST=localhost
DB_USER=work_order_user
DB_PASSWORD=your_password
DB_NAME=work_order_management

# 포트
PORT=3200
```

---

### 4️⃣ 백엔드 재시작

```bash
cd /volume1/web/work-order-management-system/backend

# PM2로 재시작
sudo /usr/local/bin/pm2 restart work-order-backend

# 5초 대기
sleep 5

# 상태 확인
sudo /usr/local/bin/pm2 status

# 로그 확인 (최근 30줄)
sudo /usr/local/bin/pm2 logs work-order-backend --lines 30 --nostream

# 헬스 체크
curl http://localhost:3200/health | jq '.data.status'
```

**기대 결과:**
```json
{
  "success": true,
  "data": {
    "status": "healthy"
  }
}
```

---

### 5️⃣ 프론트엔드 재시작

```bash
cd /volume1/web/work-order-management-system/frontend

# 환경 변수 확인
cat .env

# PM2로 재시작
sudo /usr/local/bin/pm2 restart work-order-frontend

# 5초 대기
sleep 5

# 상태 확인
sudo /usr/local/bin/pm2 status

# 로그 확인
sudo /usr/local/bin/pm2 logs work-order-frontend --lines 20 --nostream
```

**프론트엔드 환경 변수 (.env):**
```bash
VITE_API_BASE_URL=http://192.168.0.109:3200
VITE_APP_NAME=작업지시서 관리 시스템
VITE_APP_VERSION=1.0.0
```

---

### 6️⃣ 접속 확인

- **프론트엔드:** http://192.168.0.109:5173
- **백엔드 API:** http://192.168.0.109:3200
- **헬스체크:** http://192.168.0.109:3200/health

---

## 🎯 새로운 기능

### 거래처 관리 시스템

1. **거래처 페이지:** http://192.168.0.109:5173/clients
2. **Excel 업로드:**
   - 사업자코드 (컬럼 1)
   - 거래처명 (컬럼 2)
   - 업로드 시 기존 데이터 전체 삭제 후 교체
   - 진행 상황 슬라이더 표시

3. **자동완성:**
   - 업로드 페이지에서 거래처명 입력 시 자동완성
   - 실시간 검색 (거래처명/사업자코드)

---

## 📊 API 엔드포인트

### 거래처 API

```bash
# 거래처 목록 조회
curl http://localhost:3200/api/v1/clients

# 거래처 검색 (자동완성)
curl "http://localhost:3200/api/v1/clients/search?q=삼성"

# 거래처 통계
curl http://localhost:3200/api/v1/clients/stats

# Excel 업로드
curl -X POST http://localhost:3200/api/v1/clients/upload-excel \
  -F "file=@clients.xlsx"
```

### 작업지시서 API

```bash
# 작업지시서 업로드 (수동 분류)
curl -X POST http://localhost:3200/api/v1/work-orders/upload \
  -F "image=@work_order.jpg" \
  -F "clientName=삼성전자" \
  -F "siteName=수원공장" \
  -F "uploadedBy=홍길동"

# 작업지시서 목록
curl http://localhost:3200/api/v1/work-orders

# 작업지시서 상세
curl http://localhost:3200/api/v1/work-orders/1
```

---

## 🔧 트러블슈팅

### 백엔드가 시작되지 않을 때

```bash
# 포트 사용 확인
netstat -tlnp | grep 3200

# 프로세스 종료
sudo kill -9 <PID>

# PM2 재시작
sudo /usr/local/bin/pm2 delete work-order-backend
sudo /usr/local/bin/pm2 start src/server.js --name work-order-backend
```

### 프론트엔드 CORS 에러

```bash
# .env 파일 확인
cat /volume1/web/work-order-management-system/frontend/.env

# API 주소가 localhost가 아닌 192.168.0.109인지 확인
VITE_API_BASE_URL=http://192.168.0.109:3200

# 재시작
sudo /usr/local/bin/pm2 restart work-order-frontend
```

### DB 연결 실패

```bash
# Unix Socket 경로 확인
ls -la /run/mysqld/mysqld10.sock

# MariaDB 접속 테스트
mysql -u work_order_user -p -S /run/mysqld/mysqld10.sock work_order_management

# 테이블 확인
SHOW TABLES;
```

---

## 🔄 PM2 자동 시작 설정

```bash
# PM2 startup 설정
sudo /usr/local/bin/pm2 startup

# 현재 프로세스 저장
sudo /usr/local/bin/pm2 save

# 확인
sudo /usr/local/bin/pm2 list
```

**결과:**
- `work-order-backend` (포트 3200)
- `work-order-frontend` (포트 5173)

---

## 📝 체크리스트

- [ ] Git pull 완료
- [ ] DB 마이그레이션 실행
- [ ] 백엔드 .env 확인
- [ ] 프론트엔드 .env 확인
- [ ] 백엔드 재시작 완료
- [ ] 프론트엔드 재시작 완료
- [ ] 헬스체크 정상
- [ ] 브라우저 접속 확인
- [ ] 거래처 페이지 접속 확인
- [ ] Excel 업로드 테스트
- [ ] 자동완성 기능 테스트

---

## 📞 문의

문제가 발생하면 PM2 로그를 확인하세요:

```bash
# 전체 로그
sudo /usr/local/bin/pm2 logs

# 특정 앱 로그
sudo /usr/local/bin/pm2 logs work-order-backend
sudo /usr/local/bin/pm2 logs work-order-frontend
```
