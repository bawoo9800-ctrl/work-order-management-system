/**
 * ========================================
 * 작업지시서 컨트롤러 (Work Order Controller)
 * ========================================
 * 파일: src/controllers/workOrder.controller.js
 * 설명: 작업지시서 관련 HTTP 요청 처리
 *       - 이미지 업로드
 *       - OCR 처리
 *       - 자동 분류
 *       - CRUD 작업
 * ========================================
 */

import { v4 as uuidv4 } from 'uuid';
import * as WorkOrderModel from '../models/workOrder.model.js';
import * as imageProcessor from '../utils/imageProcessor.js';
import * as ocrService from '../services/ocr.service.js';
import * as classificationService from '../services/classification.service.js';
import imageProcessingService from '../services/imageProcessing.service.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/error.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { notifyWorkOrderCreated } from '../socket/socket.js';

/**
 * 작업지시서 업로드 및 처리 (수동 분류 - 다중 이미지 지원)
 * POST /api/v1/work-orders/upload
 * Body: clientName (선택), siteName (선택), uploadedBy (필수)
 * Files: images[] (다중 이미지)
 */
export const uploadWorkOrder = asyncHandler(async (req, res) => {
  const startTime = Date.now();

  // 1) 파일 검증 (다중 또는 단일)
  const files = req.files || (req.file ? [req.file] : []);
  
  if (files.length === 0) {
    throw new AppError('이미지 파일이 필요합니다.', 400);
  }
  
  // 수동 입력 필드
  const { clientName, siteName, uploadedBy } = req.body;
  
  // 필수 필드 검증 (전송자만)
  if (!uploadedBy || !uploadedBy.trim()) {
    throw new AppError('전송자명은 필수입니다.', 400);
  }

  logger.info(`다중 이미지 업로드 시작: ${files.length}장`, {
    fileCount: files.length,
    clientName: clientName || '(없음)',
    siteName: siteName || '(없음)',
    uploadedBy: uploadedBy.trim(),
  });

  try {
    // 2) 모든 이미지 처리 및 저장
    const imageResults = [];
    
    for (const file of files) {
      const imageResult = await imageProcessor.processAndSaveImage(file.buffer, file.originalname);
      imageResults.push(imageResult);
    }

    // 3) 첫 번째 이미지로 작업지시서 생성
    const firstImage = imageResults[0];
    
    // images 필드: 여러 이미지 경로를 JSON 배열로 저장
    const imagesJson = JSON.stringify(imageResults.map(img => ({
      path: img.storagePath, // 'path' 필드 사용 (프론트엔드 호환)
      uuid: img.uuid,
      filename: img.originalFilename,
      file_size: img.fileSize,
      mime_type: img.mimeType,
      width: img.imageWidth,
      height: img.imageHeight,
    })));

    const workOrderData = {
      uuid: firstImage.uuid,
      original_filename: firstImage.originalFilename,
      storage_path: firstImage.storagePath,
      file_size: firstImage.fileSize,
      mime_type: firstImage.mimeType,
      image_width: firstImage.imageWidth,
      image_height: firstImage.imageHeight,
      images: imagesJson, // 다중 이미지 정보
      image_count: imageResults.length, // ✅ 이미지 개수 추가
      client_id: null,
      client_name: clientName?.trim() || null,
      site_name: siteName?.trim() || null,
      classification_method: 'manual',
      confidence_score: null,
      reasoning: clientName ? `수동 입력: ${clientName}` : '수동 업로드',
      ocr_text: null,
      work_date: null,
      work_type: null,
      status: 'classified',
      api_cost_usd: 0,
      processing_time_ms: Date.now() - startTime,
      uploaded_by: uploadedBy.trim(),
      uploaded_from: 'web',
    };

    logger.info('📝 DB 저장 데이터:', {
      uuid: workOrderData.uuid,
      uploaded_by: workOrderData.uploaded_by,
      client_name: workOrderData.client_name,
      site_name: workOrderData.site_name,
      imageCount: imageResults.length,
    });

    const workOrderId = await WorkOrderModel.createWorkOrder(workOrderData);

    // WebSocket 실시간 알림 전송
    try {
      notifyWorkOrderCreated({
        id: workOrderId,
        client_name: clientName?.trim() || '거래처 미지정',
        uploaded_by: uploadedBy.trim()
      });
    } catch (notifyError) {
      logger.error('WebSocket 알림 전송 실패 (작업지시서는 정상 생성됨)', {
        error: notifyError.message
      });
    }

    // 4) 응답
    res.status(201).json({
      success: true,
      data: {
        id: workOrderId,
        uuid: firstImage.uuid,
        originalFilename: firstImage.originalFilename,
        clientName: clientName?.trim() || null,
        siteName: siteName?.trim() || null,
        uploadedBy: uploadedBy.trim(),
        imageCount: imageResults.length,
        processingTimeMs: Date.now() - startTime,
      },
      error: null,
    });

    logger.info('작업지시서 생성 완료', {
      workOrderId,
      uuid: firstImage.uuid,
      imageCount: imageResults.length,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('작업지시서 처리 실패', {
      error: error.message,
      stack: error.stack,
      fileCount: files.length,
    });
    throw error;
  }
});

/**
 * 작업지시서 목록 조회
 * GET /api/v1/work-orders
 */
export const getWorkOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 1000, // 기본 1000개까지 조회
    clientId,
    status,
    startDate,
    endDate,
  } = req.query;

  const result = await WorkOrderModel.getAllWorkOrders({
    page: parseInt(page),
    limit: parseInt(limit),
    clientId: clientId ? parseInt(clientId) : undefined,
    status,
    startDate,
    endDate,
  });

  res.json({
    success: true,
    data: {
      workOrders: result.data,
      pagination: result.pagination,
    },
    error: null,
  });
});

