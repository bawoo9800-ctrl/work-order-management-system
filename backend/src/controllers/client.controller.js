/**
 * ========================================
 * 거래처 컨트롤러 (Client Controller)
 * ========================================
 * 파일: src/controllers/client.controller.js
 * 설명: 거래처 관련 비즈니스 로직
 *       - 거래처 CRUD 작업
 *       - 입력 검증
 *       - 응답 포맷팅
 * ========================================
 */

import * as ClientModel from '../models/client.model.js';
import { AppError } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';
import xlsx from 'xlsx';

/**
 * 모든 거래처 조회 (통계 포함)
 * GET /api/v1/clients
 * Query: ?active=true/false
 */
export const getClients = async (req, res) => {
  const activeOnly = req.query.active !== 'false'; // 기본값 true
  
  const clients = await ClientModel.getAllClients(activeOnly);
  
  // 각 거래처별 작업지시서 및 발주서 개수 조회
  const clientsWithStats = await Promise.all(
    clients.map(async (client) => {
      // 작업지시서 개수
      const workOrderCount = await ClientModel.getWorkOrderCountByClient(client.id);
      // 발주서 개수
      const purchaseOrderCount = await ClientModel.getPurchaseOrderCountByClient(client.name);
      
      return {
        ...client,
        work_order_count: workOrderCount || 0,
        purchase_order_count: purchaseOrderCount || 0,
      };
    })
  );
  
  res.json({
    success: true,
    data: {
      clients: clientsWithStats,
      count: clientsWithStats.length,
    },
    error: null,
  });
};

/**
 * 특정 거래처 조회
 * GET /api/v1/clients/:id
 */
export const getClientById = async (req, res) => {
  const { id } = req.params;
  
  const client = await ClientModel.getClientById(id);
  
  if (!client) {
    throw new AppError('거래처를 찾을 수 없습니다.', 404);
  }
  
  res.json({
    success: true,
    data: { client },
    error: null,
  });
};

/**
 * 거래처 생성
 * POST /api/v1/clients
 * Body: { code, name, keywords, aliases, contact_info, priority, notes }
 */
export const createClient = async (req, res) => {
  const { code, name, keywords, aliases, contact_info, priority, notes } = req.body;
  
  // 필수 필드 검증
  if (!code || !name) {
    throw new AppError('거래처 코드와 이름은 필수입니다.', 400);
  }
  
  // 코드 중복 확인
  const existingClient = await ClientModel.getClientByCode(code);
  if (existingClient) {
    throw new AppError('이미 존재하는 거래처 코드입니다.', 409);
  }
  
  // 키워드 검증 (배열이어야 하며 최소 1개)
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    throw new AppError('최소 1개 이상의 키워드가 필요합니다.', 400);
  }
  
  const clientData = {
    code,
    name,
    keywords,
    aliases: aliases || [],
    contact_info: contact_info || null,
    priority: priority || 100,
    notes: notes || null,
  };
  
  const clientId = await ClientModel.createClient(clientData);
  
  // 생성된 거래처 조회
  const newClient = await ClientModel.getClientById(clientId);
  
  res.status(201).json({
    success: true,
    data: { client: newClient },
    error: null,
  });
};

/**
 * 거래처 수정
 * PUT /api/v1/clients/:id
 * Body: { name, keywords, aliases, contact_info, is_active, priority, notes }
 */
export const updateClient = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  // 거래처 존재 확인
  const existingClient = await ClientModel.getClientById(id);
  if (!existingClient) {
    throw new AppError('거래처를 찾을 수 없습니다.', 404);
  }
  
  // code는 수정 불가
  if (updateData.code) {
    delete updateData.code;
    logger.warn('거래처 코드는 수정할 수 없습니다', { id });
  }
  
  const affectedRows = await ClientModel.updateClient(id, updateData);
  
  if (affectedRows === 0) {
    throw new AppError('수정할 내용이 없습니다.', 400);
  }
  
  // 수정된 거래처 조회
  const updatedClient = await ClientModel.getClientById(id);
  
  res.json({
    success: true,
    data: { client: updatedClient },
    error: null,
  });
};

