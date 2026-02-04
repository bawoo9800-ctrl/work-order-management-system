# 📋 작업지시서 관리 시스템 (Work Order Management System)

시놀로지 NAS + MariaDB 기반 실시간 작업지시서 자동 분류 시스템

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MariaDB](https://img.shields.io/badge/MariaDB-10.11+-blue.svg)](https://mariadb.org/)

## 🎯 프로젝트 개요

현장에서 촬영한 작업지시서 사진을 실시간으로 사무실 대시보드에 전송하고, OCR + AI를 활용하여 거래처별로 자동 분류하는 시스템입니다.

### 핵심 기능

1. **📸 모바일 사진 촬영 및 업로드**
   - 현장에서 작업지시서 촬영
   - 실시간 업로드 (WiFi/Mobile Data)

2. **🤖 자동 분류 시스템**
   - Tesseract.js 기반 OCR (한국어 + 영어)
   - 키워드 매칭 분류
   - OpenAI GPT-4o 기반 AI 분류

3. **📊 실시간 대시보드**
   - Socket.io 기반 실시간 업데이트
   - 거래처별 분류 현황
   - 처리 통계 및 비용 추적

4. **💾 데이터 관리**
   - MariaDB 메타데이터 저장
   - 시놀로지 NAS 이미지 저장
   - 거래처별 폴더 자동 분류

## 🏗️ 아키텍처

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   모바일    │  HTTP   │   Backend    │  MySQL  │   MariaDB   │
│  (현장)     │─────────▶│   Node.js    │◀────────│   (NAS)     │
│   업로드    │         │   Express    │         └─────────────┘
└─────────────┘         └──────────────┘               │
                              │                        │
                              │ Socket.io              │ Files
                              ▼                        ▼
                        ┌──────────────┐         ┌─────────────┐
                        │  대시보드    │         │  시놀로지   │
                        │   React      │         │    NAS      │
                        │  (사무실)    │         │  Storage    │
                        └──────────────┘         └─────────────┘
```

### 데이터 흐름

```
1. 업로드 → 2. 이미지 전처리 → 3. OCR 추출 → 4. 키워드 매칭
                                                       │
                                                       ├─ 성공 → DB 저장
                                                       │
                                                       └─ 실패 → AI 분류 (GPT-4o)
                                                                  │
                                                                  ├─ 성공 → DB 저장
                                                                  │
                                                                  └─ 실패 → 수동 분류 대기
```

## 📁 프로젝트 구조

```
work-order-management-system/
├── backend/                      # Node.js Backend
│   ├── src/
│   │   ├── config/              # 설정 파일
│   │   │   └── database.js      # MariaDB 연결 풀
│   │   ├── controllers/         # 비즈니스 로직
│   │   │   ├── client.controller.js    # 거래처 관리
│   │   │   └── health.controller.js    # 헬스체크
│   │   ├── services/            # 외부 서비스 (OCR, AI)
│   │   ├── models/              # 데이터베이스 모델
│   │   │   └── client.model.js         # 거래처 모델
│   │   ├── routes/              # API 라우트
│   │   │   ├── index.js                # 메인 라우터
│   │   │   └── client.routes.js        # 거래처 라우트
│   │   ├── middleware/          # Express 미들웨어
│   │   │   ├── error.middleware.js     # 에러 핸들링
│   │   │   └── logging.middleware.js   # 요청 로깅
│   │   ├── utils/               # 유틸리티
│   │   │   └── logger.js               # Winston 로거
│   │   ├── app.js               # Express 앱 설정
│   │   └── server.js            # 서버 시작점
│   ├── tests/                   # 테스트 파일
│   ├── logs/                    # 로그 파일 (자동 생성)
│   ├── uploads/                 # 임시 업로드 (자동 생성)
│   ├── package.json
│   └── .env.example             # 환경 변수 템플릿
│
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/         # React 컴포넌트
│   │   ├── services/           # API 클라이언트
│   │   └── App.jsx             # 메인 앱
│   └── package.json
│
├── database/                    # 데이터베이스
│   ├── schema.sql              # 테이블 스키마
│   ├── seeds/                  # 초기 데이터
│   │   └── initial_clients.sql # 거래처 초기 데이터
│   └── migrations/             # 마이그레이션 (추후)
│
├── docs/                       # 문서
│   ├── API.md                  # API 문서
│   └── ARCHITECTURE.md         # 아키텍처 문서
│
└── README.md                   # 프로젝트 소개 (본 파일)
```

## 🚀 시작하기

### 1️⃣ 사전 요구사항

- **Node.js**: 18.0.0 이상
- **npm**: 9.0.0 이상
- **MariaDB**: 10.11 이상 (시놀로지 NAS)
- **시놀로지 NAS**: 파일 저장용

### 2️⃣ 데이터베이스 설정

#### MariaDB 스키마 생성

```bash
# 시놀로지 NAS MariaDB에 접속
mysql -h 192.168.1.109 -u root -p

# 스키마 실행
mysql -h 192.168.1.109 -u root -p < database/schema.sql

# 초기 거래처 데이터 삽입
mysql -h 192.168.1.109 -u root -p work_order_management < database/seeds/initial_clients.sql
```

#### 데이터베이스 사용자 생성 (선택)

```sql
CREATE USER 'work_order_user'@'%' IDENTIFIED BY 'your_secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON work_order_management.* TO 'work_order_user'@'%';
FLUSH PRIVILEGES;
```

### 3️⃣ Backend 설치 및 실행

```bash
# Backend 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 실제 값으로 수정

# 개발 서버 시작 (Nodemon)
npm run dev

# 프로덕션 서버 시작
npm start
```

### 4️⃣ 환경 변수 설정 (.env)

```env
# 서버 설정
NODE_ENV=development
PORT=3200
SOCKET_PORT=3201
LOG_LEVEL=debug

# MariaDB 설정
DB_HOST=192.168.1.109
DB_PORT=3306
DB_USER=work_order_user
DB_PASSWORD=your_secure_password
DB_NAME=work_order_management
DB_CONNECTION_LIMIT=10

# 시놀로지 NAS 경로
NAS_STORAGE_PATH=/volume1/work_orders
LOCAL_STORAGE_PATH=./uploads

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL_TEXT=gpt-4o-mini
OPENAI_MODEL_VISION=gpt-4o

# CORS 설정
CORS_ORIGIN=http://localhost:5173,http://192.168.1.109:5173
```

## 🔗 API 엔드포인트

### 헬스체크

```http
GET /health
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-04T12:00:00.000Z",
    "responseTime": "15ms",
    "server": {
      "environment": "development",
      "port": 3200,
      "socketPort": 3201
    },
    "database": {
      "connected": true,
      "pool": {
        "totalConnections": 2,
        "freeConnections": 2,
        "queuedRequests": 0
      }
    }
  },
  "error": null
}
```

### 거래처 관리

#### 모든 거래처 조회
```http
GET /api/v1/clients?active=true
```

#### 특정 거래처 조회
```http
GET /api/v1/clients/:id
```

#### 거래처 생성
```http
POST /api/v1/clients
Content-Type: application/json