/**
 * 작업지시서 상세 조회
 * GET /api/v1/work-orders/:id
 */
export const getWorkOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const workOrder = await WorkOrderModel.getWorkOrderById(parseInt(id));

  if (!workOrder) {
    throw new AppError('작업지시서를 찾을 수 없습니다.', 404);
  }

  res.json({
    success: true,
    data: { workOrder },
    error: null,
  });
});

/**
 * UUID로 작업지시서 조회
 * GET /api/v1/work-orders/uuid/:uuid
 */
export const getWorkOrderByUuid = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  const workOrder = await WorkOrderModel.getWorkOrderByUuid(uuid);

  if (!workOrder) {
    throw new AppError('작업지시서를 찾을 수 없습니다.', 404);
  }

  res.json({
    success: true,
    data: { workOrder },
    error: null,
  });
});

/**
 * 작업지시서 수정
 * PUT /api/v1/work-orders/:id
 */
export const updateWorkOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // 허용된 필드만 업데이트
  const allowedFields = [
    'client_id',
    'client_name',
    'site_name',
    'work_type',
    'memo',
    'classification_method',
    'confidence_score',
    'reasoning',
    'work_date',
    'status',
  ];

  const filteredData = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  }

  if (Object.keys(filteredData).length === 0) {
    throw new AppError('수정할 데이터가 없습니다.', 400);
  }

  const affectedRows = await WorkOrderModel.updateWorkOrder(parseInt(id), filteredData);

  if (affectedRows === 0) {
    throw new AppError('작업지시서를 찾을 수 없습니다.', 404);
  }

  // 수정 알림 제거 (전송 알림만 유지)
  // notifyWorkOrderUpdated() 호출 안 함

  res.json({
    success: true,
    data: {
      message: '작업지시서가 수정되었습니다.',
      affectedRows,
    },
    error: null,
  });
});

/**
 * 작업지시서 삭제
 * DELETE /api/v1/work-orders/:id
 */
export const deleteWorkOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  logger.info('작업지시서 삭제 요청', { id });

  try {
    const affectedRows = await WorkOrderModel.deleteWorkOrder(parseInt(id));

    if (affectedRows === 0) {
      throw new AppError('작업지시서를 찾을 수 없습니다.', 404);
    }

    // 삭제 알림 제거 (전송 알림만 유지)
    // notifyWorkOrderDeleted() 호출 안 함

    logger.info('작업지시서 삭제 완료', { id, affectedRows });

    res.json({
      success: true,
      data: {
        message: '작업지시서가 삭제되었습니다.',
      },
      error: null,
    });
  } catch (error) {
    logger.error('작업지시서 삭제 실패', { 
      id, 
      error: error.message,
      stack: error.stack 
    });
    throw error;
  }
});

/**
 * 작업지시서 통계
 * GET /api/v1/work-orders/stats/summary
 */
export const getWorkOrderStats = asyncHandler(async (req, res) => {
  const stats = await WorkOrderModel.getWorkOrderStats();

  res.json({
    success: true,
    data: { stats },
    error: null,
  });
});

/**
 * 최근 작업지시서 조회
 * GET /api/v1/work-orders/recent
 */
