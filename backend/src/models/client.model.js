/**
 * ========================================
 * 거래처 모델 (Client Model)
 * ========================================
 * 파일: src/models/client.model.js
 * 설명: 거래처 데이터베이스 조작 함수
 *       - CRUD 작업
 *       - 키워드 기반 검색
 *       - 활성 거래처 조회
 * ========================================
 */

import { query, queryOne, insert, execute } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * 모든 거래처 조회
 * @param {boolean} activeOnly - 활성 거래처만 조회 (기본: true)
 * @returns {Promise<Array>} 거래처 목록
 */
export const getAllClients = async (activeOnly = true) => {
  const sql = activeOnly
    ? 'SELECT * FROM clients WHERE is_active = 1 ORDER BY priority ASC, name ASC'
    : 'SELECT * FROM clients ORDER BY priority ASC, name ASC';
  
  const clients = await query(sql);
  
  // JSON 필드 파싱
  return clients.map(client => ({
    ...client,
    keywords: JSON.parse(client.keywords),
    aliases: JSON.parse(client.aliases),
    contact_info: client.contact_info ? JSON.parse(client.contact_info) : null,
  }));
};

/**
 * ID로 거래처 조회
 * @param {number} id - 거래처 ID
 * @returns {Promise<object|null>} 거래처 정보
 */
export const getClientById = async (id) => {
  const sql = 'SELECT * FROM clients WHERE id = ?';
  const client = await queryOne(sql, [id]);
  
  if (!client) return null;
  
  // JSON 필드 파싱
  return {
    ...client,
    keywords: JSON.parse(client.keywords),
    aliases: JSON.parse(client.aliases),
    contact_info: client.contact_info ? JSON.parse(client.contact_info) : null,
  };
};

/**
 * 코드로 거래처 조회
 * @param {string} code - 거래처 코드
 * @returns {Promise<object|null>} 거래처 정보
 */
export const getClientByCode = async (code) => {
  const sql = 'SELECT * FROM clients WHERE code = ?';
  const client = await queryOne(sql, [code]);
  
  if (!client) return null;
  
  return {
    ...client,
    keywords: JSON.parse(client.keywords),
    aliases: JSON.parse(client.aliases),
    contact_info: client.contact_info ? JSON.parse(client.contact_info) : null,
  };
};

/**
 * 거래처 생성
 * @param {object} clientData - 거래처 데이터
 * @param {string} clientData.code - 거래처 코드
 * @param {string} clientData.name - 거래처 명칭
 * @param {Array} clientData.keywords - 키워드 배열
 * @param {Array} clientData.aliases - 별칭 배열
 * @param {object} clientData.contact_info - 연락처 정보
 * @param {number} clientData.priority - 우선순위
 * @param {string} clientData.notes - 비고
 * @returns {Promise<number>} 생성된 거래처 ID
 */
