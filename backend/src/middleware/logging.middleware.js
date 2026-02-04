/**
 * ========================================
 * 요청 로깅 미들웨어
 * ========================================
 * 파일: src/middleware/logging.middleware.js
 * 설명: HTTP 요청/응답 로깅
 *       - 요청 메서드, URL, IP 주소
 *       - 응답 상태 코드, 처리 시간
 *       - API 엔드포인트 추적
 * ========================================
 */

import logger from '../utils/logger.js';

/**
 * 요청 로깅 미들웨어
 * 모든 HTTP 요청을 로깅하고 응답 시간 측정
 */
export const requestLogger = (req, res, next) => {
  // 요청 시작 시간 기록
  const startTime = Date.now();
  
  // 원본 res.json 메서드 저장
  const originalJson = res.json.bind(res);
  
  // res.json 메서드 오버라이드 (응답 시 로깅)
  res.json = function (data) {
    const responseTime = Date.now() - startTime;
    
    // API 요청 로깅
    logger.api(
      req.method,
      req.originalUrl,
      res.statusCode,
      responseTime,
      {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        body: req.method !== 'GET' && req.body ? sanitizeBody(req.body) : undefined,
      }
    );
    
    // 원본 메서드 호출
    return originalJson(data);
  };
  
  next();
};

/**
 * 요청 body에서 민감한 정보 제거
 * (비밀번호, API 키 등)
 * 
 * @param {object} body - 요청 body
 * @returns {object} 정제된 body
 */
const sanitizeBody = (body) => {
  const sensitiveFields = ['password', 'apiKey', 'api_key', 'token', 'secret'];
  const sanitized = { ...body };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });
  
  return sanitized;
};

/**
 * 특정 경로 로깅 제외 미들웨어
 * (예: /health, /favicon.ico)
 */
export const skipLoggingForPaths = (paths = []) => {
  return (req, res, next) => {
    if (paths.includes(req.path)) {
      return next();
    }
    
    requestLogger(req, res, next);
  };
};