export const getRecentWorkOrders = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const workOrders = await WorkOrderModel.getRecentWorkOrders(parseInt(limit));

  res.json({
    success: true,
    data: { workOrders },
    error: null,
  });
});

/**
 * 작업지시서 재분류
 * POST /api/v1/work-orders/:id/reclassify
 */
export const reclassifyWorkOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { clientId } = req.body;

  if (!clientId) {
    throw new AppError('거래처 ID가 필요합니다.', 400);
  }

  // 작업지시서 조회
  const workOrder = await WorkOrderModel.getWorkOrderById(parseInt(id));

  if (!workOrder) {
    throw new AppError('작업지시서를 찾을 수 없습니다.', 404);
  }

  // 수동 분류 처리
  const classificationResult = await classificationService.manualClassify(
    parseInt(id),
    parseInt(clientId),
    '관리자가 수동으로 재분류했습니다.'
  );

  // DB 업데이트
  await WorkOrderModel.updateWorkOrder(parseInt(id), {
    client_id: parseInt(clientId),
    classification_method: 'manual',
    confidence_score: 1.0,
    reasoning: classificationResult.reasoning,
    status: 'classified',
  });

  // 분류 피드백 저장 (정확도 개선용)
  if (workOrder.client_id) {
    await classificationService.saveClassificationFeedback(
      parseInt(id),
      workOrder.client_id,
      parseInt(clientId)
    );
  }

  res.json({
    success: true,
    data: {
      message: '작업지시서가 재분류되었습니다.',
      clientId: parseInt(clientId),
    },
    error: null,
  });
});

/**
 * 휴지통 작업지시서 조회
 * GET /api/v1/work-orders/trash
 */
export const getTrashWorkOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 1000 } = req.query; // 기본 1000개

  const result = await WorkOrderModel.getDeletedWorkOrders({
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.json({
    success: true,
    data: result,
    error: null,
  });
});

/**
 * 작업지시서 복구
 * POST /api/v1/work-orders/:id/restore
 */
export const restoreWorkOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  logger.info('작업지시서 복구 요청', { id });

  const affectedRows = await WorkOrderModel.restoreWorkOrder(parseInt(id));

  if (affectedRows === 0) {
    throw new AppError('복구할 작업지시서를 찾을 수 없습니다.', 404);
  }

  logger.info('작업지시서 복구 완료', { id, affectedRows });

  res.json({
    success: true,
    data: {
      message: '작업지시서가 복구되었습니다.',
    },
    error: null,
  });
});

/**
 * 작업지시서 영구 삭제
 * DELETE /api/v1/work-orders/:id/permanent
 */
export const permanentlyDeleteWorkOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  logger.info('작업지시서 영구 삭제 요청', { id });

  const affectedRows = await WorkOrderModel.permanentlyDeleteWorkOrder(parseInt(id));

  if (affectedRows === 0) {
    throw new AppError('삭제할 작업지시서를 찾을 수 없습니다.', 404);
  }

  logger.info('작업지시서 영구 삭제 완료', { id, affectedRows });

  res.json({
    success: true,
    data: {
      message: '작업지시서가 영구적으로 삭제되었습니다.',
    },
    error: null,
  });
});

/**
 * 편집된 이미지 업로드
 * POST /api/v1/work-orders/:id/upload-edited-image
 */
export const uploadEditedImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const startTime = Date.now();

  // 파일 검증
  if (!req.file) {
    throw new AppError('이미지 파일이 필요합니다.', 400);
  }

  const { buffer, originalname, mimetype } = req.file;

  logger.info('편집된 이미지 업로드 시작', {
    workOrderId: id,
    originalFilename: originalname,
    fileSize: buffer.length,
    mimeType: mimetype,
  });

  // 작업지시서 조회
  const workOrder = await WorkOrderModel.getWorkOrderById(parseInt(id));
  if (!workOrder) {
    throw new AppError('작업지시서를 찾을 수 없습니다.', 404);
  }

  // 이미지 처리 및 저장
  const imageResult = await imageProcessor.saveImage(buffer, originalname);

  // 데이터베이스 업데이트 (storage_path를 새 이미지로 변경)
  await WorkOrderModel.updateWorkOrder(parseInt(id), {
    storage_path: imageResult.path,
    file_size_bytes: imageResult.size,
    updated_at: new Date(),
  });

  const processingTime = Date.now() - startTime;

  logger.info('편집된 이미지 업로드 완료', {
    workOrderId: id,
    newPath: imageResult.path,
    fileSize: imageResult.size,
    processingTime,
  });

  res.json({
    success: true,
    data: {
      message: '이미지가 성공적으로 업로드되었습니다.',
      workOrderId: id,
      path: imageResult.path,
      fileSize: imageResult.size,
      processingTime,
    },
    error: null,
  });
});

