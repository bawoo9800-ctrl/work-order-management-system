/**
 * ========================================
 * 발주처 라우트 (Supplier/Vendor Routes)
 * ========================================
 * 파일: src/routes/supplier.routes.js
 * 설명: 발주처 관련 API 엔드포인트
 * ========================================
 */

import express from 'express';
import * as supplierController from '../controllers/supplier.controller.js';

const router = express.Router();

/**
 * GET /api/v1/suppliers/search
 * 발주처 검색 (자동완성)
 */
router.get('/search', supplierController.searchSuppliers);

/**
 * GET /api/v1/suppliers
 * 모든 발주처 조회
 */
router.get('/', supplierController.getAllSuppliers);

/**
 * GET /api/v1/suppliers/:id
 * ID로 발주처 조회
 */
router.get('/:id', supplierController.getSupplierById);

/**
 * POST /api/v1/suppliers
 * 발주처 생성
 */
router.post('/', supplierController.createSupplier);

/**
 * PUT /api/v1/suppliers/:id
 * 발주처 수정
 */
router.put('/:id', supplierController.updateSupplier);

/**
 * DELETE /api/v1/suppliers/:id
 * 발주처 삭제 (비활성화)
 */
router.delete('/:id', supplierController.deleteSupplier);

export default router;
