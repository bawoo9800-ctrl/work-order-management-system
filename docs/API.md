# 작업지시서 관리 시스템 API 문서

## 📋 목차
1. [개요](#개요)
2. [인증](#인증)
3. [응답 형식](#응답-형식)
4. [에러 코드](#에러-코드)
5. [API 엔드포인트](#api-엔드포인트)
   - [헬스체크](#헬스체크)
   - [거래처 관리](#거래처-관리)
   - [작업지시서 관리](#작업지시서-관리)
   - [통계](#통계)

---

## 개요

**Base URL**: `http://localhost:3200` (개발), `https://wo.doorlife.synology.me` (프로덕션)

**API Version**: `v1`

**Content-Type**: `application/json`

---

## 인증

현재 버전에서는 인증이 필요하지 않습니다. (향후 JWT 추가 예정)

---

## 응답 형식

모든 API 응답은 다음 형식을 따릅니다:

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
    "status": "fail",
    "isOperational": true
  }
}
```

---

## 에러 코드

| 상태 코드 | 설명 |
|---------|------|
| `200` | 요청 성공 |
| `201` | 리소스 생성 성공 |
| `400` | 잘못된 요청 (Bad Request) |
| `404` | 리소스를 찾을 수 없음 (Not Found) |
| `429` | 요청 제한 초과 (Too Many Requests) |
| `500` | 서버 내부 오류 (Internal Server Error) |

---

## API 엔드포인트

### 헬스체크

#### `GET /health`
서버 상태 확인

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-04T09:04:58.548Z",
    "responseTime": 2,
    "server": {
      "environment": "development",
      "port": 3200,
      "socketPort": 3201
    },
    "database": {
      "connected": true,
      "pool": {
        "totalConnections": 1,
        "freeConnections": 1,
        "queuedRequests": 0
      }
    },
    "system": {
      "platform": "linux",
      "arch": "x64",
      "cpus": 4,
      "totalMemory": "1.71 GB",
      "freeMemory": "0.51 GB",
      "uptime": "15.80 hours",
      "nodeVersion": "v20.19.5"
    }
  },
  "error": null
}
```

---

### 거래처 관리

#### `GET /api/v1/clients`
모든 거래처 조회

**쿼리 파라미터**:
- `activeOnly` (boolean, 기본: true): 활성 거래처만 조회

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": 1,
        "code": "SAMSUNG_ELEC",
        "name": "삼성전자",
        "keywords": ["삼성전자", "삼성", "SAMSUNG", "반도체", "전자"],
        "aliases": ["삼성", "SEC", "Samsung Electronics"],
        "is_active": 1,
        "priority": 10,
        "created_at": "2026-02-04T08:36:29.000Z"
      }
    ],
    "count": 5
  },
  "error": null
}
```

#### `GET /api/v1/clients/:id`
거래처 상세 조회

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "client": {
      "id": 1,
      "code": "SAMSUNG_ELEC",
      "name": "삼성전자",
      "keywords": ["삼성전자", "삼성", "SAMSUNG"],
      "aliases": ["삼성", "SEC"],
      "contact_info": {
        "phone": "02-1234-5678",
        "email": "contact@samsung.com"
      },
      "priority": 10,
      "is_active": 1,
      "notes": null,
      "created_at": "2026-02-04T08:36:29.000Z",
      "updated_at": "2026-02-04T08:36:29.000Z"
    }
  },
  "error": null
}
```

#### `POST /api/v1/clients`
거래처 생성

**요청 바디**:
```json
{
  "code": "TEST_CLIENT",
  "name": "테스트 거래처",
  "keywords": ["테스트", "test", "TEST"],
  "aliases": ["테스트사", "Test Co."],
  "contact_info": {
    "phone": "02-1111-2222",
    "email": "test@example.com"
  },
  "priority": 100,
  "notes": "테스트용 거래처"
}
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "message": "거래처가 생성되었습니다.",
    "clientId": 6
  },
  "error": null
}
```

#### `PUT /api/v1/clients/:id`
거래처 수정

**요청 바디**:
```json
{
  "name": "수정된 거래처명",
  "is_active": 1,
  "priority": 50
}
```

#### `DELETE /api/v1/clients/:id`
거래처 삭제 (소프트 삭제)

---

### 작업지시서 관리

#### `POST /api/v1/work-orders/upload`
작업지시서 업로드 및 자동 처리 (이미지 → OCR → 자동 분류)

**Content-Type**: `multipart/form-data`

**Form Data**:
- `image` (file, 필수): 작업지시서 이미지 파일 (jpg, jpeg, png, webp)
- 최대 파일 크기: 10MB

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "uuid": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    "originalFilename": "work_order_001.jpg",
    "classification": {
      "clientId": 1,
      "clientName": "삼성전자",
      "clientCode": "SAMSUNG_ELEC",
      "confidence": 0.875,
      "method": "keyword",
      "reasoning": "키워드 매칭: 삼성전자, 삼성, SAMSUNG (3개 매칭)",
      "isAutoClassified": true,
      "candidates": [
        {
          "clientId": 1,
          "clientName": "삼성전자",
          "clientCode": "SAMSUNG_ELEC",
          "confidence": 0.875,
          "matchedKeywords": ["삼성전자", "삼성", "SAMSUNG"]
        }
      ]
    },
    "ocr": {
      "textLength": 245,
      "confidence": 92.5,
      "wordCount": 38
    },
    "processingTimeMs": 2350
  },
  "error": null
}
```

#### `GET /api/v1/work-orders`
작업지시서 목록 조회 (페이징, 필터링)

**쿼리 파라미터**:
- `page` (number, 기본: 1): 페이지 번호
- `limit` (number, 기본: 20): 페이지당 개수
- `clientId` (number, 선택): 거래처 ID 필터
- `status` (string, 선택): 상태 필터 (pending, classified, completed, failed)
- `startDate` (string, 선택): 시작일 (YYYY-MM-DD)
- `endDate` (string, 선택): 종료일 (YYYY-MM-DD)

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "workOrders": [
      {
        "id": 1,
        "uuid": "a1b2c3d4-...",
        "original_filename": "work_order_001.jpg",
        "client_id": 1,
        "client_code": "SAMSUNG_ELEC",
        "client_name": "삼성전자",
        "classification_method": "keyword",
        "confidence_score": 0.875,
        "status": "classified",
        "work_date": null,
        "created_at": "2026-02-04T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  },
  "error": null
}
```

#### `GET /api/v1/work-orders/:id`
작업지시서 상세 조회

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "workOrder": {
      "id": 1,
      "uuid": "a1b2c3d4-...",
      "original_filename": "work_order_001.jpg",
      "storage_path": "/volume1/work_orders/client_1/2026/02/a1b2c3d4.jpg",
      "file_size": 245678,
      "mime_type": "image/jpeg",
      "image_width": 1920,
      "image_height": 1080,
      "client_id": 1,
      "client_code": "SAMSUNG_ELEC",
      "client_name": "삼성전자",
      "classification_method": "keyword",
      "confidence_score": 0.875,
      "reasoning": "키워드 매칭: 삼성전자, 삼성 (2개 매칭)",
      "ocr_text": "작업지시서 내용...",
      "work_date": null,
      "status": "classified",
      "api_cost_usd": 0,
      "processing_time_ms": 2350,
      "created_at": "2026-02-04T10:30:00.000Z",
      "updated_at": "2026-02-04T10:30:00.000Z"
    }
  },
  "error": null
}
```

#### `GET /api/v1/work-orders/uuid/:uuid`
UUID로 작업지시서 조회

#### `GET /api/v1/work-orders/recent`
최근 작업지시서 조회

**쿼리 파라미터**:
- `limit` (number, 기본: 10): 조회 개수

#### `PUT /api/v1/work-orders/:id`
작업지시서 수정

**요청 바디**:
```json
{
  "client_id": 2,
  "work_date": "2026-02-04",
  "status": "completed"
}
```

#### `DELETE /api/v1/work-orders/:id`
작업지시서 삭제 (소프트 삭제)

#### `POST /api/v1/work-orders/:id/reclassify`
작업지시서 재분류 (수동)

**요청 바디**:
```json
{
  "clientId": 2
}
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "message": "작업지시서가 재분류되었습니다.",
    "clientId": 2
  },
  "error": null
}
```

---

### 통계

#### `GET /api/v1/stats`
전체 시스템 통계

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "clients": {
      "total_clients": 5,
      "active_clients": 5,
      "inactive_clients": 0
    },
    "workOrders": {
      "total_orders": 10,
      "pending_orders": 2,
      "classified_orders": 7,
      "completed_orders": 1,
      "failed_orders": 0,
      "avg_confidence": 0.82,
      "total_api_cost": 0.05,
      "avg_processing_time": 2250
    }
  },
  "error": null
}
```