/**
 * 작업지시서에 이미지 추가 (추가촬영)
 * POST /api/v1/work-orders/:id/add-image
 * 동일한 거래처의 작업지시서에 추가 이미지 업로드
 */
export const addImageToWorkOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const startTime = Date.now();

  // 파일 검증
  if (!req.file) {
    throw new AppError('이미지 파일이 필요합니다.', 400);
  }

  const { buffer, originalname, mimetype } = req.file;

  logger.info('추가 이미지 업로드 시작', {
    workOrderId: id,
    originalFilename: originalname,
    fileSize: buffer.length,
    mimeType: mimetype,
  });

  // 작업지시서 조회
  const workOrder = await WorkOrderModel.getWorkOrderById(parseInt(id));
  if (!workOrder) {
    throw new AppError('작업지시서를 찾을 수 없습니다.', 404);
  }

  // 이미지 저장
  const imageResult = await imageProcessor.saveImage(buffer, originalname);

  // 기존 images JSON 배열에 추가
  let images = [];
  try {
    images = workOrder.images ? JSON.parse(workOrder.images) : [];
  } catch (e) {
    logger.error('images JSON 파싱 실패', { error: e.message });
    images = [];
  }

  // 첫 번째 이미지가 없는 경우 (레거시 데이터)
  if (images.length === 0 && workOrder.storage_path) {
    images.push({
      path: workOrder.storage_path,
      filename: workOrder.original_filename,
      order: 1,
      uploaded_at: workOrder.created_at,
    });
  }

  // 새 이미지 추가
  const newImage = {
    path: imageResult.path,
    filename: originalname,
    order: images.length + 1,
    uploaded_at: new Date().toISOString(),
  };
  images.push(newImage);

  // 데이터베이스 업데이트
  await WorkOrderModel.updateWorkOrder(parseInt(id), {
    images: JSON.stringify(images),
    image_count: images.length,
    updated_at: new Date(),
  });

  const processingTime = Date.now() - startTime;

  logger.info('추가 이미지 업로드 완료', {
    workOrderId: id,
    totalImages: images.length,
    newImagePath: imageResult.path,
    processingTime,
  });

  res.json({
    success: true,
    data: {
      message: `이미지가 추가되었습니다. (총 ${images.length}장)`,
      workOrderId: id,
      images: images,
      imageCount: images.length,
      processingTime,
    },
    error: null,
  });
});

/**
 * 이미지 처리 (서버 측 고급 보정)
 * POST /api/v1/work-orders/:id/process-image
 * Body: {
 *   enablePerspective: boolean,
 *   enableAutoCrop: boolean,
 *   enableScan: boolean,
 *   enableThreshold: boolean,
 *   enableBackgroundRemoval: boolean,
 *   brightness: number,
 *   contrast: number,
 *   threshold: number
 * }
 */
