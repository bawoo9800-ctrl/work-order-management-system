/**
 * ========================================
 * OCR 서비스 (Tesseract.js)
 * ========================================
 * 파일: src/services/ocr.service.js
 * 설명: 이미지에서 텍스트 추출
 *       - Tesseract.js 사용
 *       - 한국어 + 영어 지원
 *       - 텍스트 정제
 * ========================================
 */

import Tesseract from 'tesseract.js';
import logger from '../utils/logger.js';

/**
 * Tesseract 언어 설정 (한국어 + 영어)
 */
const TESSERACT_LANG = process.env.TESSERACT_LANG || 'kor+eng';

/**
 * Tesseract PSM (Page Segmentation Mode)
 * 3 = Fully automatic page segmentation (기본)
 */
const TESSERACT_PSM = parseInt(process.env.TESSERACT_PSM || '3');

/**
 * Tesseract OEM (OCR Engine Mode)
 * 3 = Default (LSTM + Legacy 혼합)
 */
const TESSERACT_OEM = parseInt(process.env.TESSERACT_OEM || '3');

/**
 * 디버그 모드
 */
const DEBUG_OCR = process.env.DEBUG_OCR === 'true';

/**
 * Tesseract Worker (싱글톤)
 */
let worker = null;

/**
 * Tesseract Worker 초기화
 * @returns {Promise<object>} Tesseract Worker
 */
const initWorker = async () => {
  if (worker) {
    return worker;
  }

  try {
    logger.info('Tesseract Worker 초기화 시작', {
      lang: TESSERACT_LANG,
      psm: TESSERACT_PSM,
      oem: TESSERACT_OEM,
    });

    worker = await Tesseract.createWorker(TESSERACT_LANG, TESSERACT_OEM, {
      logger: DEBUG_OCR ? (m) => logger.debug('Tesseract:', m) : undefined,
    });

    await worker.setParameters({
      tessedit_pageseg_mode: TESSERACT_PSM,
    });

    logger.info('Tesseract Worker 초기화 완료');

    return worker;
  } catch (error) {
    logger.error('Tesseract Worker 초기화 실패', { error: error.message });
    throw new Error('OCR 엔진 초기화에 실패했습니다.');
  }
};

/**
 * Tesseract Worker 종료
 */
export const terminateWorker = async () => {
  if (worker) {
    await worker.terminate();
    worker = null;
    logger.info('Tesseract Worker 종료');
  }
};

/**
 * 텍스트 정제
 * @param {string} text - OCR 추출 텍스트
 * @returns {string} 정제된 텍스트
 */
const cleanText = (text) => {
  if (!text) return '';

  return text
    .replace(/\s+/g, ' ') // 연속된 공백을 하나로
    .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣0-9\-.,()]/g, '') // 특수문자 제거 (일부 유지)
    .trim();
};

/**
 * 이미지에서 텍스트 추출 (OCR)
 * @param {Buffer|string} image - 이미지 버퍼 또는 파일 경로
 * @returns {Promise<object>} OCR 결과
 */
export const extractText = async (image) => {
  const startTime = Date.now();

  try {
    // Worker 초기화
    const ocrWorker = await initWorker();

    logger.debug('OCR 처리 시작');

    // Tesseract OCR 실행
    const { data } = await ocrWorker.recognize(image);

    const processingTime = Date.now() - startTime;

    // 텍스트 정제
    const cleanedText = cleanText(data.text);

    // 신뢰도 계산
    const confidence = data.confidence || 0;

    logger.info('OCR 처리 완료', {
      textLength: cleanedText.length,
      confidence: `${confidence.toFixed(2)}%`,
      processingTime: `${processingTime}ms`,
    });

    if (DEBUG_OCR) {
      logger.debug('OCR 추출 텍스트', {
        text: cleanedText.substring(0, 200), // 처음 200자만 로그
      });
    }

    return {
      text: cleanedText,
      rawText: data.text,
      confidence,
      processingTimeMs: processingTime,
      language: TESSERACT_LANG,
      wordCount: data.words ? data.words.length : 0,
      lineCount: data.lines ? data.lines.length : 0,
    };
  } catch (error) {
    logger.error('OCR 처리 실패', { error: error.message });
    throw new Error('텍스트 추출에 실패했습니다.');
  }
};

/**
 * 여러 이미지에서 텍스트 추출 (배치)
 * @param {Array<Buffer|string>} images - 이미지 배열
 * @returns {Promise<Array<object>>} OCR 결과 배열
 */
export const extractTextBatch = async (images) => {
  const results = [];

  for (const image of images) {
    try {
      const result = await extractText(image);
      results.push({ success: true, data: result });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }

  return results;
};

/**
 * OCR 설정 정보 조회
 * @returns {object} OCR 설정
 */
export const getOcrConfig = () => ({
  language: TESSERACT_LANG,
  psm: TESSERACT_PSM,
  oem: TESSERACT_OEM,
  debug: DEBUG_OCR,
});

/**
 * 프로세스 종료 시 Worker 정리
 */
process.on('beforeExit', async () => {
  await terminateWorker();
});

process.on('SIGINT', async () => {
  await terminateWorker();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await terminateWorker();
  process.exit(0);
});
