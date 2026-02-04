# API 문서 (API Documentation)

작업지시서 관리 시스템 REST API v1.0.0

## 📋 목차

- [개요](#개요)
- [인증](#인증)
- [응답 형식](#응답-형식)
- [에러 코드](#에러-코드)
- [API 엔드포인트](#api-엔드포인트)
  - [헬스체크](#헬스체크)
  - [거래처 관리](#거래처-관리)
  - [통계](#통계)

## 개요

### Base URL

```
개발 환경: http://localhost:3200
프로덕션: http://192.168.1.109:3200
```

### Content-Type

모든 요청과 응답은 `application/json` 형식입니다.

### Rate Limiting

- **제한**: 15분당 100 요청
- **초과 시**: HTTP 429 Too Many Requests

## 인증

현재 버전(v1.0.0)에서는 인증이 구현되지 않았습니다.  
추후 JWT 기반 인증이 추가될 예정입니다.

## 응답 형식

### 성공 응답

```json
{
  "success": true,
  "data": {
    // 응답 데이터
  },
  "error": null
}
```

### 에러 응답

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "에러 메시지",
    "statusCode": 400,
    "status": "fail"
  }
}
```

## 에러 코드

| 코드 | 메시지 | 설명 |
|------|--------|------|
| 400 | Bad Request | 잘못된 요청 (필수 파라미터 누락, 유효하지 않은 데이터) |
| 404 | Not Found | 리소스를 찾을 수 없음 |
| 409 | Conflict | 중복된 리소스 (예: 이미 존재하는 거래처 코드) |
| 429 | Too Many Requests | Rate Limit 초과 |
| 500 | Internal Server Error | 서버 내부 오류 |
| 503 | Service Unavailable | 서비스 이용 불가 (데이터베이스 연결 실패 등) |

---

## API 엔드포인트

## 헬스체크

### 서버 상태 확인

서버 및 데이터베이스 연결 상태를 확인합니다.

**요청**

```http
GET /health
```

**응답 (200 OK)**

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
        "queuedRequests": 0,
        "config": {
          "connectionLimit": 10,
          "host": "192.168.1.109",
          "database": "work_order_management"
        }
      }
    },
    "system": {
      "platform": "linux",
      "arch": "x64",
      "cpus": 4,
      "totalMemory": "16.00 GB",
      "freeMemory": "8.50 GB",
      "uptime": "72.50 hours",
      "nodeVersion": "v18.17.0"
    }
  },
  "error": null
}
```

**응답 (503 Service Unavailable) - 데이터베이스 연결 실패**

```json
{
  "success": false,
  "data": {
    "status": "unhealthy",
    "database": {
      "connected": false
    }
  },
  "error": {
    "message": "데이터베이스 연결 실패"
  }
}
```

---

## 거래처 관리

### 1. 모든 거래처 조회

활성 또는 모든 거래처 목록을 조회합니다.

**요청**

```http
GET /api/v1/clients?active=true
```

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| active | boolean | X | true | true: 활성 거래처만, false: 모든 거래처 |

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": 1,
        "code": "SAMSUNG_ELEC",
        "name": "삼성전자",
        "keywords": ["삼성", "삼성전자", "Samsung", "SAMSUNG"],
        "aliases": ["삼성전자 주식회사", "Samsung Electronics Co., Ltd."],
        "contact_info": {
          "phone": "1588-3366",
          "website": "https://www.samsung.com/sec/",
          "address": "경기도 수원시 영통구 삼성로 129"
        },
        "is_active": true,
        "priority": 10,
        "notes": "국내 최대 전자제품 제조업체",
        "created_at": "2026-02-04T03:00:00.000Z",
        "updated_at": "2026-02-04T03:00:00.000Z"
      }
    ],
    "count": 5
  },
  "error": null
}
```

---

### 2. 특정 거래처 조회

ID로 특정 거래처 정보를 조회합니다.

**요청**

```http
GET /api/v1/clients/:id
```

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| id | integer | O | 거래처 ID |

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "client": {
      "id": 1,
      "code": "SAMSUNG_ELEC",
      "name": "삼성전자",
      "keywords": ["삼성", "삼성전자", "Samsung"],
      "aliases": ["삼성전자 주식회사"],
      "contact_info": {
        "phone": "1588-3366"
      },
      "is_active": true,
      "priority": 10,
      "notes": null,
      "created_at": "2026-02-04T03:00:00.000Z",
      "updated_at": "2026-02-04T03:00:00.000Z"
    }
  },
  "error": null
}
```

**응답 (404 Not Found)**

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "거래처를 찾을 수 없습니다.",
    "statusCode": 404,
    "status": "fail"
  }
}
```

---

### 3. 거래처 생성

새로운 거래처를 생성합니다.

**요청**

```http
POST /api/v1/clients
Content-Type: application/json
```

**Request Body**

```json
{
  "code": "TEST_COMPANY",
  "name": "테스트 회사",
  "keywords": ["테스트", "test", "TEST"],
  "aliases": ["테스트 주식회사", "Test Company Ltd."],
  "contact_info": {
    "phone": "02-1234-5678",
    "email": "contact@test.com",
    "address": "서울특별시 강남구"
  },
  "priority": 100,
  "notes": "테스트용 거래처"
}
```

**Request Body 필드**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| code | string | O | 거래처 코드 (UNIQUE, 50자 이하) |
| name | string | O | 거래처 명칭 (200자 이하) |
| keywords | array | O | 키워드 배열 (최소 1개) |
| aliases | array | X | 별칭 배열 (기본: 빈 배열) |
| contact_info | object | X | 연락처 정보 (JSON 객체) |
| priority | integer | X | 우선순위 (기본: 100, 낮을수록 우선) |
| notes | string | X | 비고 |

**응답 (201 Created)**

```json
{
  "success": true,
  "data": {
    "client": {
      "id": 6,
      "code": "TEST_COMPANY",
      "name": "테스트 회사",
      "keywords": ["테스트", "test", "TEST"],
      "aliases": ["테스트 주식회사"],
      "contact_info": {
        "phone": "02-1234-5678",
        "email": "contact@test.com"
      },
      "is_active": true,
      "priority": 100,
      "notes": "테스트용 거래처",
      "created_at": "2026-02-04T12:30:00.000Z",
      "updated_at": "2026-02-04T12:30:00.000Z"
    }
  },
  "error": null
}
```

**응답 (400 Bad Request)**

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "거래처 코드와 이름은 필수입니다.",
    "statusCode": 400,
    "status": "fail"
  }
}
```