export const processWorkOrderImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const startTime = Date.now();

  try {
    logger.info('이미지 처리 요청', { id, body: req.body });

    // 1. 작업지시서 조회
    const workOrder = await WorkOrderModel.getWorkOrderById(parseInt(id));
    if (!workOrder) {
      throw new AppError('작업지시서를 찾을 수 없습니다.', 404);
    }

    // 2. 원본 이미지 경로 확인
    const originalPath = workOrder.storage_path;
    if (!originalPath) {
      throw new AppError('원본 이미지를 찾을 수 없습니다.', 404);
    }

    logger.info('원본 이미지 경로', { originalPath });

    // 파일 존재 여부 확인
    const fs = await import('fs/promises');
    try {
      await fs.access(originalPath);
      logger.info('✅ 파일 접근 가능:', originalPath);
    } catch (err) {
      logger.error('❌ 파일 접근 불가:', { originalPath, error: err.message });
      throw new AppError(`원본 이미지 파일을 찾을 수 없습니다: ${originalPath}`, 404);
    }

    // 3. 이미지 처리 옵션
    const options = {
      enablePerspective: req.body.enablePerspective !== false,
      enableAutoCrop: req.body.enableAutoCrop !== false,
      enableScan: req.body.enableScan !== false,
      enableThreshold: req.body.enableThreshold === true,
      enableBackgroundRemoval: req.body.enableBackgroundRemoval === true,
      brightness: parseFloat(req.body.brightness) || 1.1,
      contrast: parseFloat(req.body.contrast) || 1.3,
      threshold: parseInt(req.body.threshold) || 128,
    };

    logger.info('이미지 처리 옵션:', options);

    // 4. 이미지 처리 실행
    logger.info('📸 이미지 처리 시작...');
    const { buffer, processingTime } = await imageProcessingService.processDocument(
      originalPath,
      options
    );
    logger.info('✅ 이미지 처리 완료:', { processingTime });

    // 5. 보정된 이미지 저장
    const uploadPath = process.env.UPLOAD_PATH || '/volume1/web/work-order-management-system/uploads';
    logger.info('💾 보정된 이미지 저장 시작:', { uploadPath });
    
    const savedFile = await imageProcessingService.saveProcessedImage(
      buffer,
      workOrder.original_filename,
      uploadPath
    );
    logger.info('✅ 보정된 이미지 저장 완료:', savedFile);

    // 6. 데이터베이스 업데이트 (storage_path를 보정된 이미지로 변경)
    await WorkOrderModel.updateWorkOrder(parseInt(id), {
      storage_path: savedFile.path,
      processing_time_ms: processingTime,
    });

    const totalTime = Date.now() - startTime;

    logger.info('✅ 이미지 처리 전체 완료', {
      id,
      originalPath,
      newPath: savedFile.path,
      fileSize: savedFile.size,
      processingTime,
      totalTime,
    });

    res.json({
      success: true,
      data: {
        message: '이미지 처리가 완료되었습니다.',
        workOrderId: id,
        originalPath,
        processedPath: savedFile.path,
        processedFilename: savedFile.filename,
        fileSize: savedFile.size,
        processingTime,
        totalTime,
      },
      error: null,
    });
  } catch (error) {
    logger.error('❌ 이미지 처리 실패:', {
      id,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
});

/**
 * 작업지시서에 여러 이미지 추가 (추가촬영 - 다중)
 * POST /api/v1/work-orders/:id/add-images
 * 동일한 거래처의 작업지시서에 여러 추가 이미지 업로드
 */
export const addImagesToWorkOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const startTime = Date.now();

  // 파일 검증 (다중 또는 단일)
  const files = req.files || (req.file ? [req.file] : []);
  
  if (files.length === 0) {
    throw new AppError('이미지 파일이 필요합니다.', 400);
  }

  logger.info(`추가 이미지 업로드 시작: ${files.length}장`, {
    workOrderId: id,
    fileCount: files.length,
  });

  // 작업지시서 조회
  const workOrder = await WorkOrderModel.getWorkOrderById(parseInt(id));
  if (!workOrder) {
    throw new AppError('작업지시서를 찾을 수 없습니다.', 404);
  }

  // 기존 images JSON 배열 파싱
  let images = [];
  try {
    images = workOrder.images ? JSON.parse(workOrder.images) : [];
  } catch (e) {
    logger.error('images JSON 파싱 실패', { error: e.message });
    images = [];
  }

  // 첫 번째 이미지가 없는 경우 (레거시 데이터)
  if (images.length === 0 && workOrder.storage_path) {
    images.push({
      path: workOrder.storage_path, // 'path' 필드 사용
      uuid: workOrder.uuid,
      filename: workOrder.original_filename,
      file_size: workOrder.file_size,
      mime_type: workOrder.mime_type,
      width: workOrder.image_width,
      height: workOrder.image_height,
    });
  }

  // 모든 이미지 처리 및 저장
  const newImages = [];
  for (const file of files) {
    const imageResult = await imageProcessor.processAndSaveImage(file.buffer, file.originalname);
    
    const newImage = {
      path: imageResult.storagePath, // 'path' 필드 사용
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
  await WorkOrderModel.updateWorkOrder(parseInt(id), {
    images: JSON.stringify(images),
    image_count: images.length, // ✅ 이미지 개수 업데이트
    updated_at: new Date(),
  });

  const processingTime = Date.now() - startTime;

  logger.info('추가 이미지 업로드 완료', {
    workOrderId: id,
    addedCount: newImages.length,
    totalImages: images.length,
    processingTime,
  });

  res.json({
    success: true,
    data: {
      message: `${newImages.length}장의 이미지가 추가되었습니다. (총 ${images.length}장)`,
      workOrderId: id,
      addedCount: newImages.length,
      totalCount: images.length,
      images: images,
      processingTime,
    },
    error: null,
  });
});
