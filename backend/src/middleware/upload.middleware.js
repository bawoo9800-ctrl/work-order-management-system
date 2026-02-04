/**
 * ========================================
 * 파일 업로드 미들웨어 (Multer)
 * ========================================
 * 파일: src/middleware/upload.middleware.js
 * 설명: 이미지 파일 업로드 처리
 *       - Multer 설정
 *       - 파일 검증
 *       - 임시 저장 (메모리)
 * ========================================
 */

import multer from 'multer';
import path from 'path';
import { AppError } from './error.middleware.js';

/**
 * 허용된 MIME 타입
 */
const ALLOWED_MIME_TYPES = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg,image/webp')
  .split(',')
  .map(type => type.trim());

/**
 * 최대 파일 크기 (MB)
 */
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024;

/**
 * 한 번에 업로드 가능한 최대 파일 수
 */
const MAX_FILES = parseInt(process.env.MAX_FILES_PER_REQUEST || '5');

/**
 * 파일 필터 함수
 * @param {object} req - Express 요청 객체
 * @param {object} file - Multer 파일 객체
 * @param {function} cb - 콜백 함수
 */
const fileFilter = (req, file, cb) => {
  // MIME 타입 검증
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new AppError(
        `허용되지 않은 파일 형식입니다. 허용된 형식: ${ALLOWED_MIME_TYPES.join(', ')}`,
        400
      ),
      false
    );
  }

  // 파일 확장자 검증
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  if (!allowedExtensions.includes(ext)) {
    return cb(
      new AppError(
        `허용되지 않은 파일 확장자입니다. 허용된 확장자: ${allowedExtensions.join(', ')}`,
        400
      ),
      false
    );
  }

  cb(null, true);
};

/**
 * Multer 메모리 스토리지 설정
 * 파일을 메모리에 임시 저장 (Buffer로 저장)
 * Sharp로 처리 후 NAS에 저장
 */
const storage = multer.memoryStorage();

/**
 * Multer 업로드 설정
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

/**
 * 단일 파일 업로드 미들웨어
 * 필드명: 'image'
 */
export const uploadSingle = upload.single('image');

/**
 * 다중 파일 업로드 미들웨어
 * 필드명: 'images'
 * 최대: MAX_FILES 개
 */
export const uploadMultiple = upload.array('images', MAX_FILES);

/**
 * Multer 에러 핸들러
 * @param {Error} err - Multer 에러
 * @param {object} req - Express 요청 객체
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 */
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer 에러 처리
    let message = '파일 업로드 중 오류가 발생했습니다.';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 업로드 가능합니다.`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = `한 번에 최대 ${MAX_FILES}개의 파일만 업로드 가능합니다.`;
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = '예상하지 못한 필드명입니다. "image" 또는 "images" 필드를 사용하세요.';
        break;
      default:
        message = err.message;
    }
    
    return next(new AppError(message, 400));
  }
  
  // 다른 에러는 전역 에러 핸들러로 전달
  next(err);
};

/**
 * 업로드 설정 정보 조회
 * @returns {object} 업로드 설정
 */
export const getUploadConfig = () => ({
  allowedMimeTypes: ALLOWED_MIME_TYPES,
  maxFileSize: MAX_FILE_SIZE,
  maxFileSizeMB: MAX_FILE_SIZE / 1024 / 1024,
  maxFiles: MAX_FILES,
});