{
  "code": "TEST_COMPANY",
  "name": "테스트 회사",
  "keywords": ["테스트", "test", "TEST"],
  "aliases": ["테스트 주식회사"],
  "contact_info": {
    "phone": "02-1234-5678",
    "email": "test@test.com"
  },
  "priority": 100,
  "notes": "테스트용 거래처"
}
```

#### 거래처 수정
```http
PUT /api/v1/clients/:id
Content-Type: application/json

{
  "name": "수정된 이름",
  "is_active": true
}
```

#### 거래처 삭제 (소프트 삭제)
```http
DELETE /api/v1/clients/:id
```

### 통계 조회

```http
GET /api/v1/stats
```

## 📊 데이터베이스 스키마

### 주요 테이블

#### 1. clients (거래처)
- `id`: 거래처 고유 ID
- `code`: 거래처 코드 (UNIQUE)
- `name`: 거래처 명칭
- `keywords`: 키워드 배열 (JSON)
- `aliases`: 별칭 배열 (JSON)
- `contact_info`: 연락처 정보 (JSON)
- `is_active`: 활성 상태
- `priority`: 분류 우선순위

#### 2. work_orders (작업지시서)
- `id`: 작업지시서 ID
- `uuid`: 글로벌 고유 식별자
- `original_filename`: 원본 파일명
- `storage_path`: 저장 경로
- `client_id`: 분류된 거래처 ID (FK)
- `classification_method`: 분류 방법 (keyword/ai_text/ai_vision/manual)
- `confidence_score`: 신뢰도 (0.0 ~ 1.0)
- `ocr_text`: OCR 추출 텍스트
- `status`: 처리 상태

#### 3. classification_feedback (피드백)
- 사용자 피드백 수집 (학습 데이터)

#### 4. api_cost_tracking (비용 추적)
- API 사용량 및 비용 일별 집계

## 🧪 테스트

### 서버 실행 확인

```bash
# 헬스체크
curl http://localhost:3200/health