/**
 * 거래처 삭제 (소프트 삭제)
 * DELETE /api/v1/clients/:id
 */
export const deleteClient = async (req, res) => {
  const { id } = req.params;
  
  // 거래처 존재 확인
  const existingClient = await ClientModel.getClientById(id);
  if (!existingClient) {
    throw new AppError('거래처를 찾을 수 없습니다.', 404);
  }
  
  const affectedRows = await ClientModel.deleteClient(id);
  
  res.json({
    success: true,
    data: {
      message: '거래처가 비활성화되었습니다.',
      clientId: id,
    },
    error: null,
  });
};

/**
 * 거래처 통계 조회
 * GET /api/v1/clients/stats
 */
export const getClientStats = async (req, res) => {
  const stats = await ClientModel.getClientStats();
  
  res.json({
    success: true,
    data: { stats },
    error: null,
  });
};

/**
 * 거래처 검색 (자동완성용)
 * GET /api/v1/clients/search?q=검색어
 */
export const searchClients = async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim().length === 0) {
    return res.json({
      success: true,
      data: { clients: [] },
      error: null,
    });
  }
  
  const searchTerm = q.trim();
  const clients = await ClientModel.searchClients(searchTerm);
  
  res.json({
    success: true,
    data: {
      clients,
      count: clients.length,
      query: searchTerm,
    },
    error: null,
  });
};

/**
 * Excel 파일로 거래처 대량 업로드
 * POST /api/v1/clients/upload-excel
 * Body: multipart/form-data (file: Excel 파일)
 * 
 * Excel 형식:
 * - 컬럼 1: 사업자코드 (code)
 * - 컬럼 2: 거래처명 (name)
 */
export const uploadExcel = async (req, res) => {
  // 파일 확인
  if (!req.file) {
    throw new AppError('Excel 파일이 필요합니다.', 400);
  }
  
  const file = req.file;
  
  logger.info('Excel 파일 업로드 시작', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  });
  
  try {
    // Excel 파일 읽기
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // JSON으로 변환 (헤더 행 제외)
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    // 헤더 제거 (첫 행)
    const rows = data.slice(1).filter(row => row.length >= 2);
    
    if (rows.length === 0) {
      throw new AppError('Excel 파일에 데이터가 없습니다.', 400);
    }
    
    logger.info('Excel 파싱 완료', {
      totalRows: rows.length,
      sample: rows[0],
    });
    
    // 거래처 데이터 준비
    const clientsToInsert = rows.map((row, index) => {
      const code = String(row[0] || '').trim();
      const name = String(row[1] || '').trim();
      
      if (!code || !name) {
        logger.warn('유효하지 않은 행 스킵', { row: index + 2, code, name });
        return null;
      }
      
      return {
        code,
        name,
        keywords: [name], // 거래처명을 기본 키워드로 추가
        aliases: [],
        contact_info: null,
        priority: 100,
        notes: `Excel 업로드 (${new Date().toISOString()})`,
      };
    }).filter(Boolean);
    
    logger.info('거래처 데이터 준비 완료', {
      validRows: clientsToInsert.length,
      invalidRows: rows.length - clientsToInsert.length,
    });
    
    // 기존 거래처 전체 삭제 (하드 삭제)
    const deletedCount = await ClientModel.deleteAllClients();
    logger.info('기존 거래처 삭제 완료', { deletedCount });
    
    // 새 거래처 일괄 등록
    const insertedCount = await ClientModel.bulkCreateClients(clientsToInsert);
    logger.info('거래처 일괄 등록 완료', { insertedCount });
    
    res.json({
      success: true,
      data: {
        message: '거래처 업로드 완료',
        totalRows: rows.length,
        validRows: clientsToInsert.length,
        invalidRows: rows.length - clientsToInsert.length,
        deletedCount,
        insertedCount,
      },
      error: null,
    });
  } catch (error) {
    logger.error('Excel 업로드 실패', {
      error: error.message,
      stack: error.stack,
    });
    
    throw new AppError(`Excel 업로드 실패: ${error.message}`, 500);
  }
};
