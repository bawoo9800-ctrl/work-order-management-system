/**
 * ========================================
 * User Controller
 * ========================================
 * 파일: src/controllers/user.controller.js
 * 설명: 사용자(전송자) 관리 API
 * ========================================
 */

import * as userModel from '../models/user.model.js';

/**
 * 모든 사용자 조회
 * GET /api/v1/users
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    
    // 각 사용자의 작업지시서 개수 추가
    const usersWithCount = await Promise.all(
      users.map(async (user) => {
        const count = await userModel.getUserWorkOrderCount(user.id);
        return {
          ...user,
          workOrderCount: count,
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        users: usersWithCount,
        total: usersWithCount.length,
      },
    });
  } catch (error) {
    console.error('❌ 사용자 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '사용자 목록을 불러오는 데 실패했습니다.',
      error: error.message,
    });
  }
};

/**
 * 사용자 ID로 조회
 * GET /api/v1/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }
    
    const workOrderCount = await userModel.getUserWorkOrderCount(id);
    
    res.json({
      success: true,
      data: {
        user: {
          ...user,
          workOrderCount,
        },
      },
    });
  } catch (error) {
    console.error('❌ 사용자 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '사용자를 불러오는 데 실패했습니다.',
      error: error.message,
    });
  }
};

/**
 * 사용자 생성
 * POST /api/v1/users
 * Body: { name: string }
 */
export const createUser = async (req, res) => {
  try {
    const { name } = req.body;
    
    // 유효성 검증
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '사용자명을 입력해주세요.',
      });
    }
    
    // 중복 체크
    const existingUser = await userModel.getUserByName(name.trim());
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '이미 존재하는 사용자명입니다.',
      });
    }
    
    const userId = await userModel.createUser({ name: name.trim() });
    const user = await userModel.getUserById(userId);
    
    res.status(201).json({
      success: true,
      message: '사용자가 추가되었습니다.',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('❌ 사용자 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: '사용자를 추가하는 데 실패했습니다.',
      error: error.message,
    });
  }
};

/**
 * 사용자 삭제
 * DELETE /api/v1/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 사용자 존재 여부 확인
    const user = await userModel.getUserById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }
    
    // 작업지시서 개수 확인
    const workOrderCount = await userModel.getUserWorkOrderCount(id);
    if (workOrderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `이 사용자가 등록한 작업지시서가 ${workOrderCount}건 있습니다. 삭제할 수 없습니다.`,
      });
    }
    
    const deleted = await userModel.deleteUser(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }
    
    res.json({
      success: true,
      message: '사용자가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('❌ 사용자 삭제 실패:', error);
    res.status(500).json({
      success: false,
      message: '사용자를 삭제하는 데 실패했습니다.',
      error: error.message,
    });
  }
};
