/**
 * ========================================
 * 발주서 컨트롤러 (Purchase Order Controller)
 * ========================================
 * 파일: src/controllers/purchaseOrder.controller.js
 * 설명: 발주서 관련 HTTP 요청 처리
 *       - 이미지 업로드
 *       - OCR 처리
 *       - CRUD 작업
 * ========================================
 */

import { v4 as uuidv4 } from 'uuid';
import * as PurchaseOrderModel from '../models/purchaseOrder.model.js';
import * as imageProcessor from '../utils/imageProcessor.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/error.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

/**
 * 발주서 업로드 및 처리 (다중 이미지 지원)
 * POST /api/v1/purchase-orders/upload
 * Body: supplierName (선택), orderDate (선택), uploadedBy (필수)
 * Files: images[] (다중 이미지)
 */
export const uploadPurchaseOrder = asyncHandler(async (req, res) => {
  const startTime = Date.now();

  // 1) 파일 검증
  const files = req.files || (req.file ? [req.file] : []);
  
  if (files.length === 0) {
    throw new AppError('이미지 파일이 필요합니다.', 400);
  }
  
  // 수동 입력 필드
  const { supplierName, orderDate, orderAmount, memo, uploadedBy } = req.body;
  
  // 필수 필드 검증
  if (!uploadedBy || !uploadedBy.trim()) {
    throw new AppError('전송자명은 필수입니다.', 400);
  }

  logger.info(`발주서 업로드 시작: ${files.length}장`, {
    fileCount: files.length,
    supplierName: supplierName || '(없음)',
    orderDate: orderDate || '(없음)',
    uploadedBy: uploadedBy.trim(),
  });

  try {
    // 2) 모든 이미지 처리 및 저장 (purchase_orders 폴더에 저장)
    const imageResults = [];
    
    for (const file of files) {
      // imageProcessor.processAndSaveImage는 기본적으로 unclassified에 저장
      // 발주서는 별도 폴더에 저장하려면 경로 수정 필요
      const imageResult = await imageProcessor.processAndSaveImage(file.buffer, file.originalname, 'purchase_orders');
      imageResults.push(imageResult);
    }

    // 3) 첫 번째 이미지로 발주서 생성
    const firstImage = imageResults[0];
    
    // images 필드: 여러 이미지 경로를 JSON 배열로 저장
    const imagesJson = imageResults.map(img => ({
      path: img.storagePath,
      uuid: img.uuid,
      filename: img.originalFilename,
      file_size: img.fileSize,
      mime_type: img.mimeType,
      width: img.imageWidth,
      height: img.imageHeight,
    }));

    const purchaseOrderData = {
      uuid: firstImage.uuid,
      original_filename: firstImage.originalFilename,
      storage_path: firstImage.storagePath,
      file_size: firstImage.fileSize,
      mime_type: firstImage.mimeType,
      image_width: firstImage.imageWidth,
      image_height: firstImage.imageHeight,
      images: imagesJson,
      image_count: imageResults.length,
      supplier_id: null,
      supplier_name: supplierName?.trim() || null,
      order_date: orderDate || null,
      order_amount: orderAmount ? parseFloat(orderAmount) : null,
      currency: 'KRW',
      status: 'pending',
      priority: 'normal',
      memo: memo?.trim() || null,
      classification_method: 'manual',
      api_cost_usd: 0,
      processing_time_ms: Date.now() - startTime,
      uploaded_by: uploadedBy.trim(),
      uploaded_from: 'web',
    };

    logger.info('📝 발주서 DB 저장 데이터:', {
      uuid: purchaseOrderData.uuid,
      uploaded_by: purchaseOrderData.uploaded_by,
      supplier_name: purchaseOrderData.supplier_name,
      imageCount: imageResults.length,
    });

    const purchaseOrderId = await PurchaseOrderModel.createPurchaseOrder(purchaseOrderData);

    // 4) 응답
    res.status(201).json({
      success: true,
      data: {
        id: purchaseOrderId,
        uuid: firstImage.uuid,
        originalFilename: firstImage.originalFilename,
        supplierName: supplierName?.trim() || null,
        orderDate: orderDate || null,
        uploadedBy: uploadedBy.trim(),
        imageCount: imageResults.length,
        processingTimeMs: Date.now() - startTime,
      },
      error: null,
    });

    logger.info('발주서 생성 완료', {
      purchaseOrderId,
      uuid: firstImage.uuid,
      imageCount: imageResults.length,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('발주서 업로드 실패:', {
      error: error.message,
      stack: error.stack,
    });

    // 에러 시 업로드된 이미지 정리는 나중에 구현
    throw error;
  }
});

/**
 * 모든 발주서 조회
 * GET /api/v1/purchase-orders
 * Query: page, limit, supplierId, status, startDate, endDate
 */
export const getAllPurchaseOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 1000 } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    supplierId: req.query.supplierId ? parseInt(req.query.supplierId) : undefined,
    status: req.query.status,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
  };

  const result = await PurchaseOrderModel.getAllPurchaseOrders(options);

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    error: null,
  });
});

