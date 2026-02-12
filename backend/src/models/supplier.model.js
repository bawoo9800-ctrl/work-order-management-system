/**
 * ========================================
 * 공급업체 모델 (Supplier Model)
 * ========================================
 * 파일: src/models/supplier.model.js
 * 설명: 공급업체 데이터베이스 조작 함수
 * ========================================
 */

import { query, queryOne, insert, execute } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * 모든 활성 공급업체 조회
 * @returns {Promise<array>} 공급업체 목록
 */
export const getAllSuppliers = async () => {
  const sql = `
    SELECT *
    FROM suppliers
    WHERE is_active = 1
    ORDER BY name ASC
  `;
  return await query(sql);
};

/**
 * ID로 공급업체 조회
 * @param {number} id - 공급업체 ID
 * @returns {Promise<object|null>} 공급업체 정보
 */
export const getSupplierById = async (id) => {
  const sql = `SELECT * FROM suppliers WHERE id = ?`;
  return await queryOne(sql, [id]);
};

/**
 * 이름으로 공급업체 조회
 * @param {string} name - 공급업체명
 * @returns {Promise<object|null>} 공급업체 정보
 */
export const getSupplierByName = async (name) => {
  const sql = `SELECT * FROM suppliers WHERE name = ?`;
  return await queryOne(sql, [name]);
};

/**
 * 공급업체 생성
 * @param {object} supplierData - 공급업체 데이터
 * @returns {Promise<number>} 생성된 공급업체 ID
 */
export const createSupplier = async (supplierData) => {
  const {
    name,
    contact_person = null,
    phone = null,
    email = null,
    address = null,
    business_number = null,
    memo = null,
    is_active = 1,
  } = supplierData;

  const sql = `
    INSERT INTO suppliers (
      name, contact_person, phone, email,
      address, business_number, memo, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    name,
    contact_person,
    phone,
    email,
    address,
    business_number,
    memo,
    is_active,
  ];

  const result = await insert(sql, params);
  logger.info(`공급업체 생성: ID ${result.insertId}, 이름 ${name}`);
  return result.insertId;
};

/**
 * 공급업체 수정
 * @param {number} id - 공급업체 ID
 * @param {object} updateData - 수정할 데이터
 * @returns {Promise<boolean>} 성공 여부
 */
export const updateSupplier = async (id, updateData) => {
  const allowedFields = [
    'name',
    'contact_person',
    'phone',
    'email',
    'address',
    'business_number',
    'memo',
    'is_active',
  ];

  const updates = [];
  const params = [];

  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (updates.length === 0) {
    logger.warn(`공급업체 수정 실패: 수정 가능한 필드 없음 (ID: ${id})`);
    return false;
  }

  params.push(id);

  const sql = `
    UPDATE suppliers
    SET ${updates.join(', ')}
    WHERE id = ?
  `;

  const result = await execute(sql, params);
  logger.info(`공급업체 수정: ID ${id}, 영향받은 행: ${result.affectedRows}`);
  return result.affectedRows > 0;
};

/**
 * 공급업체 삭제 (비활성화)
 * @param {number} id - 공급업체 ID
 * @returns {Promise<boolean>} 성공 여부
 */
export const deleteSupplier = async (id) => {
  const sql = `
    UPDATE suppliers
    SET is_active = 0
    WHERE id = ?
  `;

  const result = await execute(sql, [id]);
  logger.info(`공급업체 비활성화: ID ${id}, 영향받은 행: ${result.affectedRows}`);
  return result.affectedRows > 0;
};

/**
 * 공급업체 자동완성 검색
 * @param {string} keyword - 검색 키워드
 * @param {number} limit - 결과 제한 (기본: 10)
 * @returns {Promise<array>} 공급업체 목록
 */
export const searchSuppliers = async (keyword, limit = 10) => {
  const sql = `
    SELECT id, name, contact_person, phone
    FROM suppliers
    WHERE is_active = 1
      AND (name LIKE ? OR contact_person LIKE ?)
    ORDER BY name ASC
    LIMIT ?
  `;

  const searchPattern = `%${keyword}%`;
  return await query(sql, [searchPattern, searchPattern, limit]);
};

export default {
  getAllSuppliers,
  getSupplierById,
  getSupplierByName,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  searchSuppliers,
};
