/**
 * ========================================
 * 이미지 처리 유틸리티 (Sharp)
 * ========================================
 * 파일: src/utils/imageProcessor.js
 * 설명: 이미지 리사이즈, 최적화, 저장
 *       - Sharp 라이브러리 사용
 *       - 썸네일 생성
 *       - NAS 저장
 * ========================================
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger.js';

/**
 * 이미지 최대 너비
 */
const MAX_WIDTH = parseInt(process.env.IMAGE_MAX_WIDTH || '2048');

/**
 * 이미지 최대 높이
 */
const MAX_HEIGHT = parseInt(process.env.IMAGE_MAX_HEIGHT || '2048');

/**
 * 이미지 품질
 */
const IMAGE_QUALITY = parseInt(process.env.IMAGE_QUALITY || '85');

/**
 * 이미지 포맷
 */
const IMAGE_FORMAT = process.env.IMAGE_FORMAT || 'jpeg';

/**
 * 썸네일 크기
 */
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 400;

/**
 * 저장 경로 생성
 * @param {string} basePath - 기본 저장 경로
 * @param {number} clientId - 거래처 ID (선택)
 * @returns {Promise<string>} 생성된 디렉토리 경로
 */
export const createStoragePath = async (basePath, clientId = null) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // 경로: /basePath/[clientId]/YYYY/MM
  const dirPath = clientId
    ? path.join(basePath, `client_${clientId}`, `${year}`, month)
    : path.join(basePath, 'unclassified', `${year}`, month);
  
  // 디렉토리 생성 (재귀적)
  await fs.mkdir(dirPath, { recursive: true });
  
  return dirPath;
};

/**
 * 이미지 메타데이터 추출
 * @param {Buffer} buffer - 이미지 버퍼
 * @returns {Promise<object>} 이미지 메타데이터
 */
export const getImageMetadata = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
    };
  } catch (error) {
    logger.error('이미지 메타데이터 추출 실패', { error: error.message });
    throw new Error('이미지 메타데이터를 추출할 수 없습니다.');
  }
};

/**
 * 이미지 리사이즈 및 최적화
 * @param {Buffer} buffer - 원본 이미지 버퍼
 * @param {object} options - 처리 옵션
 * @param {number} options.maxWidth - 최대 너비
 * @param {number} options.maxHeight - 최대 높이
 * @param {number} options.quality - 품질 (1-100)
 * @param {string} options.format - 포맷 (jpeg, png, webp)
 * @returns {Promise<Buffer>} 처리된 이미지 버퍼
 */
export const processImage = async (buffer, options = {}) => {
  const {
    maxWidth = MAX_WIDTH,
    maxHeight = MAX_HEIGHT,
    quality = IMAGE_QUALITY,
    format = IMAGE_FORMAT,
  } = options;

  try {
    let image = sharp(buffer);
    
    // 자동 회전 (EXIF Orientation 기반)
    image = image.rotate();
    
    // 리사이즈 (비율 유지)
    image = image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
    
    // 포맷 변환 및 최적화
    switch (format) {
      case 'jpeg':
      case 'jpg':
        image = image.jpeg({ quality, progressive: true });
        break;
      case 'png':
        image = image.png({ quality, progressive: true });
        break;
      case 'webp':
        image = image.webp({ quality });
        break;
      default:
        image = image.jpeg({ quality, progressive: true });
    }
    
    const processedBuffer = await image.toBuffer();
    
    logger.debug('이미지 처리 완료', {
      originalSize: buffer.length,
      processedSize: processedBuffer.length,
      reduction: `${((1 - processedBuffer.length / buffer.length) * 100).toFixed(1)}%`,
    });
    
    return processedBuffer;
  } catch (error) {
    logger.error('이미지 처리 실패', { error: error.message });
    throw new Error('이미지를 처리할 수 없습니다.');
  }
};

/**
 * 썸네일 생성
 * @param {Buffer} buffer - 원본 이미지 버퍼
 * @param {number} width - 썸네일 너비 (기본: 400)
 * @param {number} height - 썸네일 높이 (기본: 400)
 * @returns {Promise<Buffer>} 썸네일 버퍼
 */
export const createThumbnail = async (buffer, width = THUMBNAIL_WIDTH, height = THUMBNAIL_HEIGHT) => {
  try {
    const thumbnail = await sharp(buffer)
      .rotate()
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
    
    return thumbnail;
  } catch (error) {
    logger.error('썸네일 생성 실패', { error: error.message });
    throw new Error('썸네일을 생성할 수 없습니다.');
  }
};

/**
 * OCR을 위한 이미지 전처리
 * @param {Buffer} buffer - 원본 이미지 버퍼
 * @returns {Promise<Buffer>} 전처리된 이미지 버퍼
 */