**응답 (409 Conflict)**

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "이미 존재하는 거래처 코드입니다.",
    "statusCode": 409,
    "status": "fail"
  }
}
```

---

### 4. 거래처 수정

기존 거래처 정보를 수정합니다.

**요청**

```http
PUT /api/v1/clients/:id
Content-Type: application/json
```

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| id | integer | O | 거래처 ID |

**Request Body** (수정할 필드만 포함)

```json
{
  "name": "수정된 거래처명",
  "keywords": ["새키워드", "updated"],
  "is_active": true,
  "priority": 50,
  "notes": "수정된 비고"
}
```

**수정 가능 필드**

- `name`: 거래처 명칭
- `keywords`: 키워드 배열
- `aliases`: 별칭 배열
- `contact_info`: 연락처 정보
- `is_active`: 활성 상태
- `priority`: 우선순위
- `notes`: 비고

**수정 불가 필드**

- `code`: 거래처 코드 (생성 후 변경 불가)

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "client": {
      "id": 6,
      "code": "TEST_COMPANY",
      "name": "수정된 거래처명",
      "keywords": ["새키워드", "updated"],
      "is_active": true,
      "priority": 50,
      "updated_at": "2026-02-04T13:00:00.000Z"
    }
  },
  "error": null
}
```

**응답 (404 Not Found)**

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "거래처를 찾을 수 없습니다.",
    "statusCode": 404,
    "status": "fail"
  }
}
```

---

### 5. 거래처 삭제 (소프트 삭제)

거래처를 비활성화합니다 (is_active = false).  
데이터는 삭제되지 않으며, 분류에서만 제외됩니다.

**요청**

```http
DELETE /api/v1/clients/:id
```

**Path Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| id | integer | O | 거래처 ID |

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "message": "거래처가 비활성화되었습니다.",
    "clientId": 6
  },
  "error": null
}
```

**응답 (404 Not Found)**

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "거래처를 찾을 수 없습니다.",
    "statusCode": 404,
    "status": "fail"
  }
}
```

---

### 6. 거래처 통계

거래처 통계 정보를 조회합니다.

**요청**

```http
GET /api/v1/clients/stats
```

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "stats": {
      "total_clients": 10,
      "active_clients": 8,
      "inactive_clients": 2
    }
  },
  "error": null
}
```

---

## 통계

### 전체 시스템 통계 조회

작업지시서, 거래처, API 비용 통계를 조회합니다.

**요청**

```http
GET /api/v1/stats
```

**응답 (200 OK)**

```json
{
  "success": true,
  "data": {
    "workOrders": {
      "total": 150,
      "pending": 5,
      "processing": 2,
      "classified": 140,
      "failed": 3,
      "keyword_classified": 100,
      "ai_text_classified": 30,
      "ai_vision_classified": 10,
      "manual_classified": 0,
      "avg_confidence": 0.8523,
      "avg_processing_time_ms": 2345,
      "total_api_cost": 5.234500
    },
    "clients": {
      "total_clients": 10,
      "active_clients": 8
    },
    "todayApiUsage": {
      "today_cost": 0.123400,
      "today_calls": 15,
      "today_tokens": 3500
    },
    "timestamp": "2026-02-04T13:30:00.000Z"
  },
  "error": null
}
```

---

## cURL 예제

### 헬스체크

```bash
curl http://localhost:3200/health
```

### 거래처 목록 조회

```bash
curl http://localhost:3200/api/v1/clients
```

### 거래처 생성

```bash
curl -X POST http://localhost:3200/api/v1/clients \
  -H "Content-Type: application/json" \
  -d '{
    "code": "NEW_CLIENT",
    "name": "신규 거래처",
    "keywords": ["신규", "테스트"],
    "priority": 100
  }'
```

### 거래처 수정

```bash
curl -X PUT http://localhost:3200/api/v1/clients/6 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "수정된 이름",
    "priority": 50
  }'
```

### 거래처 삭제

```bash
curl -X DELETE http://localhost:3200/api/v1/clients/6
```

### 통계 조회

```bash
curl http://localhost:3200/api/v1/stats
```

---

## 추후 추가 예정 API

- `POST /api/v1/work-orders` - 작업지시서 업로드
- `GET /api/v1/work-orders` - 작업지시서 목록 조회
- `GET /api/v1/work-orders/:id` - 특정 작업지시서 조회
- `PUT /api/v1/work-orders/:id/classify` - 수동 분류
- `POST /api/v1/feedback` - 분류 피드백 제출
- WebSocket 이벤트 (실시간 업데이트)

---

**Last Updated**: 2026-02-04  
**Version**: 1.0.0
