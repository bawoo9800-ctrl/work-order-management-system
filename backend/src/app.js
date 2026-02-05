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
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { requestLogger } from './middleware/logging.middleware.js';
import {
  globalErrorHandler,
  notFoundHandler,
} from './middleware/error.middleware.js';
import logger from './utils/logger.js';

// ES 모듈에서 __dirname 사용하기 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// CORS: Cross-Origin Resource Sharing 설정 (완전 개방)
app.use(cors({
  origin: true,  // 모든 Origin 허용
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

logger.info('🌐 CORS: 모든 Origin 허용 (개발 모드)');

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
  // Trust proxy 환경에서 클라이언트 IP 식별 방법 명시
  keyGenerator: (req) => {
    // X-Forwarded-For 헤더가 있으면 사용, 없으면 req.ip 사용
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
  },
  // 검증 스킵 (trust proxy가 이미 설정되어 있으므로)
  validate: {
    xForwardedForHeader: false, // X-Forwarded-For 검증 비활성화
  }
});

// API 엔드포인트에만 Rate Limiting 적용
app.use('/api', limiter);

/**
 * ========================================
 * Body Parser
 * ========================================
 */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * ========================================
 * 압축
 * ========================================
 */
app.use(compression());

/**
 * ========================================
 * 요청 로깅
 * ========================================
 */
app.use(requestLogger);

/**
 * ========================================
 * 정적 파일 제공 (이미지 업로드)
 * ========================================
 */
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
logger.info(`📁 정적 파일 제공: /uploads -> ${uploadsPath}`);

/**
 * ========================================
 * 라우트
 * ========================================
 */
app.use('/', routes);

/**
 * ========================================
 * 에러 핸들링
 * ========================================
 */

// 404 핸들러
app.use(notFoundHandler);

// 전역 에러 핸들러
app.use(globalErrorHandler);

export default app;
