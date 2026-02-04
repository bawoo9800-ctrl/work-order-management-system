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

/**
 * 모든 거래처 조회
 * GET /api/v1/clients
 * Query: ?active=true/false
 */
export const getClients = async (req, res) => {
  const activeOnly = req.query.active !== 'false'; // 기본값 true
  
  const clients = await ClientModel.getAllClients(activeOnly);
  
  res.json({
    success: true,
    data: {
      clients,
      count: clients.length,
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
