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
import logger from '../utils/logger.js';
import { AppError } from '../middleware/error.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

/**
 * 작업지시서 업로드 및 처리 (수동 분류)
 * POST /api/v1/work-orders/upload
 * Body: clientName (필수), siteName (선택), uploadedBy (필수)
 */
export const uploadWorkOrder = asyncHandler(async (req, res) => {
  const startTime = Date.now();

  // 1) 파일 검증
  if (!req.file) {
    throw new AppError('이미지 파일이 필요합니다.', 400);
  }

  const { buffer, originalname, mimetype } = req.file;
  
  // 수동 입력 필드
  const { clientName, siteName, uploadedBy } = req.body;
  
  // 필수 필드 검증
  if (!clientName || !clientName.trim()) {
    throw new AppError('거래처명은 필수입니다.', 400);
  }
  
  if (!uploadedBy || !uploadedBy.trim()) {
    throw new AppError('전송자명은 필수입니다.', 400);
  }

  logger.info('작업지시서 업로드 시작', {
    originalFilename: originalname,
    fileSize: buffer.length,
    mimeType: mimetype,
    clientName,
    siteName,
    uploadedBy,
  });

  try {
    // 2) 이미지 처리 및 저장
    const imageResult = await imageProcessor.processAndSaveImage(buffer, originalname);

    // 3) 작업지시서 DB 저장 (수동 분류)
    const workOrderData = {
      uuid: imageResult.uuid,
      original_filename: imageResult.originalFilename,
      storage_path: imageResult.storagePath,
      file_size: imageResult.fileSize,
      mime_type: imageResult.mimeType,
      image_width: imageResult.imageWidth,
      image_height: imageResult.imageHeight,
      client_id: null, // 수동 입력이므로 null
      classification_method: 'manual',
      confidence_score: null,
      reasoning: `수동 입력: ${clientName}`,
      ocr_text: null,
      work_date: null,
      work_type: null,
      status: 'classified',
      api_cost_usd: 0,
      processing_time_ms: Date.now() - startTime,
      uploaded_by: uploadedBy.trim(),
      uploaded_from: 'web',
    };

    const workOrderId = await WorkOrderModel.createWorkOrder(workOrderData);

    // 4) 응답
    res.status(201).json({
      success: true,
      data: {
        id: workOrderId,
        uuid: imageResult.uuid,
        originalFilename: imageResult.originalFilename,
        clientName: clientName.trim(),
        siteName: siteName?.trim() || null,
        uploadedBy: uploadedBy.trim(),
        processingTimeMs: Date.now() - startTime,
      },
      error: null,
    });

    logger.info('작업지시서 생성 완료', {
      workOrderId,
      uuid: imageResult.uuid,
      clientName,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('작업지시서 처리 실패', {
      error: error.message,
      stack: error.stack,
      originalFilename: originalname,
    });
    throw error;
  }
});
          clientCode: classificationResult.clientCode,
          confidence: classificationResult.confidence,
          method: classificationResult.method,
          reasoning: classificationResult.reasoning,
          isAutoClassified: classificationResult.isAutoClassified,
          workDate: classificationResult.workDate,
          workType: classificationResult.workType,
          notes: classificationResult.notes,
          candidates: classificationResult.candidates,
        },
        ocr: {
          textLength: ocrResult.text.length,
          confidence: ocrResult.confidence,
          wordCount: ocrResult.wordCount,
        },
        processingTimeMs: Date.now() - startTime,
        apiCost: classificationResult.apiCost || 0,
      },
      error: null,
    });

    logger.info('작업지시서 업로드 완료', {
      workOrderId,
      uuid: imageResult.uuid,
      clientId: classificationResult.clientId,
      processingTime: `${Date.now() - startTime}ms`,
    });
  } catch (error) {
    logger.error('작업지시서 업로드 실패', {
      error: error.message,
      originalFilename: originalname,
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
    limit = 20,
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

  const affectedRows = await WorkOrderModel.deleteWorkOrder(parseInt(id));

  if (affectedRows === 0) {
    throw new AppError('작업지시서를 찾을 수 없습니다.', 404);
  }

  res.json({
    success: true,
    data: {
      message: '작업지시서가 삭제되었습니다.',
    },
    error: null,
  });
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
