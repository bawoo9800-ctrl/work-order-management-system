/**
 * ========================================
 * Express 애플리케이션 설정
 * ========================================
 * 파일: src/app.js
 * 설명: Express 서버 미들웨어 및 라우트 구성
 *       - CORS, Helmet, Compression
 *       - Rate Limiting
 *       - Body Parsing
 *       - 라우팅
 *       - 에러 핸들링
 * ========================================
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { requestLogger } from './middleware/logging.middleware.js';
import {
  globalErrorHandler,
  notFoundHandler,
} from './middleware/error.middleware.js';
import logger from './utils/logger.js';

/**
 * Express 앱 생성
 */
const app = express();

/**
 * ========================================
 * Trust Proxy 설정 (역방향 프록시 사용 시)
 * ========================================
 */
// Synology NAS 역방향 프록시를 통한 접속을 위해 필요
app.set('trust proxy', 1);

/**
 * ========================================
 * 보안 미들웨어
 * ========================================
 */

// Helmet: HTTP 헤더 보안 설정
app.use(helmet());

// CORS: Cross-Origin Resource Sharing 설정
const corsOptions = {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173'],
  credentials: process.env.CORS_CREDENTIALS === 'true',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

/**
 * ========================================
 * Rate Limiting
 * ========================================
 */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15분
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 최대 100 요청
  message: {
    success: false,
    error: {
      message: '요청 제한을 초과했습니다. 잠시 후 다시 시도해주세요.',
      statusCode: 429,
    },
    data: null,
  },
  standardHeaders: true, // RateLimit-* 헤더 반환
  legacyHeaders: false, // X-RateLimit-* 헤더 비활성화
});

// API 엔드포인트에만 Rate Limiting 적용
app.use('/api/', limiter);

/**
 * ========================================
 * 요청 처리 미들웨어
 * ========================================
 */

// Body Parser: JSON 및 URL-encoded 데이터 파싱
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression: 응답 압축 (gzip)
app.use(compression());

// 요청 로깅
app.use(requestLogger);

/**
 * ========================================
 * 라우팅
 * ========================================
 */

// 루트 경로 API 정보
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: '🚀 작업지시서 관리 시스템 API',
      version: '1.0.0',
      status: 'online',
      documentation: {
        health: '/health',
        api: '/api/v1',
        clients: '/api/v1/clients',
        workOrders: '/api/v1/work-orders',
        stats: '/api/v1/stats',
      },
      links: {
        github: 'https://github.com/bawoo9800-ctrl/work-order-management-system',
        health: `${req.protocol}://${req.get('host')}/health`,
        api: `${req.protocol}://${req.get('host')}/api/v1`,
      },
    },
    error: null,
  });
});

app.use('/', routes);

/**
 * ========================================
 * 에러 핸들링
 * ========================================
 */

// 404 Not Found 핸들러
app.use(notFoundHandler);

// 글로벌 에러 핸들러
app.use(globalErrorHandler);

/**
 * ========================================
 * 앱 시작 로깅
 * ========================================
 */
logger.info('Express 애플리케이션 초기화 완료', {
  environment: process.env.NODE_ENV || 'development',
  corsOrigins: corsOptions.origin,
  rateLimitWindow: `${(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 60000}분`,
  rateLimitMax: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
});

export default app;
