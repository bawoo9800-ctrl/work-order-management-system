/**
 * ========================================
 * 발주서 모델 (Purchase Order Model)
 * ========================================
 * 파일: src/models/purchaseOrder.model.js
 * 설명: 발주서 데이터베이스 조작 함수
 *       - CRUD 작업
 *       - 이미지 메타데이터 관리
 *       - OCR 텍스트 저장
 *       - 분류 결과 관리
 * ========================================
 */

import { query, queryOne, insert, execute } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * 모든 발주서 조회 (페이징)
 * @param {object} options - 조회 옵션
 * @param {number} options.page - 페이지 번호 (기본: 1)
 * @param {number} options.limit - 페이지당 개수 (기본: 1000)
 * @param {number} options.supplierId - 공급업체 ID 필터 (선택)
 * @param {string} options.status - 상태 필터 (선택)
 * @param {string} options.startDate - 시작일 (선택)
 * @param {string} options.endDate - 종료일 (선택)
 * @returns {Promise<object>} 발주서 목록 및 페이징 정보
 */
export const getAllPurchaseOrders = async (options = {}) => {
  const {
    page = 1,
    limit = 1000,
    supplierId,
    status,
    startDate,
    endDate,
  } = options;

  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  // 기본적으로 삭제된 항목 제외
  if (!status) {
    conditions.push("po.status != 'cancelled'");
  }

  // 필터 조건 추가
  if (supplierId) {
    conditions.push('(po.supplier_id = ? OR EXISTS (SELECT 1 FROM suppliers s WHERE s.id = ? AND po.supplier_name = s.name))');
    params.push(supplierId);
    params.push(supplierId);
  }

  if (status) {
    conditions.push('po.status = ?');
    params.push(status);
  }

  if (startDate) {
    conditions.push('DATE(po.order_date) >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('DATE(po.order_date) <= ?');
    params.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 총 개수 조회
  const countSql = `
    SELECT COUNT(*) as total
    FROM purchase_orders po
    ${whereClause}
  `;
  const { total } = await queryOne(countSql, params);

  // 데이터 조회
  const dataSql = `
    SELECT 
      po.id, po.uuid, po.original_filename, po.storage_path,
      po.file_size, po.mime_type, po.image_width, po.image_height,
      po.images, po.image_count,
      po.supplier_id,
      DATE_FORMAT(po.order_date, '%Y-%m-%d') as order_date,
      po.delivery_date, po.order_amount, po.currency,
      po.items, po.item_count,
      po.status, po.priority,
      po.ocr_text, po.classification_method, po.confidence_score, po.reasoning,
      po.memo, po.tags,
      po.api_cost_usd, po.processing_time_ms,
      po.uploaded_by, po.uploaded_from,
      po.created_at, po.updated_at,
      s.contact_person as supplier_contact_person,
      s.phone as supplier_phone,
      COALESCE(po.supplier_name, s.name) as supplier_name
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    ${whereClause}
    ORDER BY po.order_date DESC, po.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const purchaseOrders = await query(dataSql, [...params, limit, offset]);

  return {
    data: purchaseOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * ID로 발주서 조회
 * @param {number} id - 발주서 ID
 * @returns {Promise<object|null>} 발주서 정보
 */
export const getPurchaseOrderById = async (id) => {
  const sql = `
    SELECT 
      po.id, po.uuid, po.original_filename, po.storage_path,
      po.file_size, po.mime_type, po.image_width, po.image_height,
      po.images, po.image_count,
      po.supplier_id,
      DATE_FORMAT(po.order_date, '%Y-%m-%d') as order_date,
      po.delivery_date, po.order_amount, po.currency,
      po.items, po.item_count,
      po.status, po.priority,
      po.ocr_text, po.classification_method, po.confidence_score, po.reasoning,
      po.memo, po.tags,
      po.api_cost_usd, po.processing_time_ms,
      po.uploaded_by, po.uploaded_from,
      po.created_at, po.updated_at,
      s.contact_person as supplier_contact_person,
      s.phone as supplier_phone,
      s.email as supplier_email,
      COALESCE(po.supplier_name, s.name) as supplier_name
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    WHERE po.id = ?
  `;
  return await queryOne(sql, [id]);
};

/**
 * UUID로 발주서 조회
 * @param {string} uuid - 발주서 UUID
 * @returns {Promise<object|null>} 발주서 정보
 */
export const getPurchaseOrderByUuid = async (uuid) => {
  const sql = `
    SELECT 
      po.id, po.uuid, po.original_filename, po.storage_path,
      po.file_size, po.mime_type, po.image_width, po.image_height,
      po.images, po.image_count,
      po.supplier_id,
      DATE_FORMAT(po.order_date, '%Y-%m-%d') as order_date,
      po.delivery_date, po.order_amount, po.currency,
      po.items, po.item_count,
      po.status, po.priority,
      po.ocr_text, po.classification_method, po.confidence_score, po.reasoning,
      po.memo, po.tags,
      po.api_cost_usd, po.processing_time_ms,
      po.uploaded_by, po.uploaded_from,
      po.created_at, po.updated_at,
      s.contact_person as supplier_contact_person,
      s.phone as supplier_phone,
      COALESCE(po.supplier_name, s.name) as supplier_name
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    WHERE po.uuid = ?
  `;
  return await queryOne(sql, [uuid]);
};

/**
 * 발주서 생성
 * @param {object} purchaseOrderData - 발주서 데이터
 * @returns {Promise<number>} 생성된 발주서 ID
 */
export const createPurchaseOrder = async (purchaseOrderData) => {
  const {
    uuid,
    original_filename,
    storage_path = null,
    images = null,
    image_count = 1,
    file_size = null,
    mime_type = null,
    image_width = null,
    image_height = null,
    supplier_id = null,
    supplier_name = null,
    site_name = null,
    supplier_contact = null,
    order_date = null,
    delivery_date = null,
    order_amount = null,
    currency = 'KRW',
    items = null,
    item_count = 0,
    status = 'pending',
    priority = 'normal',
    ocr_text = null,
    classification_method = 'pending',
    confidence_score = null,
    reasoning = null,
    memo = null,
    tags = null,
    api_cost_usd = 0,
    processing_time_ms = 0,
    uploaded_by = null,
    uploaded_from = null,
  } = purchaseOrderData;

  const sql = `
    INSERT INTO purchase_orders (
      uuid, original_filename, storage_path, images, image_count,
      file_size, mime_type, image_width, image_height,
      supplier_id, supplier_name, site_name, supplier_contact,
      order_date, delivery_date, order_amount, currency,
      items, item_count,
      status, priority,
      ocr_text, classification_method, confidence_score, reasoning,
      memo, tags,
      api_cost_usd, processing_time_ms,
      uploaded_by, uploaded_from
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      ?, ?,
      ?, ?
    )
  `;

  const params = [
    uuid, original_filename, storage_path, 
    images ? JSON.stringify(images) : null, 
    image_count,
    file_size, mime_type, image_width, image_height,
    supplier_id, supplier_name, site_name, supplier_contact,
    order_date, delivery_date, order_amount, currency,
    items ? JSON.stringify(items) : null,
    item_count,
    status, priority,
    ocr_text, classification_method, confidence_score, reasoning,
    memo,
    tags ? JSON.stringify(tags) : null,
    api_cost_usd, processing_time_ms,
    uploaded_by, uploaded_from,
  ];

  const result = await insert(sql, params);
  logger.info(`발주서 생성: ID ${result.insertId}, UUID ${uuid}`);
  return result.insertId;
};

/**
 * 발주서 수정
 * @param {number} id - 발주서 ID
 * @param {object} updateData - 수정할 데이터
 * @returns {Promise<boolean>} 성공 여부
 */
export const updatePurchaseOrder = async (id, updateData) => {
  const allowedFields = [
    'supplier_id', 'supplier_name', 'supplier_contact', 'site_name',
    'order_date', 'delivery_date', 'order_amount', 'currency',
    'items', 'item_count',
    'status', 'priority',
    'ocr_text', 'classification_method', 'confidence_score', 'reasoning',
    'memo', 'tags',
    'images', 'image_count',
  ];

  const updates = [];
  const params = [];

  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      // JSON 필드 처리
      if (['images', 'items', 'tags'].includes(key) && value !== null) {
        params.push(JSON.stringify(value));
      } else {
        params.push(value);
      }
    }
  }

  if (updates.length === 0) {
    logger.warn(`발주서 수정 실패: 수정 가능한 필드 없음 (ID: ${id})`);
    return false;
  }

  params.push(id);

  const sql = `
    UPDATE purchase_orders
    SET ${updates.join(', ')}
    WHERE id = ?
  `;

  const result = await execute(sql, params);
  logger.info(`발주서 수정: ID ${id}, 영향받은 행: ${result.affectedRows}`);
  return result.affectedRows > 0;
};

/**
 * 발주서 삭제 (상태를 'cancelled'로 변경)
 * @param {number} id - 발주서 ID
 * @returns {Promise<boolean>} 성공 여부
 */
export const deletePurchaseOrder = async (id) => {
  const sql = `
    UPDATE purchase_orders
    SET status = 'cancelled'
    WHERE id = ?
  `;

  const result = await execute(sql, [id]);
  logger.info(`발주서 삭제(취소): ID ${id}, 영향받은 행: ${result.affectedRows}`);
  return result.affectedRows > 0;
};

/**
 * 발주서 통계 조회
 * @returns {Promise<object>} 발주서 통계
 */
export const getPurchaseOrderStats = async () => {
  const sql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
      SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
      SUM(order_amount) as total_amount,
      AVG(order_amount) as avg_amount
    FROM purchase_orders
    WHERE status != 'cancelled'
  `;

  return await queryOne(sql);
};

/**
 * 공급업체별 발주 통계
 * @param {object} options - 옵션
 * @returns {Promise<array>} 공급업체별 통계
 */
export const getPurchaseOrdersBySupplier = async (options = {}) => {
  const { startDate, endDate } = options;
  const conditions = ["po.status != 'cancelled'"];
  const params = [];

  if (startDate) {
    conditions.push('DATE(po.order_date) >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('DATE(po.order_date) <= ?');
    params.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      COALESCE(po.supplier_name, s.name, '미지정') as supplier_name,
      COUNT(*) as order_count,
      SUM(po.order_amount) as total_amount,
      AVG(po.order_amount) as avg_amount,
      MAX(po.order_date) as last_order_date
    FROM purchase_orders po
    LEFT JOIN suppliers s ON po.supplier_id = s.id
    ${whereClause}
    GROUP BY supplier_name
    ORDER BY total_amount DESC
    LIMIT 20
  `;

  return await query(sql, params);
};

export default {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  getPurchaseOrderByUuid,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderStats,
  getPurchaseOrdersBySupplier,
};