#### `GET /api/v1/work-orders/stats/summary`
작업지시서 통계

#### `GET /api/v1/clients/stats`
거래처 통계

---

## 사용 예시

### cURL

```bash
# 헬스체크
curl http://localhost:3200/health | jq

# 거래처 목록
curl http://localhost:3200/api/v1/clients | jq

# 작업지시서 업로드
curl -X POST http://localhost:3200/api/v1/work-orders/upload \
  -F "image=@work_order.jpg" | jq

# 작업지시서 목록 (페이징, 필터링)
curl "http://localhost:3200/api/v1/work-orders?page=1&limit=10&clientId=1" | jq

# 작업지시서 재분류
curl -X POST http://localhost:3200/api/v1/work-orders/1/reclassify \
  -H "Content-Type: application/json" \
  -d '{"clientId": 2}' | jq
```

### JavaScript (fetch)

```javascript
// 작업지시서 업로드
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:3200/api/v1/work-orders/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result);
```

---

## Rate Limiting

API는 Rate Limiting이 적용되어 있습니다:
- **Window**: 15분
- **Max Requests**: 100 요청

제한을 초과하면 `429 Too Many Requests` 응답이 반환됩니다.

---

## 문의

- GitHub: https://github.com/bawoo9800-ctrl/work-order-management-system/issues
