# 🔔 Firebase 푸시 알림 설정 가이드

## 📋 개요

작업지시서가 등록될 때 실시간으로 푸시 알림을 받을 수 있는 기능입니다.

**지원 기능:**
- ✅ 웹 브라우저 푸시 알림 (Chrome, Edge, Firefox 등)
- ✅ 백그라운드 알림 (브라우저 최소화 상태에서도 수신)
- ✅ 포그라운드 알림 (앱 사용 중에도 표시)
- ✅ 작업지시서 등록/수정/삭제 알림

---

## 🚀 1단계: NAS 배포

### 1.1 코드 업데이트

```bash
# NAS SSH 접속
ssh admin@wo.doorlife.synology.me

# 프로젝트 디렉토리 이동
cd /volume1/web/work-order-management-system

# 최신 코드 가져오기
git pull origin main

# 최신 커밋 확인
git log --oneline -1
# 예상: 066e2dc feat: Firebase Cloud Messaging 푸시 알림 기능 구현
```

---

### 1.2 DB 테이블 생성

```bash
# fcm_tokens 테이블 생성
mysql -u root -p work_order_management < backend/create_fcm_tokens_table.sql

# 테이블 확인
mysql -u root -p work_order_management -e "DESCRIBE fcm_tokens;"

# 예상 출력:
# +-------------+--------------+------+-----+-------------------+
# | Field       | Type         | Null | Key | Default           |
# +-------------+--------------+------+-----+-------------------+
# | id          | int(11)      | NO   | PRI | NULL              |
# | token       | varchar(500) | NO   | UNI | NULL              |
# | user_id     | int(11)      | YES  | MUL | NULL              |
# | device_info | varchar(500) | YES  |     | NULL              |
# | is_active   | tinyint(1)   | YES  | MUL | 1                 |
# | ...
```

---

### 1.3 백엔드 환경 변수 설정

```bash
# 백엔드 .env 파일 편집
nano /volume1/web/work-order-management-system/backend/.env

# 다음 내용 추가 (파일 끝에):
```

```bash
# ========================================
# Firebase Cloud Messaging 설정
# ========================================
FIREBASE_PROJECT_ID=work-order-managemen
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@work-order-managemen.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC2nc2S5zm1oxjm
q+RbhYWZFVSylpk/U94A6TETWk45k+cSWimCho69NIZbQoyG71dJxESvEXfcvsla
G9o2Hzn1i4xQWv5AKk/sa0PeTF1+QyJeS2E7MXzCT2amazNBf5KYfGcxSe9Ng5r+
00XRzqVWt17OVLXmq/5lT0lcaDonoB/EsHCqZLc4IIRjWnkACItQI4JKz39zuQKh
F4ElSA83ZxhKM79Zx9cs8+oZTvdlNc95ED0DCnTIa4PEMzCnLnX0RVBHd5tuSNqM
U6ZXcHd+XMcIwgOaxf4tfl2He4nOwc+5yWp49f6Jw7ssF5oTsio+9rZlqd4CC5+o
X6VJCezbAgMBAAECggEAHZ8aNe6Ay2hBxUTznS7a3Vp66x8Hi6CofaBVwAxhbPCD
RlROsGfwJlurQYlZbxfKomIOPBGKzkk6Mv4alrXY+m3g3DXuUO0sGq7Jivj7H1x3
ajEy+92KnaAwh+USoti1KDvhpzqVcQ7caOJPTHmHEzpaTACsotaaRMeoIC+d40hN
SPQrWoOGy9N+65K8t5G66wN/cdebSAztFVMpiGe8p3LhUnu7Jjy1witcHatuVysI
h2UUN+JD3f/gR+R6O96lS7NNI14u8AdU1HCp9P9ywwL+ovqiWW2N/uej5e5W+xeD
X77MKnm4YVVuWUMEGMUBwQ6qwalH7+C7w/v98MlFoQKBgQDacb+DwU30zO0Puuf3
2K56YzLFa997q+fyfW834kCy0t+La0afwH5SQ4m6w551nXq0Wao+A8c3ABzOaE9G
O+oNg9j0qrVtlUk+/8WEgoJhzUK3Ny68zR39mhXu/CLYjhO7y8DxRK/Dg6MaxrCu
lziEAM8/XVDoPwDTGN948nY1+wKBgQDWAy8MdxCu88j8GoSt3a/0IUvBYMKwq8TB
DJG2ivEuJsVyFVA6cER5ZECgCUDQ5eiB1SbvgGB4bUwKaKvi/lY2XXTmENMHZWyU
m2PAPKn81BYVsflBJIVmFLkfRAwH0+1p1bsHbIH7CaXdreQcmx3ZfKwJ+I+ikWfi
G7763ibOoQKBgC96MYnNZcgjEhMtKGWx7pojHVHTVEto3YzSvm2C+1TiiDuhIURv
bgUrMLAq/DHL/HNeWaYI5C+MEra57SDyvLgbQ/hJcg1TOQw8Qw293+Cp4Co6ECpw
2mfYKZQ7sMcoehmC+3h02U7BOZ4EOTp5G4t1MZYwDfmsV92JtmhvKkopAoGAZ0kA
Eub/sT/MlwcBU5vzCEJtejWFoJg1i+nSBSRHQ7vIfMeWga2fDmr42YO9uVPMA6To
dpwhct1k3n0nv5R57SDrgwFJp38miQ35dVSRwYhl5DCRmAPVMa/8q/8+QyTfpr1U
1z9h99LvLu52cevW2xjVOrawM4gzd6dmY1KFriECgYBF5C+efI4fuGm83M0B0amU
yuaI0lZY7ILkqs0qPX3ud7z3onznYuWm81A7kcQYaGPvSFrbLEI0dTAWrHkny7wI
m1E9xxEAHj9zraBK9xBJm9eB5lfuj3U6uAJnjPil1eXphNw6Bn8pjXnSDcV4W4cz
AR//aCAIzidV34Wr/y9+7Q==
-----END PRIVATE KEY-----
"
```

