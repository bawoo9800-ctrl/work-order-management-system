/**
 * ========================================
 * 작업지시서 모델 (Work Order Model)
 * ========================================
 * 파일: src/models/workOrder.model.js
 * 설명: 작업지시서 데이터베이스 조작 함수
 *       - CRUD 작업
 *       - 이미지 메타데이터 관리
 *       - OCR 텍스트 저장
 *       - 분류 결과 관리
 * ========================================
 */

import { query, queryOne, insert, execute } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * 모든 작업지시서 조회 (페이징)
 * @param {object} options - 조회 옵션
 * @param {number} options.page - 페이지 번호 (기본: 1)
 * @param {number} options.limit - 페이지당 개수 (기본: 20)
 * @param {number} options.clientId - 거래처 ID 필터 (선택)
 * @param {string} options.status - 상태 필터 (선택)
 * @param {string} options.startDate - 시작일 (선택)
 * @param {string} options.endDate - 종료일 (선택)
 * @returns {Promise<object>} 작업지시서 목록 및 페이징 정보
 */
export const getAllWorkOrders = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    clientId,
    status,
    startDate,
    endDate,
  } = options;

  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  // 필터 조건 추가
  if (clientId) {
    conditions.push('wo.client_id = ?');
    params.push(clientId);
  }

  if (status) {
    conditions.push('wo.status = ?');
    params.push(status);
  }

  if (startDate) {
    conditions.push('wo.work_date >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('wo.work_date <= ?');
    params.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 총 개수 조회
  const countSql = `
    SELECT COUNT(*) as total
    FROM work_orders wo
    ${whereClause}
  `;
  const { total } = await queryOne(countSql, params);

  // 데이터 조회
  const dataSql = `
    SELECT 
      wo.*,
      c.code as client_code,
      c.name as client_name
    FROM work_orders wo
    LEFT JOIN clients c ON wo.client_id = c.id
    ${whereClause}
    ORDER BY wo.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const workOrders = await query(dataSql, [...params, limit, offset]);

  return {
    data: workOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * ID로 작업지시서 조회
 * @param {number} id - 작업지시서 ID
 * @returns {Promise<object|null>} 작업지시서 정보
 */
export const getWorkOrderById = async (id) => {
  const sql = `
    SELECT 
      wo.*,
      c.code as client_code,
      c.name as client_name,
      c.contact_info as client_contact
    FROM work_orders wo
    LEFT JOIN clients c ON wo.client_id = c.id
    WHERE wo.id = ?
  `;
  
  const workOrder = await queryOne(sql, [id]);
  
  if (!workOrder && workOrder.client_contact) {
    workOrder.client_contact = JSON.parse(workOrder.client_contact);
  }
  
  return workOrder;
};

/**
 * UUID로 작업지시서 조회
 * @param {string} uuid - 작업지시서 UUID
 * @returns {Promise<object|null>} 작업지시서 정보
 */
export const getWorkOrderByUuid = async (uuid) => {
  const sql = `
    SELECT 
      wo.*,
      c.code as client_code,
      c.name as client_name
    FROM work_orders wo
    LEFT JOIN clients c ON wo.client_id = c.id
    WHERE wo.uuid = ?
  `;
  
  return await queryOne(sql, [uuid]);
};

/**
 * 작업지시서 생성
 * @param {object} workOrderData - 작업지시서 데이터
 * @param {string} workOrderData.uuid - 고유 UUID
 * @param {string} workOrderData.original_filename - 원본 파일명
 * @param {string} workOrderData.storage_path - 저장 경로
 * @param {number} workOrderData.file_size - 파일 크기
 * @param {string} workOrderData.mime_type - MIME 타입
 * @param {number} workOrderData.image_width - 이미지 너비
 * @param {number} workOrderData.image_height - 이미지 높이
 * @param {number} workOrderData.client_id - 거래처 ID (선택)
 * @param {string} workOrderData.classification_method - 분류 방법
 * @param {number} workOrderData.confidence_score - 신뢰도 점수
 * @param {string} workOrderData.reasoning - 분류 근거
 * @param {string} workOrderData.ocr_text - OCR 추출 텍스트
 * @param {string} workOrderData.work_date - 작업일자
 * @param {string} workOrderData.status - 상태
 * @param {number} workOrderData.api_cost_usd - API 비용
 * @param {number} workOrderData.processing_time_ms - 처리 시간
 * @returns {Promise<number>} 생성된 작업지시서 ID
 */
export const createWorkOrder = async (workOrderData) => {
  const {
    uuid,
    original_filename,
    storage_path,
    file_size,
    mime_type,
    image_width,
    image_height,
    client_id = null,
    classification_method = 'pending',
    confidence_score = null,
    reasoning = null,
    ocr_text = null,
    work_date = null,
    status = 'pending',
    api_cost_usd = 0,
    processing_time_ms = 0,
  } = workOrderData;

  const sql = `
    INSERT INTO work_orders (
      uuid, original_filename, storage_path, file_size, mime_type,
      image_width, image_height, client_id, classification_method,
      confidence_score, reasoning, ocr_text, work_date, status,
      api_cost_usd, processing_time_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    uuid,
    original_filename,
    storage_path,
    file_size,
    mime_type,
    image_width,
    image_height,
    client_id,
    classification_method,
    confidence_score,
    reasoning,
    ocr_text,
    work_date,
    status,
    api_cost_usd,
    processing_time_ms,
  ];

  const workOrderId = await insert(sql, params);

  logger.info('작업지시서 생성 완료', {
    workOrderId,
    uuid,
    original_filename,
    client_id,
    classification_method,
  });

  return workOrderId;
};

/**
 * 작업지시서 수정
 * @param {number} id - 작업지시서 ID
 * @param {object} updateData - 수정할 데이터
 * @returns {Promise<number>} 영향받은 행 수
 */
export const updateWorkOrder = async (id, updateData) => {
  const allowedFields = [
    'client_id',
    'classification_method',
    'confidence_score',
    'reasoning',
    'ocr_text',
    'work_date',
    'status',
    'api_cost_usd',
    'processing_time_ms',
  ];
  
  const updates = [];
  const params = [];

  // 허용된 필드만 업데이트
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (updates.length === 0) {
    logger.warn('수정할 필드가 없습니다', { id });
    return 0;
  }

  params.push(id);
  const sql = `UPDATE work_orders SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

  const affectedRows = await execute(sql, params);

  logger.info('작업지시서 수정 완료', {
    id,
    affectedRows,
    fields: Object.keys(updateData),
  });

  return affectedRows;
};

/**
 * 작업지시서 삭제 (소프트 삭제)
 * @param {number} id - 작업지시서 ID
 * @returns {Promise<number>} 영향받은 행 수
 */
export const deleteWorkOrder = async (id) => {
  const sql = 'UPDATE work_orders SET status = ? WHERE id = ?';
  const affectedRows = await execute(sql, ['deleted', id]);

  logger.info('작업지시서 삭제 완료', {
    id,
    affectedRows,
  });

  return affectedRows;
};

/**
 * 작업지시서 통계 조회
 * @returns {Promise<object>} 통계 정보
 */
export const getWorkOrderStats = async () => {
  const sql = `
    SELECT 
      COUNT(*) AS total_orders,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
      SUM(CASE WHEN status = 'classified' THEN 1 ELSE 0 END) AS classified_orders,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_orders,
      AVG(confidence_score) AS avg_confidence,
      SUM(api_cost_usd) AS total_api_cost,
      AVG(processing_time_ms) AS avg_processing_time
    FROM work_orders
    WHERE status != 'deleted'
  `;

  const stats = await queryOne(sql);
  return stats;
};

/**
 * 거래처별 작업지시서 통계
 * @param {number} clientId - 거래처 ID
 * @returns {Promise<object>} 거래처별 통계
 */
export const getWorkOrderStatsByClient = async (clientId) => {
  const sql = `
    SELECT 
      COUNT(*) AS total_orders,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
      SUM(CASE WHEN status = 'classified' THEN 1 ELSE 0 END) AS classified_orders,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
      AVG(confidence_score) AS avg_confidence
    FROM work_orders
    WHERE client_id = ? AND status != 'deleted'
  `;

  const stats = await queryOne(sql, [clientId]);
  return stats;
};

/**
 * 최근 작업지시서 조회
 * @param {number} limit - 조회 개수 (기본: 10)
 * @returns {Promise<Array>} 작업지시서 목록
 */
export const getRecentWorkOrders = async (limit = 10) => {
  const sql = `
    SELECT 
      wo.*,
      c.code as client_code,
      c.name as client_name
    FROM work_orders wo
    LEFT JOIN clients c ON wo.client_id = c.id
    WHERE wo.status != 'deleted'
    ORDER BY wo.created_at DESC
    LIMIT ?
  `;

  return await query(sql, [limit]);
};