export const preprocessForOCR = async (buffer) => {
  try {
    // OCR 정확도 향상을 위한 전처리
    const processed = await sharp(buffer)
      .rotate()
      .resize(null, 2000, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .grayscale() // 그레이스케일 변환
      .normalize() // 대비 정규화
      .sharpen() // 선명도 향상
      .toBuffer();
    
    logger.debug('OCR 전처리 완료', {
      originalSize: buffer.length,
      processedSize: processed.length,
    });
    
    return processed;
  } catch (error) {
    logger.error('OCR 전처리 실패', { error: error.message });
    throw new Error('OCR을 위한 이미지 전처리에 실패했습니다.');
  }
};

/**
 * 이미지 저장
 * @param {Buffer} buffer - 이미지 버퍼
 * @param {string} dirPath - 저장 디렉토리 경로
 * @param {string} filename - 파일명 (UUID 기반)
 * @returns {Promise<string>} 저장된 파일 전체 경로
 */
export const saveImage = async (buffer, dirPath, filename) => {
  try {
    const filePath = path.join(dirPath, filename);
    await fs.writeFile(filePath, buffer);
    
    logger.info('이미지 저장 완료', {
      filePath,
      size: buffer.length,
    });
    
    return filePath;
  } catch (error) {
    logger.error('이미지 저장 실패', { error: error.message, dirPath, filename });
    throw new Error('이미지를 저장할 수 없습니다.');
  }
};

/**
 * 이미지 파일 삭제
 * @param {string} filePath - 삭제할 파일 경로
 * @returns {Promise<void>}
 */
export const deleteImage = async (filePath) => {
  try {
    await fs.unlink(filePath);
    logger.info('이미지 삭제 완료', { filePath });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error('이미지 삭제 실패', { error: error.message, filePath });
      throw new Error('이미지를 삭제할 수 없습니다.');
    }
  }
};

/**
 * 전체 이미지 처리 파이프라인
 * @param {Buffer} buffer - 원본 이미지 버퍼
 * @param {string} originalFilename - 원본 파일명
 * @param {number} clientId - 거래처 ID (선택)
 * @returns {Promise<object>} 처리 결과
 */
export const processAndSaveImage = async (buffer, originalFilename, clientId = null) => {
  const startTime = Date.now();
  
  try {
    // 1) 메타데이터 추출
    const metadata = await getImageMetadata(buffer);
    
    // 2) 이미지 최적화
    const processedBuffer = await processImage(buffer);
    
    // 3) 썸네일 생성
    const thumbnailBuffer = await createThumbnail(processedBuffer);
    
    // 4) OCR 전처리 이미지 생성
    const ocrBuffer = await preprocessForOCR(buffer);
    
    // 5) 저장 경로 생성
    const basePath = process.env.NAS_STORAGE_PATH || '/volume1/work_orders';
    const dirPath = await createStoragePath(basePath, clientId);
    
    // 6) 파일명 생성
    const uuid = uuidv4();
    const ext = path.extname(originalFilename) || '.jpg';
    const mainFilename = `${uuid}${ext}`;
    const thumbnailFilename = `${uuid}_thumb${ext}`;
    const ocrFilename = `${uuid}_ocr${ext}`;
    
    // 7) 이미지 저장
    const mainPath = await saveImage(processedBuffer, dirPath, mainFilename);
    const thumbnailPath = await saveImage(thumbnailBuffer, dirPath, thumbnailFilename);
    const ocrPath = await saveImage(ocrBuffer, dirPath, ocrFilename);
    
    // 8) 상대 경로 생성 (NAS 전체 경로에서 날짜 기반 경로만 추출)
    // 예: /volume1/work_orders/unclassified/2026/02/abc.jpg -> unclassified/2026/02/abc.jpg
    // basePath는 위에서 이미 선언됨 (272번째 줄)
    const relativePath = mainPath.replace(basePath + path.sep, '').replace(/\\/g, '/');
    
    const processingTime = Date.now() - startTime;
    
    logger.info('이미지 처리 파이프라인 완료', {
      uuid,
      originalFilename,
      clientId,
      mainPath,
      relativePath,
      processingTime: `${processingTime}ms`,
    });
    
    return {
      uuid,
      originalFilename,
      storagePath: relativePath, // 상대 경로로 변경
      thumbnailPath,
      ocrPath,
      fileSize: processedBuffer.length,
      imageWidth: metadata.width,
      imageHeight: metadata.height,
      mimeType: `image/${IMAGE_FORMAT}`,
      processingTimeMs: processingTime,
    };
  } catch (error) {
    logger.error('이미지 처리 파이프라인 실패', {
      error: error.message,
      originalFilename,
      clientId,
    });
    throw error;
  }
};
