# 🛠️ NAS 배포 및 문제 해결 가이드

## 📋 목차

1. [빠른 시작](#빠른-시작)
2. [현재 발생 중인 문제](#현재-발생-중인-문제)
3. [문제 해결 방법](#문제-해결-방법)
4. [NAS 스크립트 사용법](#nas-스크립트-사용법)
5. [수동 복구 절차](#수동-복구-절차)
6. [브라우저 접속 방법](#브라우저-접속-방법)
7. [자주 묻는 질문](#자주-묻는-질문)

---

## 🚀 빠른 시작

### 1️⃣ NAS SSH 접속

```bash
ssh doorlife21@192.168.0.109
```

### 2️⃣ 프로젝트 디렉토리로 이동

```bash
cd /volume1/web/work-order-management-system
```

### 3️⃣ 최신 코드 가져오기

```bash
git pull origin main
```

### 4️⃣ 진단 및 복구 스크립트 실행

```bash
bash nas_diagnose_and_fix.sh
```

### 5️⃣ 브라우저에서 확인

- ✅ **올바른 접속**: http://wo.doorlife.synology.me
- ❌ **잘못된 접속**: http://192.168.0.109:5173

---

## 🐛 현재 발생 중인 문제

### 1. CORS 에러

```
Access to XMLHttpRequest at 'http://api.doorlife.synology.me/api/v1/clients' 
from origin 'http://wo.doorlife.synology.me' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**원인**: 
- 로컬 IP (`http://192.168.0.109:5173`)로 접속하면 CORS 에러 발생
- 백엔드가 다운되어 있으면 CORS 헤더를 반환하지 못함

**해결**: 
- 반드시 **도메인**으로 접속: `http://wo.doorlife.synology.me`
- 백엔드 재시작 (아래 스크립트 참조)

### 2. 502 Bad Gateway

```
GET http://api.doorlife.synology.me/api/v1/clients 
net::ERR_FAILED 502 (Bad Gateway)
```

**원인**: 
- 백엔드 서버가 다운되었거나 응답하지 않음
- PM2 프로세스가 중단됨

**해결**: 
- 백엔드 재시작 (아래 스크립트 참조)

### 3. 작업지시서 삭제 시 500 에러

```
Error: Data truncated for column 'status' at row 1
SQL: UPDATE work_orders SET status = ? WHERE id = ?
params: ["deleted", 15]
```

**원인**: 
- MySQL `work_orders` 테이블의 `status` 컬럼이 ENUM 타입
- `'deleted'` 값이 ENUM에 정의되지 않음

**해결**: 
- MySQL 스키마 수정 (아래 스크립트가 자동으로 수행)

### 4. WebSocket 연결 실패

```
WebSocket connection to 'ws://wo.doorlife.synology.me/?token=xCU-mo_YDO5N' failed
```

**원인**: 
- Vite HMR (Hot Module Replacement) WebSocket 연결 실패
- 프론트엔드 서버가 다운되었거나 포트가 막힘

**해결**: 
- 프론트엔드 재시작 (아래 스크립트 참조)
- WebSocket은 개발 모드에서만 사용되므로 프로덕션에는 영향 없음

---

## 🔧 문제 해결 방법

### 방법 1: 자동 진단 및 복구 (권장)

```bash
# NAS SSH 접속 후
cd /volume1/web/work-order-management-system
bash nas_diagnose_and_fix.sh
```

이 스크립트는 다음 작업을 자동으로 수행합니다:
1. ✅ 최신 코드 가져오기 (`git pull`)
2. ✅ MySQL `status` 컬럼에 `'deleted'` 값 추가
3. ✅ 백엔드 재시작 (PM2)
4. ✅ 프론트엔드 재시작 (PM2)
5. ✅ 네트워크 연결 테스트
6. ✅ PM2 상태 확인

### 방법 2: 빠른 상태 확인

```bash
# NAS SSH 접속 후
cd /volume1/web/work-order-management-system
bash nas_quick_check.sh
```

이 스크립트는 다음 정보를 확인합니다:
- PM2 프로세스 상태
- 백엔드/프론트엔드 로그
- 네트워크 연결 테스트
- 디스크 사용량
- MySQL 연결 테스트

---

## 📜 NAS 스크립트 사용법

### 1. `nas_diagnose_and_fix.sh` - 진단 및 복구

**사용 시점**:
- CORS 에러가 발생할 때
- 502 Bad Gateway 에러가 발생할 때
- 작업지시서 삭제가 안 될 때
- 프론트엔드/백엔드가 응답하지 않을 때

**실행 방법**:
```bash
cd /volume1/web/work-order-management-system
bash nas_diagnose_and_fix.sh
```

**실행 시 필요한 것**:
- MySQL root 비밀번호 입력 (status 컬럼 수정 시)

### 2. `nas_quick_check.sh` - 빠른 상태 확인

**사용 시점**:
- 시스템 상태를 빠르게 확인하고 싶을 때
- 배포 후 정상 작동 여부를 확인하고 싶을 때
- 로그를 빠르게 확인하고 싶을 때

**실행 방법**:
```bash
cd /volume1/web/work-order-management-system
bash nas_quick_check.sh
```

---

## 🛠️ 수동 복구 절차

자동 스크립트가 실패하면 아래 절차를 수동으로 실행하세요.

### 1단계: 최신 코드 가져오기

```bash
cd /volume1/web/work-order-management-system

# 충돌 파일 제거
rm -f nas_complete_fix.sh nas_restart_frontend.sh nas_force_update.sh

# Git Pull
git pull origin main

# 최신 커밋 확인
git log --oneline -1
```

**기대 결과**:
```
5cf259d script: NAS 빠른 상태 확인 스크립트 추가
```

### 2단계: MySQL status 컬럼 수정

```bash
mysql -u root -p work_order_management << 'EOF'
ALTER TABLE work_orders 
MODIFY COLUMN status ENUM('pending', 'classified', 'unclassified', 'deleted') 
DEFAULT 'pending';

SHOW COLUMNS FROM work_orders LIKE 'status';
EOF
```

**기대 결과**:
```
Field  | Type                                                   | Null | Key | Default | Extra
status | enum('pending','classified','unclassified','deleted') | YES  |     | pending |
```

### 3단계: 백엔드 재시작

```bash
cd /volume1/web/work-order-management-system/backend

# 백엔드 재시작
sudo /usr/local/bin/pm2 restart work-order-backend

# 5초 대기
sleep 5

# 로그 확인
sudo /usr/local/bin/pm2 logs work-order-backend --lines 30 --nostream
```

**기대 로그**:
```
[work-order-backend] 서버 시작: http://0.0.0.0:3200
[work-order-backend] 정적 파일 제공: /uploads -> /volume1/work_orders
[work-order-backend] 데이터베이스 연결 성공
```

### 4단계: 프론트엔드 재시작

```bash
cd /volume1/web/work-order-management-system/frontend

# 프론트엔드 재시작
sudo /usr/local/bin/pm2 restart work-order-frontend

# 5초 대기
sleep 5

# 로그 확인
sudo /usr/local/bin/pm2 logs work-order-frontend --lines 30 --nostream
```

**기대 로그**:
```
[work-order-frontend] VITE v5.4.2  ready in 437 ms
[work-order-frontend] ➜  Local:   http://localhost:5173/
[work-order-frontend] ➜  Network: http://0.0.0.0:5173/
```

### 5단계: PM2 상태 확인

```bash
sudo /usr/local/bin/pm2 status
```

**기대 결과**:
```
┌─────┬──────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name                 │ mode    │ status  │ cpu      │
├─────┼──────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ work-order-backend   │ fork    │ online  │ 0%       │
│ 1   │ work-order-frontend  │ fork    │ online  │ 0%       │
└─────┴──────────────────────┴─────────┴─────────┴──────────┘
```

### 6단계: 네트워크 연결 테스트

```bash
# 백엔드 헬스체크 (localhost)
curl http://localhost:3200/health

# 백엔드 헬스체크 (도메인)
curl http://api.doorlife.synology.me/health
```

**기대 결과**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-05T15:30:00.000Z",
  "uptime": 123
}
```

---

## 🌐 브라우저 접속 방법

### ✅ 올바른 접속 방법

1. **브라우저 캐시 완전 삭제**
   - `Ctrl+Shift+Delete` (Windows/Linux) 또는 `Cmd+Shift+Delete` (Mac)
   - **전체 기간** 선택
   - **쿠키 및 기타 사이트 데이터** ✓
   - **캐시된 이미지 및 파일** ✓
   - 삭제 실행

2. **강력한 새로고침**
   - `Ctrl+Shift+R` (Windows/Linux) 또는 `Cmd+Shift+R` (Mac)

3. **시크릿 모드 사용 (권장)**
   - `Ctrl+Shift+N` (Windows/Linux) 또는 `Cmd+Shift+N` (Mac)

4. **도메인으로 접속**
   - ✅ **올바른 URL**: `http://wo.doorlife.synology.me`
   - ❌ **잘못된 URL**: `http://192.168.0.109:5173`

### ❌ 잘못된 접속 방법

| 잘못된 방법 | 발생하는 문제 | 이유 |
|------------|-------------|-----|
| `http://192.168.0.109:5173` | CORS 에러 | Origin 불일치 |
| `http://localhost:5173` | CORS 에러 | Origin 불일치 |
| 캐시 삭제 없이 접속 | 이전 버전 로드 | 브라우저 캐시 |
| 일반 새로고침 (`F5`) | 이전 버전 로드 | 캐시된 리소스 사용 |

---

## ❓ 자주 묻는 질문

### Q1. CORS 에러가 계속 발생합니다.

**A**: 다음을 확인하세요:
1. **도메인으로 접속하고 있나요?**
   - ✅ `http://wo.doorlife.synology.me`
   - ❌ `http://192.168.0.109:5173`

2. **백엔드가 실행 중인가요?**
   ```bash
   sudo /usr/local/bin/pm2 status work-order-backend
   ```

3. **백엔드 로그에 에러가 있나요?**
   ```bash
   sudo /usr/local/bin/pm2 logs work-order-backend --lines 20 --nostream
   ```

### Q2. 502 Bad Gateway 에러가 발생합니다.

**A**: 백엔드가 다운되었을 가능성이 높습니다.
```bash
cd /volume1/web/work-order-management-system
bash nas_diagnose_and_fix.sh
```

### Q3. 작업지시서 삭제가 안 됩니다.

**A**: MySQL `status` 컬럼에 `'deleted'` 값이 없어서 그렇습니다.
```bash
cd /volume1/web/work-order-management-system
bash nas_diagnose_and_fix.sh
```

이 스크립트가 자동으로 수정합니다.

### Q4. 브라우저에 이전 버전이 보입니다.

**A**: 브라우저 캐시를 완전히 삭제하세요:
1. `Ctrl+Shift+Delete` (전체 기간)
2. 쿠키 및 캐시 모두 삭제
3. `Ctrl+Shift+R`로 강력한 새로고침
4. 시크릿 모드에서 재확인

### Q5. WebSocket 연결 실패 메시지가 나옵니다.

**A**: 이것은 Vite HMR (개발 모드) 관련 메시지입니다.
- 실제 기능에는 영향 없음
- 프론트엔드를 재시작하면 해결될 수 있음
- 프로덕션 빌드 시 사라짐

```bash
cd /volume1/web/work-order-management-system/frontend
sudo /usr/local/bin/pm2 restart work-order-frontend
```

### Q6. 프론트엔드/백엔드 로그는 어디서 확인하나요?

**A**: PM2 로그를 확인하세요:
```bash
# 백엔드 로그 (실시간)
sudo /usr/local/bin/pm2 logs work-order-backend

# 백엔드 로그 (최근 50줄)
sudo /usr/local/bin/pm2 logs work-order-backend --lines 50 --nostream

# 프론트엔드 로그 (실시간)
sudo /usr/local/bin/pm2 logs work-order-frontend

# 프론트엔드 로그 (최근 50줄)
sudo /usr/local/bin/pm2 logs work-order-frontend --lines 50 --nostream
```

### Q7. PM2가 자꾸 다운됩니다.

**A**: PM2를 재설정하세요:
```bash
# 백엔드 재설정
cd /volume1/web/work-order-management-system/backend
sudo /usr/local/bin/pm2 delete work-order-backend
sudo /usr/local/bin/pm2 start src/server.js --name work-order-backend

# 프론트엔드 재설정
cd /volume1/web/work-order-management-system/frontend
sudo /usr/local/bin/pm2 delete work-order-frontend
sudo /usr/local/bin/pm2 start npm --name work-order-frontend -- run dev
```

### Q8. 새로 업로드한 이미지가 안 보입니다.

**A**: 다음을 확인하세요:
1. **저장 경로 확인**
   ```bash
   ls -la /volume1/work_orders/unclassified/2026/02/
   ```

2. **백엔드 로그 확인**
   ```bash
   sudo /usr/local/bin/pm2 logs work-order-backend --lines 30 --nostream
   ```

3. **브라우저 개발자 도구 확인**
   - `F12` → `Network` 탭
   - 이미지 URL 확인 (예: `http://api.doorlife.synology.me/uploads/unclassified/2026/02/xxx.jpg`)
   - 상태 코드 확인 (200 OK 또는 404 Not Found)

---

## 📊 확인 체크리스트

### 배포 후 확인 사항

- [ ] PM2 상태가 모두 `online`인가?
- [ ] 백엔드 로그에 "서버 시작" 메시지가 있는가?
- [ ] 프론트엔드 로그에 "VITE ready" 메시지가 있는가?
- [ ] `http://api.doorlife.synology.me/health` 접속 시 200 OK인가?
- [ ] `http://wo.doorlife.synology.me` 접속 시 페이지가 로드되는가?
- [ ] 브라우저 콘솔에 CORS 에러가 없는가?
- [ ] 브라우저 콘솔에 502 에러가 없는가?
- [ ] 작업지시서가 정상적으로 보이는가?
- [ ] 작업지시서 삭제가 정상적으로 되는가?
- [ ] 새 이미지 업로드가 정상적으로 되는가?

### UI 확인 사항

- [ ] 좌측 사이드바가 제거되었는가?
- [ ] 4열 그리드로 표시되는가? (1920x1080 해상도)
- [ ] 카드 비율이 A4 (210:297)인가?
- [ ] 거래처명/현장명이 표시되는가?
- [ ] 아이콘 버튼 (✎, ✓, ✕)이 보이는가?
- [ ] 배경색이 #f8f8f8인가?
- [ ] 이미지 클릭 시 확대 모달이 나타나는가?

---

## 🚨 긴급 복구 명령어

시스템이 완전히 다운되었을 때:

```bash
# SSH 접속
ssh doorlife21@192.168.0.109

# 프로젝트 디렉토리로 이동
cd /volume1/web/work-order-management-system

# Git 초기화 (로컬 변경사항 모두 삭제)
git reset --hard origin/main
git pull origin main

# PM2 완전 초기화
sudo /usr/local/bin/pm2 delete all
sudo /usr/local/bin/pm2 kill

# 백엔드 시작
cd /volume1/web/work-order-management-system/backend
sudo /usr/local/bin/pm2 start src/server.js --name work-order-backend

# 프론트엔드 시작
cd /volume1/web/work-order-management-system/frontend
sudo /usr/local/bin/pm2 start npm --name work-order-frontend -- run dev

# PM2 저장
sudo /usr/local/bin/pm2 save

# 상태 확인
sudo /usr/local/bin/pm2 status
```

---

## 📞 지원

문제가 계속되면 다음 정보를 공유해주세요:

1. **PM2 상태**
   ```bash
   sudo /usr/local/bin/pm2 status
   ```

2. **백엔드 로그**
   ```bash
   sudo /usr/local/bin/pm2 logs work-order-backend --lines 50 --nostream
   ```

3. **프론트엔드 로그**
   ```bash
   sudo /usr/local/bin/pm2 logs work-order-frontend --lines 50 --nostream
   ```

4. **브라우저 콘솔 에러**
   - `F12` → `Console` 탭 스크린샷

5. **브라우저 네트워크 에러**
   - `F12` → `Network` 탭 스크린샷

---

## 📝 변경 이력

### 2026-02-05
- ✅ 홈페이지 심플 재디자인 (작업지시서 카드 레이아웃)
- ✅ 카드 크기 1.5배 확대
- ✅ MySQL status 컬럼에 'deleted' 값 추가 SQL
- ✅ 작업지시서 삭제 시 에러 로깅 추가
- ✅ NAS 진단 및 복구 통합 스크립트 추가
- ✅ NAS 빠른 상태 확인 스크립트 추가
- ✅ CORS 설정 개선 (모든 Origin 허용)
- ✅ Trust Proxy 설정 추가 (Synology NAS 역방향 프록시)

---

**작성자**: AI Assistant  
**최종 수정**: 2026-02-05  
**버전**: 1.0.0
