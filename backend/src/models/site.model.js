/**
 * ========================================
 * 현장 모델 (Site Model)
 * ========================================
 * 파일: src/models/site.model.js
 * 설명: 현장 마스터 데이터 관리
 * ========================================
 */

import { query, queryOne, insert, execute } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * 모든 현장 조회
 * @param {number} clientId - 거래처 ID (선택)
 * @param {boolean} activeOnly - 활성 현장만 조회
 * @returns {Promise<Array>} 현장 목록
 */
export const getAllSites = async (clientId = null, activeOnly = true) => {
  let sql = `
    SELECT 
      s.*,
      c.name as client_name,
      c.code as client_code
    FROM sites s
    INNER JOIN clients c ON s.client_id = c.id
  `;
  
  const conditions = [];
  const params = [];
  
  if (clientId) {
    conditions.push('s.client_id = ?');
    params.push(clientId);
  }
  
  if (activeOnly) {
    conditions.push('s.is_active = 1');
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' ORDER BY s.name ASC';
  
  return await query(sql, params);
};

/**
 * 특정 현장 조회
 * @param {number} id - 현장 ID
 * @returns {Promise<object|null>} 현장 정보
 */
export const getSiteById = async (id) => {
  const sql = `
    SELECT 
      s.*,
      c.name as client_name,
      c.code as client_code
    FROM sites s
    INNER JOIN clients c ON s.client_id = c.id
    WHERE s.id = ?
  `;
  return await queryOne(sql, [id]);
};

/**
 * 현장명으로 조회
 * @param {number} clientId - 거래처 ID
 * @param {string} name - 현장명
 * @returns {Promise<object|null>} 현장 정보
 */
export const getSiteByName = async (clientId, name) => {
  const sql = `
    SELECT * FROM sites
    WHERE client_id = ? AND name = ?
  `;
  return await queryOne(sql, [clientId, name]);
};

/**
 * 현장 생성
 * @param {object} siteData - 현장 데이터
 * @returns {Promise<number>} 생성된 현장 ID
 */
export const createSite = async (siteData) => {
  const { client_id, name, address, manager, phone, memo } = siteData;
  
  const sql = `
    INSERT INTO sites (client_id, name, address, manager, phone, memo)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const siteId = await insert(sql, [
    client_id,
    name,
    address || null,
    manager || null,
    phone || null,
    memo || null,
  ]);
  
  logger.info('현장 생성 완료', {
    siteId,
    client_id,
    name,
  });
  
  return siteId;
};

/**
 * 현장 수정
 * @param {number} id - 현장 ID
 * @param {object} updateData - 수정할 데이터
 * @returns {Promise<boolean>} 성공 여부
 */
export const updateSite = async (id, updateData) => {
  const allowedFields = ['name', 'address', 'manager', 'phone', 'memo', 'is_active'];
  
  const updates = [];
  const params = [];
  
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  }
  
  if (updates.length === 0) {
    logger.warn(`현장 수정 실패: 수정 가능한 필드 없음 (ID: ${id})`);
    return false;
  }
  
  params.push(id);
  
  const sql = `
    UPDATE sites
    SET ${updates.join(', ')}
    WHERE id = ?
  `;
  
  const result = await execute(sql, params);
  logger.info(`현장 수정: ID ${id}, 영향받은 행: ${result.affectedRows}`);
  return result.affectedRows > 0;
};

/**
 * 현장 삭제 (소프트 삭제)
 * @param {number} id - 현장 ID
 * @returns {Promise<boolean>} 성공 여부
 */
export const deleteSite = async (id) => {
  const sql = `
    UPDATE sites
    SET is_active = 0
    WHERE id = ?
  `;
  
  const result = await execute(sql, [id]);
  logger.info(`현장 삭제(비활성화): ID ${id}, 영향받은 행: ${result.affectedRows}`);
  return result.affectedRows > 0;
};

/**
 * 현장 검색 (자동완성용)
 * @param {number} clientId - 거래처 ID
 * @param {string} searchTerm - 검색어
 * @param {number} limit - 결과 개수 제한
 * @returns {Promise<Array>} 현장 목록
 */
export const searchSites = async (clientId, searchTerm, limit = 10) => {
  const sql = `
    SELECT *
    FROM sites
    WHERE client_id = ? 
      AND name LIKE ?
      AND is_active = 1
    ORDER BY name ASC
    LIMIT ?
  `;
  
  return await query(sql, [clientId, `%${searchTerm}%`, limit]);
};

/**
 * 거래처의 현장 개수 조회
 * @param {number} clientId - 거래처 ID
 * @returns {Promise<number>} 현장 개수
 */
export const getSiteCountByClient = async (clientId) => {
  const sql = `
    SELECT COUNT(*) as count
    FROM sites
    WHERE client_id = ? AND is_active = 1
  `;
  const result = await queryOne(sql, [clientId]);
  return result?.count || 0;
};

/**
 * 현장 또는 생성 (upsert)
 * @param {number} clientId - 거래처 ID
 * @param {string} siteName - 현장명
 * @returns {Promise<number>} 현장 ID
 */
export const getOrCreateSite = async (clientId, siteName) => {
  // 기존 현장 확인
  let site = await getSiteByName(clientId, siteName);
  
  if (site) {
    return site.id;
  }
  
  // 없으면 생성
  const siteId = await createSite({
    client_id: clientId,
    name: siteName,
  });
  
  return siteId;
};
