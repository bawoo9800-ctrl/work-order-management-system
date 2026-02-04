/**
 * ========================================
 * 에러 핸들링 미들웨어
 * ========================================
 * 파일: src/middleware/error.middleware.js
 * 설명: 전역 에러 처리 및 커스텀 에러 클래스
 *       - AppError 클래스 (상태 코드 + 메시지)
 *       - 글로벌 에러 핸들러
 *       - 404 핸들러
 *       - asyncHandler (try-catch 자동화)
 * ========================================
 */

import logger from '../utils/logger.js';

/**
 * 커스텀 에러 클래스
 * HTTP 상태 코드와 메시지를 포함
 */
export class AppError extends Error {
  /**
   * @param {string} message - 에러 메시지
   * @param {number} statusCode - HTTP 상태 코드
   * @param {boolean} isOperational - 운영 에러 여부 (true: 예상된 에러, false: 프로그래밍 에러)
   */
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    // 스택 트레이스 캡처
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 비동기 핸들러 래퍼
 * try-catch 자동화로 코드 간소화
 * 
 * @param {Function} fn - 비동기 라우트 핸들러
 * @returns {Function} Express 미들웨어 함수
 * 
 * @example
 * router.get('/clients', asyncHandler(async (req, res) => {
 *   const clients = await getClients();
 *   res.json({ success: true, data: clients });
 * }));
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found 핸들러
 * 정의되지 않은 라우트 요청 시 호출
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `요청한 경로를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`,
    404
  );
  
  logger.warn('404 Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });
  
  next(error);
};

/**
 * 글로벌 에러 핸들러
 * 모든 에러를 처리하고 클라이언트에 응답
 * 
 * @param {Error} err - 에러 객체
 * @param {object} req - Express Request
 * @param {object} res - Express Response
 * @param {Function} next - Express Next
 */
export const globalErrorHandler = (err, req, res, next) => {
  // 기본 에러 정보 설정
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // 개발 환경 vs 프로덕션 환경 응답 구분
  if (process.env.NODE_ENV === 'development') {
    handleDevelopmentError(err, req, res);
  } else {
    handleProductionError(err, req, res);
  }
};

/**
 * 개발 환경 에러 응답
 * 상세한 에러 정보 포함 (스택 트레이스 등)
 */
const handleDevelopmentError = (err, req, res) => {
  // 에러 로깅
  logger.error('에러 발생 (개발 환경)', {
    method: req.method,
    url: req.originalUrl,
    statusCode: err.statusCode,
    message: err.message,
    stack: err.stack,
    body: req.body,
    query: req.query,
    params: req.params,
  });
  
  // 클라이언트 응답
  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.message,
      statusCode: err.statusCode,
      status: err.status,
      stack: err.stack, // 개발 환경에서만 스택 노출
      isOperational: err.isOperational,
    },
    data: null,
  });
};

/**
 * 프로덕션 환경 에러 응답
 * 민감한 정보 제외, 사용자 친화적 메시지
 */
const handleProductionError = (err, req, res) => {
  // 운영 에러 (예상된 에러) vs 프로그래밍 에러 구분
  if (err.isOperational) {
    // 예상된 에러: 클라이언트에게 안전하게 노출
    logger.warn('운영 에러 발생', {
      method: req.method,
      url: req.originalUrl,
      statusCode: err.statusCode,
      message: err.message,
    });
    
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
        status: err.status,
      },
      data: null,
    });
  } else {
    // 프로그래밍 에러: 로그만 남기고 일반 메시지 응답
    logger.error('프로그래밍 에러 발생', {
      method: req.method,
      url: req.originalUrl,
      statusCode: err.statusCode,
      message: err.message,
      stack: err.stack,
    });
    
    res.status(500).json({
      success: false,
      error: {
        message: '서버 내부 오류가 발생했습니다. 관리자에게 문의하세요.',
        statusCode: 500,
        status: 'error',
      },
      data: null,
    });
  }
};

/**
 * 데이터베이스 에러 변환
 * MySQL/MariaDB 에러를 AppError로 변환
 * 
 * @param {Error} err - 데이터베이스 에러
 * @returns {AppError} 변환된 에러
 */
export const handleDatabaseError = (err) => {
  // Duplicate entry 에러 (예: UNIQUE 제약 위반)
  if (err.code === 'ER_DUP_ENTRY') {
    return new AppError('이미 존재하는 데이터입니다.', 409);
  }
  
  // Foreign key constraint 에러
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return new AppError('참조하는 데이터가 존재하지 않습니다.', 400);
  }
  
  // Connection error
  if (err.code === 'ECONNREFUSED') {
    return new AppError('데이터베이스 연결에 실패했습니다.', 503);
  }
  
  // 기타 데이터베이스 에러
  logger.error('데이터베이스 에러', {
    code: err.code,
    errno: err.errno,
    message: err.message,
    sqlMessage: err.sqlMessage,
  });
  
  return new AppError('데이터베이스 오류가 발생했습니다.', 500);
};

/**
 * Validation 에러 변환
 * Joi 또는 기타 검증 라이브러리 에러를 AppError로 변환
 * 
 * @param {Error} err - Validation 에러
 * @returns {AppError} 변환된 에러
 */
export const handleValidationError = (err) => {
  if (err.details) {
    // Joi validation error
    const messages = err.details.map(detail => detail.message).join(', ');
    return new AppError(`입력 데이터 검증 실패: ${messages}`, 400);
  }
  
  return new AppError('입력 데이터가 올바르지 않습니다.', 400);
};

/**
 * Multer 파일 업로드 에러 변환
 * 
 * @param {Error} err - Multer 에러
 * @returns {AppError} 변환된 에러
 */
export const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('파일 크기가 너무 큽니다.', 413);
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('파일 개수가 초과되었습니다.', 413);
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('예상하지 못한 파일 필드입니다.', 400);
  }
  
  return new AppError('파일 업로드 중 오류가 발생했습니다.', 400);
};