**⚠️ 주의:**
- `private_key`는 **반드시 따옴표로 감싸야** 합니다
- `\n`은 그대로 유지해야 합니다 (개행 문자)

---

### 1.4 프론트엔드 환경 변수 설정

```bash
# 프론트엔드 .env 파일 생성/편집
nano /volume1/web/work-order-management-system/frontend/.env
```

```bash
# API Base URL
VITE_API_BASE_URL=http://wo.doorlife.synology.me

# Firebase VAPID 키 (웹 푸시 인증서)
VITE_FIREBASE_VAPID_KEY=BQhTHOSTYUwCmc8O1fTVe3KU8gt_mRw_CFC2Vc5E6oQm-XbdqTDlGv4Ft4LEXk2Hs_RiDL2upG8f3lwWreh8QsO
```

---

### 1.5 백엔드 재시작

```bash
cd /volume1/web/work-order-management-system/backend

# 백엔드 재시작
pm2 restart work-order-backend

# 로그 확인
pm2 logs work-order-backend --lines 30 --nostream

# 예상 출력:
# Firebase Admin SDK initialized successfully
```

---

### 1.6 프론트엔드 재빌드 및 재시작

```bash
cd /volume1/web/work-order-management-system/frontend

# 빌드 (환경 변수 적용)
npm run build

# 프론트엔드 재시작
pm2 restart work-order-frontend

# 로그 확인
pm2 logs work-order-frontend --lines 20 --nostream
```

---

## 🧪 2단계: 테스트

### 2.1 브라우저 알림 권한 요청

1. **브라우저에서 홈 페이지 접속**
   ```
   http://wo.doorlife.synology.me
   ```

2. **알림 권한 팝업 확인**
   ```
   ✅ "알림을 표시하도록 허용하시겠습니까?"
   → [허용] 버튼 클릭
   ```

3. **브라우저 콘솔 확인** (F12 → Console)
   ```javascript
   ✅ Notification permission granted
   📱 FCM Token: eyJhbGciOi...
   ✅ Token registered to backend
   ```

---

### 2.2 테스트 알림 전송

#### 방법 1: 브라우저 콘솔에서 직접 테스트

```javascript
// F12 → Console에서 실행
fetch('http://wo.doorlife.synology.me/api/v1/notifications/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'YOUR_FCM_TOKEN_HERE' // 위에서 복사한 토큰
  })
})
.then(res => res.json())
.then(data => console.log('✅ 테스트 알림 전송:', data))
.catch(err => console.error('❌ 오류:', err));
```