export const createClient = async (clientData) => {
  const {
    code,
    name,
    keywords = [],
    aliases = [],
    contact_info = null,
    priority = 100,
    notes = null,
  } = clientData;
  
  const sql = `
    INSERT INTO clients (code, name, keywords, aliases, contact_info, priority, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    code,
    name,
    JSON.stringify(keywords),
    JSON.stringify(aliases),
    contact_info ? JSON.stringify(contact_info) : null,
    priority,
    notes,
  ];
  
  const clientId = await insert(sql, params);
  
  logger.info('거래처 생성 완료', {
    clientId,
    code,
    name,
  });
  
  return clientId;
};

/**
 * 거래처 수정
 * @param {number} id - 거래처 ID
 * @param {object} updateData - 수정할 데이터
 * @returns {Promise<number>} 영향받은 행 수
 */
export const updateClient = async (id, updateData) => {
  const allowedFields = ['name', 'keywords', 'aliases', 'contact_info', 'is_active', 'priority', 'notes'];
  const updates = [];
  const params = [];
  
  // 허용된 필드만 업데이트
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      
      // JSON 필드는 문자열로 변환
      if (['keywords', 'aliases', 'contact_info'].includes(key)) {
        params.push(value ? JSON.stringify(value) : null);
      } else {
        params.push(value);
      }
    }
  }
  
  if (updates.length === 0) {
    logger.warn('수정할 필드가 없습니다', { id });
    return 0;
  }
  
  params.push(id);
  const sql = `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`;
  
  const affectedRows = await execute(sql, params);
  
  logger.info('거래처 수정 완료', {
    id,
    affectedRows,
    fields: Object.keys(updateData),
  });
  
  return affectedRows;
};

/**
 * 거래처 삭제 (소프트 삭제 - is_active = 0)
 * @param {number} id - 거래처 ID
 * @returns {Promise<number>} 영향받은 행 수
 */
export const deleteClient = async (id) => {
  const sql = 'UPDATE clients SET is_active = 0 WHERE id = ?';
  const affectedRows = await execute(sql, [id]);
  
  logger.info('거래처 비활성화 완료', {
    id,
    affectedRows,
  });
  
  return affectedRows;
};

/**
 * 거래처 영구 삭제 (하드 삭제)
 * @param {number} id - 거래처 ID
 * @returns {Promise<number>} 영향받은 행 수
 */
export const hardDeleteClient = async (id) => {
  const sql = 'DELETE FROM clients WHERE id = ?';
  const affectedRows = await execute(sql, [id]);
  
  logger.warn('거래처 영구 삭제 완료', {
    id,
    affectedRows,
  });
  
  return affectedRows;
};

/**
 * 키워드 기반 거래처 검색
 * @param {string} searchText - 검색 텍스트 (OCR 결과 등)
 * @returns {Promise<Array>} 매칭된 거래처 목록 (신뢰도 순)
 */
export const searchClientsByKeywords = async (searchText) => {
  const clients = await getAllClients(true);
  const results = [];
  
  for (const client of clients) {
    let matchCount = 0;
    const matchedKeywords = [];
    
    // 각 키워드와 매칭 확인
    for (const keyword of client.keywords) {
      if (searchText.includes(keyword)) {
        matchCount++;
        matchedKeywords.push(keyword);
      }
    }
    
    // 매칭된 키워드가 있으면 결과에 추가
    if (matchCount > 0) {
      const confidence = matchCount / client.keywords.length;
      results.push({
        ...client,
        matchCount,
        matchedKeywords,
        confidence,
      });
    }
  }
  
  // 신뢰도 순으로 정렬
  results.sort((a, b) => b.confidence - a.confidence);
  
  logger.debug('키워드 기반 거래처 검색', {
    searchTextLength: searchText.length,
    resultsCount: results.length,
    topMatch: results[0] ? { name: results[0].name, confidence: results[0].confidence } : null,
  });
  
  return results;
};

/**
 * 거래처 통계 조회
 * @returns {Promise<object>} 통계 정보
 */
export const getClientStats = async () => {
  const sql = `
    SELECT 
      COUNT(*) AS total_clients,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_clients,
      SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive_clients
    FROM clients
  `;
  
  const stats = await queryOne(sql);
  return stats;
};

/**
 * 거래처 검색 (이름/코드로 검색)
 * @param {string} searchTerm - 검색어
 * @returns {Promise<Array>} 거래처 목록
 */
export const searchClients = async (searchTerm) => {
  const sql = `
    SELECT * FROM clients 
    WHERE is_active = 1 
      AND (name LIKE ? OR code LIKE ?)
    ORDER BY priority ASC, name ASC
    LIMIT 20
  `;
  
  const searchPattern = `%${searchTerm}%`;
  const clients = await query(sql, [searchPattern, searchPattern]);
  
  // JSON 필드 파싱
  return clients.map(client => ({
    ...client,
    keywords: JSON.parse(client.keywords),
    aliases: JSON.parse(client.aliases),
    contact_info: client.contact_info ? JSON.parse(client.contact_info) : null,
  }));
};

/**
 * 모든 거래처 삭제 (하드 삭제)
 * @returns {Promise<number>} 삭제된 행 수
 */
export const deleteAllClients = async () => {
  const sql = 'DELETE FROM clients';
  const affectedRows = await execute(sql);
  
  logger.warn('모든 거래처 삭제 완료', {
    affectedRows,
  });
  
  return affectedRows;
};

/**
 * 거래처 일괄 등록
 * @param {Array} clients - 거래처 배열
 * @returns {Promise<number>} 등록된 행 수
 */
export const bulkCreateClients = async (clients) => {
  if (clients.length === 0) return 0;
  
  // VALUES 절 생성
  const values = clients
    .map(
      client =>
        `(${[
          `'${client.code.replace(/'/g, "''")}'`,
          `'${client.name.replace(/'/g, "''")}'`,
          `'${JSON.stringify(client.keywords).replace(/'/g, "''")}'`,
          `'${JSON.stringify(client.aliases).replace(/'/g, "''")}'`,
          client.contact_info ? `'${JSON.stringify(client.contact_info).replace(/'/g, "''")}'` : 'NULL',
          client.priority,
          client.notes ? `'${client.notes.replace(/'/g, "''")}'` : 'NULL',
        ].join(', ')})`
    )
    .join(', ');
  
  const sql = `
    INSERT INTO clients (code, name, keywords, aliases, contact_info, priority, notes)
    VALUES ${values}
  `;
  
  const affectedRows = await execute(sql);
  
  logger.info('거래처 일괄 등록 완료', {
    count: clients.length,
    affectedRows,
  });
  
  return affectedRows;
};
