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
 * Body: vendorName (선택), siteName (선택), orderDate (선택), memo (선택), uploadedBy (필수)
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
  const { vendorName, siteName, orderDate, memo, uploadedBy } = req.body;
  
  // 필수 필드 검증
  if (!uploadedBy || !uploadedBy.trim()) {
    throw new AppError('전송자명은 필수입니다.', 400);
  }

  logger.info(`발주서 업로드 시작: ${files.length}장`, {
    fileCount: files.length,
    vendorName: vendorName || '(없음)',
    siteName: siteName || '(없음)',
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
      supplier_name: vendorName?.trim() || null,
      site_name: siteName?.trim() || null,
      order_date: orderDate || null,
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
        vendorName: vendorName?.trim() || null,
        siteName: siteName?.trim() || null,
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

/**
 * 발주서 이미지 회전 및 저장
 * POST /api/v1/purchase-orders/:id/rotate-image
 * Body: { image_path: string, rotation: number (90, 180, 270) }
 */
export const rotatePurchaseOrderImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { image_path, rotation } = req.body;

  if (!image_path) {
    throw new AppError('이미지 경로가 필요합니다.', 400);
  }

  if (![90, 180, 270, -90].includes(parseInt(rotation))) {
    throw new AppError('회전 각도는 90, 180, 270, -90만 가능합니다.', 400);
  }

  logger.info(`발주서 이미지 회전 시작: ID ${id}, 각도 ${rotation}°`);

  try {
    // Sharp를 사용하여 이미지 회전
    const sharp = (await import('sharp')).default;
    const fs = await import('fs');
    const path = await import('path');
    
    // 이미지 파일 경로 (NAS 경로 또는 로컬 경로)
    const storagePath = process.env.NAS_STORAGE_PATH || './uploads';
    const fullPath = path.join(storagePath, image_path);
    
    if (!fs.existsSync(fullPath)) {
      throw new AppError('이미지 파일을 찾을 수 없습니다.', 404);
    }

    // 이미지 회전
    await sharp(fullPath)
      .rotate(parseInt(rotation))
      .toFile(fullPath + '.tmp');

    // 원본 파일 교체
    fs.unlinkSync(fullPath);
    fs.renameSync(fullPath + '.tmp', fullPath);

    logger.info(`이미지 회전 완료: ${image_path}, ${rotation}°`);

    res.json({
      success: true,
      data: { message: '이미지가 회전되어 저장되었습니다.', image_path },
      error: null,
    });
  } catch (error) {
    logger.error(`이미지 회전 실패: ${error.message}`);
    throw new AppError('이미지 회전에 실패했습니다: ' + error.message, 500);
  }
});

/**
 * 발주서에 추가 이미지 업로드
 * POST /api/v1/purchase-orders/:id/add-images
 * Files: images[] (다중 이미지)
 */
export const addImagesToPurchaseOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const startTime = Date.now();

  // 파일 검증 (다중 또는 단일)
  const files = req.files || (req.file ? [req.file] : []);
  
  if (files.length === 0) {
    throw new AppError('이미지 파일이 필요합니다.', 400);
  }

  logger.info(`발주서 추가 이미지 업로드 시작: ${files.length}장`, {
    purchaseOrderId: id,
    fileCount: files.length,
  });

  // 발주서 조회
  const purchaseOrder = await PurchaseOrderModel.getPurchaseOrderById(parseInt(id));
  if (!purchaseOrder) {
    throw new AppError('발주서를 찾을 수 없습니다.', 404);
  }

  // 기존 images JSON 배열 파싱
  let images = [];
  try {
    images = purchaseOrder.images ? JSON.parse(purchaseOrder.images) : [];
  } catch (e) {
    logger.error('images JSON 파싱 실패', { error: e.message });
    images = [];
  }

  // 첫 번째 이미지가 없는 경우 (레거시 데이터)
  if (images.length === 0 && purchaseOrder.storage_path) {
    images.push({
      path: purchaseOrder.storage_path,
      uuid: purchaseOrder.uuid,
      filename: purchaseOrder.original_filename,
      file_size: purchaseOrder.file_size,
      mime_type: purchaseOrder.mime_type,
      width: purchaseOrder.image_width,
      height: purchaseOrder.image_height,
    });
  }

  // 모든 이미지 처리 및 저장
  const newImages = [];
  for (const file of files) {
    const imageResult = await imageProcessor.processAndSaveImage(
      file.buffer, 
      file.originalname,
      'purchase_orders'  // 발주서 폴더에 저장
    );
    
    const newImage = {
      path: imageResult.storagePath,
      uuid: imageResult.uuid,
      filename: imageResult.originalFilename,
      file_size: imageResult.fileSize,
      mime_type: imageResult.mimeType,
      width: imageResult.imageWidth,
      height: imageResult.imageHeight,
    };
    
    images.push(newImage);
    newImages.push(newImage);
  }

  // 데이터베이스 업데이트
  await PurchaseOrderModel.updatePurchaseOrder(parseInt(id), {
    images: JSON.stringify(images),
    image_count: images.length,
    updated_at: new Date(),
  });

  const processingTime = Date.now() - startTime;

  logger.info('발주서 추가 이미지 업로드 완료', {
    purchaseOrderId: id,
    addedCount: newImages.length,
    totalImages: images.length,
    processingTime,
  });

  res.json({
    success: true,
    data: {
      message: `${newImages.length}장의 이미지가 추가되었습니다. (총 ${images.length}장)`,
      purchaseOrderId: id,
      addedCount: newImages.length,
      totalCount: images.length,
      images: images,
      processingTime,
    },
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
  rotatePurchaseOrderImage,
  addImagesToPurchaseOrder,  // 🆕 추가
};