/**
 * ID로 발주서 조회
 * GET /api/v1/purchase-orders/:id
 */
export const getPurchaseOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const purchaseOrder = await PurchaseOrderModel.getPurchaseOrderById(parseInt(id));

  if (!purchaseOrder) {
    throw new AppError('발주서를 찾을 수 없습니다.', 404);
  }

  res.json({
    success: true,
    data: purchaseOrder,
    error: null,
  });
});

/**
 * 발주서 수정
 * PUT /api/v1/purchase-orders/:id
 * Body: supplierName, orderDate, deliveryDate, orderAmount, status, priority, memo, etc.
 */
export const updatePurchaseOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // 발주서 존재 확인
  const purchaseOrder = await PurchaseOrderModel.getPurchaseOrderById(parseInt(id));
  if (!purchaseOrder) {
    throw new AppError('발주서를 찾을 수 없습니다.', 404);
  }

  // 수정
  const success = await PurchaseOrderModel.updatePurchaseOrder(parseInt(id), updateData);

  if (!success) {
    throw new AppError('발주서 수정에 실패했습니다.', 500);
  }

  // 수정된 데이터 재조회
  const updated = await PurchaseOrderModel.getPurchaseOrderById(parseInt(id));

  res.json({
    success: true,
    data: updated,
    error: null,
  });

  logger.info(`발주서 수정 완료: ID ${id}`);
});

/**
 * 발주서 삭제 (상태를 'cancelled'로 변경)
 * DELETE /api/v1/purchase-orders/:id
 */
export const deletePurchaseOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 발주서 존재 확인
  const purchaseOrder = await PurchaseOrderModel.getPurchaseOrderById(parseInt(id));
  if (!purchaseOrder) {
    throw new AppError('발주서를 찾을 수 없습니다.', 404);
  }

  // 삭제 (상태를 cancelled로 변경)
  const success = await PurchaseOrderModel.deletePurchaseOrder(parseInt(id));

  if (!success) {
    throw new AppError('발주서 삭제에 실패했습니다.', 500);
  }

  res.json({
    success: true,
    data: { id: parseInt(id), message: '발주서가 취소되었습니다.' },
    error: null,
  });

  logger.info(`발주서 취소 완료: ID ${id}`);
});

/**
 * 발주서 통계
 * GET /api/v1/purchase-orders/stats
 */
export const getPurchaseOrderStats = asyncHandler(async (req, res) => {
  const stats = await PurchaseOrderModel.getPurchaseOrderStats();

  res.json({
    success: true,
    data: stats,
    error: null,
  });
});

/**
 * 공급업체별 발주 통계
 * GET /api/v1/purchase-orders/stats/by-supplier
 * Query: startDate, endDate
 */
export const getPurchaseOrdersBySupplier = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const stats = await PurchaseOrderModel.getPurchaseOrdersBySupplier({
    startDate,
    endDate,
  });

  res.json({
    success: true,
    data: stats,
    error: null,
  });
});

export default {
  uploadPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderStats,
  getPurchaseOrdersBySupplier,
};