#### 방법 2: 작업지시서 등록으로 테스트

1. **촬영 페이지 접속**
   ```
   http://wo.doorlife.synology.me/upload
   ```

2. **이미지 업로드**
   - 전송자 선택
   - 이미지 선택
   - "전송하기" 클릭

3. **알림 확인**
   - 백그라운드: 시스템 알림 표시
   - 포그라운드: 인앱 알림 표시

---

### 2.3 알림 상태 확인

```bash
# DB에서 FCM 토큰 확인
mysql -u root -p work_order_management -e "SELECT * FROM fcm_tokens;"

# 예상 출력:
# +----+--------------------------------------+---------+-------------+-----------+
# | id | token                                | user_id | device_info | is_active |
# +----+--------------------------------------+---------+-------------+-----------+
# | 1  | eyJhbGciOi...                        | NULL    | Mozilla/... | 1         |
# +----+--------------------------------------+---------+-------------+-----------+

# API로 알림 상태 확인
curl http://wo.doorlife.synology.me/api/v1/notifications/status | jq

# 예상 출력:
# {
#   "success": true,
#   "data": {
#     "stats": {
#       "total": 1,
#       "active": 1,
#       "inactive": 0,
#       "with_user": 0
#     }
#   }
# }
```

---

## 📱 3단계: 실제 사용

### 작업지시서 등록 시 자동 알림

**흐름:**
```
1. 스마트폰/PC에서 작업지시서 촬영 및 전송
   ↓
2. 백엔드에서 FCM 토큰 조회
   ↓
3. 모든 구독자에게 푸시 알림 전송
   ↓
4. 알림 수신:
   - 📱 "새 작업지시서 등록"
   - "거래처명 - 전송자명"
```

**알림 종류:**
- 📋 **작업지시서 등록**: "새 작업지시서 등록"
- ✏️ **작업지시서 수정**: "작업지시서 수정"
- 🗑️ **작업지시서 삭제**: "작업지시서 삭제"

---

## 🔧 4단계: 문제 해결

### 알림이 오지 않을 때

**1. 브라우저 권한 확인**
```
브라우저 설정 → 사이트 설정 → 알림
→ wo.doorlife.synology.me: [허용됨]
```

**2. FCM 토큰 확인**
```javascript
// 브라우저 콘솔 (F12)
localStorage.getItem('fcm_token')
// 토큰이 있으면 정상
```

**3. 백엔드 로그 확인**
```bash
pm2 logs work-order-backend | grep Firebase

# 예상 출력:
# Firebase Admin SDK initialized successfully
```

**4. Service Worker 확인**
```javascript
// 브라우저 콘솔
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('Service Workers:', regs));

// 등록되어 있으면 정상
```

---

## 💡 추가 기능

### 사용자별 맞춤 알림 (선택사항)

**현재**: 모든 구독자에게 알림 전송  
**향후**: 특정 사용자나 그룹에게만 전송 가능

```javascript
// 사용자 ID와 함께 토큰 등록
await notificationAPI.registerToken(token, userId);
```

---

## 📊 알림 통계

```bash
# 등록된 토큰 수
mysql -u root -p work_order_management -e "
  SELECT 
    COUNT(*) as total_tokens,
    SUM(is_active) as active_tokens
  FROM fcm_tokens;
"

# 작업지시서별 알림 전송 로그 (향후 구현 가능)
```

---

## ✅ 완료 체크리스트

- [ ] DB에 `fcm_tokens` 테이블 생성
- [ ] 백엔드 `.env`에 Firebase 설정 추가
- [ ] 프론트엔드 `.env`에 VAPID 키 추가
- [ ] 백엔드 재시작 후 Firebase 초기화 확인
- [ ] 프론트엔드 재빌드 및 재시작
- [ ] 브라우저에서 알림 권한 허용
- [ ] 테스트 알림 전송 성공
- [ ] 작업지시서 등록 시 알림 수신 확인

---

## 🔗 참고 자료

- Firebase Console: https://console.firebase.google.com
- FCM 문서: https://firebase.google.com/docs/cloud-messaging?hl=ko
- Web Push 알림: https://web.dev/push-notifications-overview/

---

**문제가 발생하면 백엔드 로그와 브라우저 콘솔 로그를 확인하세요!** 🚀
