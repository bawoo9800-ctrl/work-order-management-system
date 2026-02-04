/**
 * ========================================
 * Winston 로거 유틸리티
 * ========================================
 * 파일: src/utils/logger.js
 * 설명: 애플리케이션 전역 로거 설정
 *       - 콘솔 출력 (개발 환경)
 *       - 파일 로깅 (일별 로테이션)
 *       - 레벨별 색상 구분
 *       - 전용 로깅 메서드 제공 (API, OCR, AI 분류)
 * ========================================
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경 변수에서 로그 설정 가져오기
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../../logs');
const LOG_MAX_SIZE = process.env.LOG_MAX_SIZE || '20m';
const LOG_MAX_FILES = process.env.LOG_MAX_FILES || '14d';
const LOG_DATE_PATTERN = process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD';

/**
 * 로그 포맷 정의
 * - timestamp: 타임스탬프 (ISO 8601)
 * - level: 로그 레벨 (대문자)
 * - message: 로그 메시지
 * - metadata: 추가 메타데이터 (JSON)
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * 콘솔 출력용 포맷 (색상 + 가독성)
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // 메타데이터가 있으면 JSON 형태로 추가
    if (Object.keys(metadata).length > 0) {
      msg += `\n${JSON.stringify(metadata, null, 2)}`;
    }
    
    return msg;
  })
);

/**
 * Transport 설정
 * 1. 콘솔 출력 (개발 환경)
 * 2. 전체 로그 파일 (combined)
 * 3. 에러 로그 파일 (error)
 * 4. API 요청 로그 파일
 * 5. OCR 처리 로그 파일
 * 6. AI 분류 로그 파일
 */
const transports = [];

// 1. 콘솔 출력 (개발 환경에서만)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: LOG_LEVEL,
    })
  );
}

// 2. 전체 로그 파일 (일별 로테이션)
transports.push(
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
    datePattern: LOG_DATE_PATTERN,
    maxSize: LOG_MAX_SIZE,
    maxFiles: LOG_MAX_FILES,
    format: logFormat,
    level: 'info',
  })
);

// 3. 에러 로그 파일 (일별 로테이션)
transports.push(
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'error-%DATE%.log'),
    datePattern: LOG_DATE_PATTERN,
    maxSize: LOG_MAX_SIZE,
    maxFiles: LOG_MAX_FILES,
    format: logFormat,
    level: 'error',
  })
);

// 4. API 요청 로그 파일
transports.push(
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'api-%DATE%.log'),
    datePattern: LOG_DATE_PATTERN,
    maxSize: LOG_MAX_SIZE,
    maxFiles: LOG_MAX_FILES,
    format: logFormat,
    level: 'info',
  })
);

// 5. OCR 처리 로그 파일
transports.push(
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'ocr-%DATE%.log'),
    datePattern: LOG_DATE_PATTERN,
    maxSize: LOG_MAX_SIZE,
    maxFiles: LOG_MAX_FILES,
    format: logFormat,
    level: 'debug',
  })
);

// 6. AI 분류 로그 파일
transports.push(
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'ai-%DATE%.log'),
    datePattern: LOG_DATE_PATTERN,
    maxSize: LOG_MAX_SIZE,
    maxFiles: LOG_MAX_FILES,
    format: logFormat,
    level: 'debug',
  })
);

/**
 * Winston 로거 인스턴스 생성
 */
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  transports,
  exitOnError: false,
});

/**
 * 전용 로깅 메서드
 */

/**
 * API 요청 로깅
 * @param {string} method - HTTP 메서드 (GET, POST 등)
 * @param {string} url - 요청 URL
 * @param {number} statusCode - 응답 상태 코드
 * @param {number} responseTime - 응답 시간 (ms)
 * @param {object} metadata - 추가 메타데이터
 */
logger.api = (method, url, statusCode, responseTime, metadata = {}) => {
  logger.info('API 요청', {
    category: 'api',
    method,
    url,
    statusCode,
    responseTime: `${responseTime}ms`,
    ...metadata,
  });
};

/**
 * OCR 처리 로깅
 * @param {string} workOrderId - 작업지시서 UUID
 * @param {string} status - 처리 상태 (started, completed, failed)
 * @param {object} result - OCR 결과 데이터
 */
logger.ocr = (workOrderId, status, result = {}) => {
  const level = status === 'failed' ? 'error' : 'debug';
  logger.log(level, `OCR 처리 ${status}`, {
    category: 'ocr',
    workOrderId,
    status,
    ...result,
  });
};

/**
 * AI 분류 로깅
 * @param {string} workOrderId - 작업지시서 UUID
 * @param {string} method - 분류 방법 (keyword, ai_text, ai_vision)
 * @param {object} result - 분류 결과
 */
logger.aiClassification = (workOrderId, method, result = {}) => {
  const level = result.error ? 'error' : 'debug';
  logger.log(level, `AI 분류 - ${method}`, {
    category: 'ai_classification',
    workOrderId,
    method,
    ...result,
  });
};

/**
 * 데이터베이스 쿼리 로깅
 * @param {string} query - SQL 쿼리 (요약)
 * @param {number} executionTime - 실행 시간 (ms)
 * @param {object} metadata - 추가 메타데이터
 */
logger.db = (query, executionTime, metadata = {}) => {
  logger.debug('DB 쿼리 실행', {
    category: 'database',
    query: query.substring(0, 100), // 처음 100자만 로깅
    executionTime: `${executionTime}ms`,
    ...metadata,
  });
};

/**
 * 비용 추적 로깅
 * @param {string} provider - API 제공자 (openai, tesseract)
 * @param {string} model - 모델명
 * @param {number} cost - 비용 (USD)
 * @param {object} metadata - 추가 메타데이터
 */
logger.cost = (provider, model, cost, metadata = {}) => {
  logger.info('API 비용 발생', {
    category: 'cost_tracking',
    provider,
    model,
    cost: `$${cost.toFixed(6)}`,
    ...metadata,
  });
};

/**
 * 성능 측정 로깅
 * @param {string} operation - 작업명
 * @param {number} startTime - 시작 시간 (Date.now())
 * @param {object} metadata - 추가 메타데이터
 */
logger.performance = (operation, startTime, metadata = {}) => {
  const duration = Date.now() - startTime;
  logger.debug('성능 측정', {
    category: 'performance',
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
};

/**
 * 로거 시작 메시지
 */
logger.info('Winston 로거 초기화 완료', {
  level: LOG_LEVEL,
  environment: process.env.NODE_ENV || 'development',
  logDirectory: LOG_DIR,
});

export default logger;