# 거래처 목록 조회
curl http://localhost:3200/api/v1/clients

# 통계 조회
curl http://localhost:3200/api/v1/stats
```

### 거래처 생성 테스트

```bash
curl -X POST http://localhost:3200/api/v1/clients \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST_001",
    "name": "테스트 거래처",
    "keywords": ["테스트", "test"],
    "aliases": ["테스트 회사"]
  }'
```

## 📝 로깅

Winston 로거를 사용하여 다음 로그를 기록합니다:

- `combined-YYYY-MM-DD.log`: 전체 로그 (INFO 이상)
- `error-YYYY-MM-DD.log`: 에러 로그만
- `api-YYYY-MM-DD.log`: API 요청 로그
- `ocr-YYYY-MM-DD.log`: OCR 처리 로그
- `ai-YYYY-MM-DD.log`: AI 분류 로그

로그는 `backend/logs/` 디렉토리에 자동 생성되며, 14일간 보관 후 자동 삭제됩니다.

## 🔐 보안

- **Helmet.js**: HTTP 헤더 보안
- **CORS**: Cross-Origin 요청 제한
- **Rate Limiting**: API 요청 제한 (15분당 100회)
- **환경 변수**: 민감한 정보 분리 (.env)
- **Prepared Statements**: SQL Injection 방지

## 📈 개발 로드맵

### ✅ 1단계: 프로젝트 초기화 (완료)
- [x] 폴더 구조 생성
- [x] Backend 초기화
- [x] Database 스키마
- [x] 기본 API 엔드포인트
- [x] 에러 핸들링 & 로깅

### 🔄 2단계: OCR 통합 (진행 예정)
- [ ] Tesseract.js 설치 및 설정
- [ ] 이미지 전처리 (Sharp)
- [ ] OCR 추출 서비스
- [ ] 텍스트 정제 알고리즘

### 🔄 3단계: 키워드 분류 (진행 예정)
- [ ] 키워드 매칭 알고리즘
- [ ] 신뢰도 계산
- [ ] 분류 결과 저장

### 🔄 4단계: AI 분류 (진행 예정)
- [ ] OpenAI API 연동
- [ ] GPT-4o-mini 텍스트 분류
- [ ] GPT-4o Vision 이미지 분석
- [ ] 비용 추적 시스템

### 🔄 5단계: WebSocket 실시간 통신 (진행 예정)
- [ ] Socket.io 서버 설정
- [ ] 실시간 업로드 이벤트
- [ ] 분류 완료 알림

### 🔄 6단계: React 프론트엔드 (진행 예정)
- [ ] 모바일 업로드 UI
- [ ] 대시보드 (실시간 업데이트)
- [ ] 거래처 관리 페이지
- [ ] 통계 차트

## 🤝 기여

이슈 및 풀 리퀘스트는 언제든지 환영합니다!

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👤 작성자

**bawoo9800-ctrl**

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 GitHub Issues를 이용해주세요.

---

**Made with ❤️ for efficient work order management**
