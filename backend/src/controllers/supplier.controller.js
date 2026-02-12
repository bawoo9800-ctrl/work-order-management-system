/**
 * ========================================
 * 공급업체 컨트롤러 (Supplier Controller)
 * ========================================
 * 파일: src/controllers/supplier.controller.js
 * 설명: 공급업체 관련 HTTP 요청 처리
 * ========================================
 */

import * as SupplierModel from '../models/supplier.model.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/error.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

/**
 * 모든 공급업체 조회
 * GET /api/v1/suppliers
 */
export const getAllSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await SupplierModel.getAllSuppliers();

  res.json({
    success: true,
    data: suppliers,
    error: null,
  });
});

/**
 * ID로 공급업체 조회
 * GET /api/v1/suppliers/:id
 */
export const getSupplierById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const supplier = await SupplierModel.getSupplierById(parseInt(id));

  if (!supplier) {
    throw new AppError('공급업체를 찾을 수 없습니다.', 404);
  }

  res.json({
    success: true,
    data: supplier,
    error: null,
  });
});

/**
 * 공급업체 생성
 * POST /api/v1/suppliers
 * Body: name (필수), contact_person, phone, email, address, business_number, memo
 */
export const createSupplier = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    throw new AppError('공급업체명은 필수입니다.', 400);
  }

  // 중복 체크
  const existing = await SupplierModel.getSupplierByName(name.trim());
  if (existing) {
    throw new AppError('이미 등록된 공급업체입니다.', 409);
  }

  const supplierId = await SupplierModel.createSupplier(req.body);

  // 생성된 공급업체 조회
  const supplier = await SupplierModel.getSupplierById(supplierId);

  res.status(201).json({
    success: true,
    data: supplier,
    error: null,
  });

  logger.info(`공급업체 생성 완료: ID ${supplierId}, 이름 ${name}`);
});

/**
 * 공급업체 수정
 * PUT /api/v1/suppliers/:id
 * Body: name, contact_person, phone, email, address, business_number, memo, is_active
 */
export const updateSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 공급업체 존재 확인
  const supplier = await SupplierModel.getSupplierById(parseInt(id));
  if (!supplier) {
    throw new AppError('공급업체를 찾을 수 없습니다.', 404);
  }

  // 이름 변경 시 중복 체크
  if (req.body.name && req.body.name.trim() !== supplier.name) {
    const existing = await SupplierModel.getSupplierByName(req.body.name.trim());
    if (existing) {
      throw new AppError('이미 등록된 공급업체명입니다.', 409);
    }
  }

  // 수정
  const success = await SupplierModel.updateSupplier(parseInt(id), req.body);

  if (!success) {
    throw new AppError('공급업체 수정에 실패했습니다.', 500);
  }

  // 수정된 데이터 재조회
  const updated = await SupplierModel.getSupplierById(parseInt(id));

  res.json({
    success: true,
    data: updated,
    error: null,
  });

  logger.info(`공급업체 수정 완료: ID ${id}`);
});

/**
 * 공급업체 삭제 (비활성화)
 * DELETE /api/v1/suppliers/:id
 */
export const deleteSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 공급업체 존재 확인
  const supplier = await SupplierModel.getSupplierById(parseInt(id));
  if (!supplier) {
    throw new AppError('공급업체를 찾을 수 없습니다.', 404);
  }

  // 삭제 (비활성화)
  const success = await SupplierModel.deleteSupplier(parseInt(id));

  if (!success) {
    throw new AppError('공급업체 삭제에 실패했습니다.', 500);
  }

  res.json({
    success: true,
    data: { id: parseInt(id), message: '공급업체가 비활성화되었습니다.' },
    error: null,
  });

  logger.info(`공급업체 비활성화 완료: ID ${id}`);
});

/**
 * 공급업체 검색 (자동완성)
 * GET /api/v1/suppliers/search
 * Query: q (검색 키워드), limit (결과 제한, 기본 10)
 */
export const searchSuppliers = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q || q.trim().length === 0) {
    return res.json({
      success: true,
      data: [],
      error: null,
    });
  }

  const suppliers = await SupplierModel.searchSuppliers(q.trim(), parseInt(limit));

  res.json({
    success: true,
    data: suppliers,
    error: null,
  });
});

export default {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  searchSuppliers,
};
