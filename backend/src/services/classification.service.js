/**
 * ========================================
 * 분류 서비스 (Classification Service)
 * ========================================
 * 파일: src/services/classification.service.js
 * 설명: 작업지시서 자동 분류
 *       - 키워드 기반 매칭
 *       - 신뢰도 점수 계산
 *       - 분류 근거 생성
 * ========================================
 */

import { searchClientsByKeywords } from '../models/client.model.js';
import logger from '../utils/logger.js';

/**
 * 키워드 매칭 신뢰도 임계값
 */
const CONFIDENCE_THRESHOLD = parseFloat(process.env.KEYWORD_CONFIDENCE_THRESHOLD || '0.7');

/**
 * 자동 분류 최소 신뢰도
 */
const AUTO_CLASSIFICATION_MIN_CONFIDENCE = parseFloat(
  process.env.AUTO_CLASSIFICATION_MIN_CONFIDENCE || '0.8'
);

/**
 * 키워드 기반 분류
 * @param {string} ocrText - OCR 추출 텍스트
 * @returns {Promise<object>} 분류 결과
 */
export const classifyByKeywords = async (ocrText) => {
  const startTime = Date.now();

  try {
    if (!ocrText || ocrText.trim().length === 0) {
      return {
        success: false,
        clientId: null,
        confidence: 0,
        method: 'keyword',
        reasoning: '추출된 텍스트가 없습니다.',
        candidates: [],
        processingTimeMs: Date.now() - startTime,
      };
    }

    logger.debug('키워드 기반 분류 시작', {
      textLength: ocrText.length,
    });

    // 키워드 매칭
    const matches = await searchClientsByKeywords(ocrText);

    if (matches.length === 0) {
      logger.info('매칭된 거래처 없음', {
        textLength: ocrText.length,
      });

      return {
        success: false,
        clientId: null,
        confidence: 0,
        method: 'keyword',
        reasoning: '매칭되는 거래처를 찾을 수 없습니다.',
        candidates: [],
        processingTimeMs: Date.now() - startTime,
      };
    }

    // 최상위 매칭
    const topMatch = matches[0];
    const isHighConfidence = topMatch.confidence >= AUTO_CLASSIFICATION_MIN_CONFIDENCE;

    logger.info('키워드 기반 분류 완료', {
      clientId: topMatch.id,
      clientName: topMatch.name,
      confidence: topMatch.confidence.toFixed(3),
      matchCount: topMatch.matchCount,
      isAutoClassified: isHighConfidence,
    });

    // 분류 근거 생성
    const reasoning = `키워드 매칭: ${topMatch.matchedKeywords.join(', ')} (${topMatch.matchCount}개 매칭)`;

    return {
      success: true,
      clientId: topMatch.id,
      clientName: topMatch.name,
      clientCode: topMatch.code,
      confidence: topMatch.confidence,
      method: 'keyword',
      reasoning,
      matchedKeywords: topMatch.matchedKeywords,
      matchCount: topMatch.matchCount,
      isAutoClassified: isHighConfidence,
      candidates: matches.slice(0, 5).map((m) => ({
        clientId: m.id,
        clientName: m.name,
        clientCode: m.code,
        confidence: m.confidence,
        matchedKeywords: m.matchedKeywords,
      })),
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    logger.error('키워드 기반 분류 실패', { error: error.message });
    throw new Error('키워드 기반 분류에 실패했습니다.');
  }
};

/**
 * 여러 거래처 후보 중 최적 선택
 * @param {Array<object>} candidates - 거래처 후보 목록
 * @returns {object|null} 선택된 거래처 또는 null
 */
export const selectBestCandidate = (candidates) => {
  if (!candidates || candidates.length === 0) {
    return null;
  }

  // 신뢰도 순으로 정렬 (이미 정렬되어 있을 가능성 높음)
  const sorted = [...candidates].sort((a, b) => b.confidence - a.confidence);

  const topCandidate = sorted[0];

  // 임계값 이상인 경우에만 선택
  if (topCandidate.confidence >= CONFIDENCE_THRESHOLD) {
    return topCandidate;
  }

  return null;
};

/**
 * 수동 분류 처리
 * @param {number} workOrderId - 작업지시서 ID
 * @param {number} clientId - 선택된 거래처 ID
 * @param {string} reason - 분류 사유 (선택)
 * @returns {Promise<object>} 분류 결과
 */
export const manualClassify = async (workOrderId, clientId, reason = null) => {
  try {
    logger.info('수동 분류 처리', {
      workOrderId,
      clientId,
    });

    return {
      success: true,
      clientId,
      method: 'manual',
      confidence: 1.0,
      reasoning: reason || '관리자가 수동으로 분류했습니다.',
      isAutoClassified: false,
    };
  } catch (error) {
    logger.error('수동 분류 실패', { error: error.message });
    throw new Error('수동 분류에 실패했습니다.');
  }
};

/**
 * 분류 피드백 저장
 * @param {number} workOrderId - 작업지시서 ID
 * @param {number} predictedClientId - 예측된 거래처 ID
 * @param {number} actualClientId - 실제 거래처 ID
 * @param {string} correctedBy - 수정한 사용자 (선택)
 * @returns {Promise<void>}
 */
export const saveClassificationFeedback = async (
  workOrderId,
  predictedClientId,
  actualClientId,
  correctedBy = null
) => {
  try {
    const isCorrect = predictedClientId === actualClientId;

    logger.info('분류 피드백 저장', {
      workOrderId,
      predictedClientId,
      actualClientId,
      isCorrect,
    });

    // TODO: classification_feedback 테이블에 저장
    // const sql = `
    //   INSERT INTO classification_feedback 
    //   (work_order_id, predicted_client_id, actual_client_id, is_correct, corrected_by)
    //   VALUES (?, ?, ?, ?, ?)
    // `;
    // await insert(sql, [workOrderId, predictedClientId, actualClientId, isCorrect, correctedBy]);

    return {
      success: true,
      isCorrect,
    };
  } catch (error) {
    logger.error('분류 피드백 저장 실패', { error: error.message });
    throw new Error('분류 피드백 저장에 실패했습니다.');
  }
};

/**
 * 분류 정확도 통계
 * @returns {Promise<object>} 정확도 통계
 */
export const getClassificationAccuracy = async () => {
  try {
    // TODO: classification_feedback 테이블에서 통계 조회
    // const sql = `
    //   SELECT 
    //     COUNT(*) AS total_feedbacks,
    //     SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct_predictions,
    //     AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) AS accuracy
    //   FROM classification_feedback
    // `;
    // const stats = await queryOne(sql);

    return {
      totalFeedbacks: 0,
      correctPredictions: 0,
      accuracy: 0,
    };
  } catch (error) {
    logger.error('분류 정확도 통계 조회 실패', { error: error.message });
    throw new Error('분류 정확도 통계 조회에 실패했습니다.');
  }
};

/**
 * 분류 설정 정보 조회
 * @returns {object} 분류 설정
 */
export const getClassificationConfig = () => ({
  confidenceThreshold: CONFIDENCE_THRESHOLD,
  autoClassificationMinConfidence: AUTO_CLASSIFICATION_MIN_CONFIDENCE,
});
