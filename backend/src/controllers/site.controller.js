/**
 * ========================================
 * 현장 컨트롤러 (Site Controller)
 * ========================================
 * 파일: src/controllers/site.controller.js
 * 설명: 현장 관련 비즈니스 로직
 * ========================================
 */

import * as SiteModel from '../models/site.model.js';
import { AppError, asyncHandler } from '../middleware/error.middleware.js';
import logger from '../utils/logger.js';

/**
 * 모든 현장 조회
 * GET /api/v1/sites
 * Query: ?clientId=1&active=true
 */
export const getSites = asyncHandler(async (req, res) => {
  const { clientId, active } = req.query;
  const activeOnly = active !== 'false';
  
  const sites = await SiteModel.getAllSites(
    clientId ? parseInt(clientId) : null,
    activeOnly
  );
  
  res.json({
    success: true,
    data: {
      sites,
      count: sites.length,
    },
    error: null,
  });
});

/**
 * 특정 현장 조회
 * GET /api/v1/sites/:id
 */
export const getSiteById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const site = await SiteModel.getSiteById(parseInt(id));
  
  if (!site) {
    throw new AppError('현장을 찾을 수 없습니다.', 404);
  }
  
  res.json({
    success: true,
    data: { site },
    error: null,
  });
});

/**
 * 현장 생성
 * POST /api/v1/sites
 * Body: { client_id, name, address, manager, phone, memo }
 */
export const createSite = asyncHandler(async (req, res) => {
  const { client_id, name, address, manager, phone, memo } = req.body;
  
  // 필수 필드 검증
  if (!client_id || !name) {
    throw new AppError('거래처 ID와 현장명은 필수입니다.', 400);
  }
  
  // 중복 확인
  const existingSite = await SiteModel.getSiteByName(client_id, name);
  if (existingSite) {
    throw new AppError('이미 존재하는 현장명입니다.', 409);
  }
  
  const siteData = {
    client_id: parseInt(client_id),
    name: name.trim(),
    address: address?.trim() || null,
    manager: manager?.trim() || null,
    phone: phone?.trim() || null,
    memo: memo?.trim() || null,
  };
  
  const siteId = await SiteModel.createSite(siteData);
  
  // 생성된 현장 조회
  const newSite = await SiteModel.getSiteById(siteId);
  
  res.status(201).json({
    success: true,
    data: { site: newSite },
    error: null,
  });
});

/**
 * 현장 수정
 * PUT /api/v1/sites/:id
 * Body: { name, address, manager, phone, memo, is_active }
 */
export const updateSite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  // 현장 존재 확인
  const existingSite = await SiteModel.getSiteById(parseInt(id));
  if (!existingSite) {
    throw new AppError('현장을 찾을 수 없습니다.', 404);
  }
  
  // 현장명 중복 확인 (변경하는 경우)
  if (updateData.name && updateData.name !== existingSite.name) {
    const duplicate = await SiteModel.getSiteByName(existingSite.client_id, updateData.name);
    if (duplicate) {
      throw new AppError('이미 존재하는 현장명입니다.', 409);
    }
  }
  
  const success = await SiteModel.updateSite(parseInt(id), updateData);
  
  if (!success) {
    throw new AppError('현장 수정에 실패했습니다.', 500);
  }
  
  // 수정된 현장 조회
  const updatedSite = await SiteModel.getSiteById(parseInt(id));
  
  res.json({
    success: true,
    data: { site: updatedSite },
    error: null,
  });
});

/**
 * 현장 삭제 (소프트 삭제)
 * DELETE /api/v1/sites/:id
 */
export const deleteSite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // 현장 존재 확인
  const existingSite = await SiteModel.getSiteById(parseInt(id));
  if (!existingSite) {
    throw new AppError('현장을 찾을 수 없습니다.', 404);
  }
  
  const success = await SiteModel.deleteSite(parseInt(id));
  
  if (!success) {
    throw new AppError('현장 삭제에 실패했습니다.', 500);
  }
  
  res.json({
    success: true,
    data: {
      message: '현장이 비활성화되었습니다.',
      siteId: parseInt(id),
    },
    error: null,
  });
});

/**
 * 현장 검색 (자동완성용)
 * GET /api/v1/sites/search?clientId=1&q=현장
 */
export const searchSites = asyncHandler(async (req, res) => {
  const { clientId, q, limit } = req.query;
  
  if (!clientId) {
    throw new AppError('거래처 ID는 필수입니다.', 400);
  }
  
  if (!q || q.trim().length === 0) {
    // 검색어 없으면 해당 거래처의 모든 현장 반환
    const sites = await SiteModel.getAllSites(parseInt(clientId), true);
    return res.json({
      success: true,
      data: {
        sites,
        count: sites.length,
        query: '',
      },
      error: null,
    });
  }
  
  const searchTerm = q.trim();
  const sites = await SiteModel.searchSites(
    parseInt(clientId),
    searchTerm,
    limit ? parseInt(limit) : 10
  );
  
  res.json({
    success: true,
    data: {
      sites,
      count: sites.length,
      query: searchTerm,
    },
    error: null,
  });
});

export default {
  getSites,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
  searchSites,
};
