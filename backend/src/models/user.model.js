/**
 * ========================================
 * User Model
 * ========================================
 * 파일: src/models/user.model.js
 * 설명: 사용자(전송자) 데이터 관리
 * ========================================
 */

import db from '../config/database.js';

/**
 * 모든 사용자 조회
 */
export const getAllUsers = async () => {
  const query = `
    SELECT 
      id,
      name,
      created_at,
      updated_at
    FROM users
    ORDER BY name ASC
  `;
  
  const [users] = await db.execute(query);
  console.log('✅ 사용자 목록 조회:', users.length, '명');
  return users;
};

/**
 * 사용자 ID로 조회
 */
export const getUserById = async (id) => {
  const query = `
    SELECT 
      id,
      name,
      created_at,
      updated_at
    FROM users
    WHERE id = ?
  `;
  
  const [users] = await db.execute(query, [id]);
  return users[0];
};

/**
 * 사용자명으로 조회
 */
export const getUserByName = async (name) => {
  const query = `
    SELECT 
      id,
      name,
      created_at,
      updated_at
    FROM users
    WHERE name = ?
  `;
  
  const [users] = await db.execute(query, [name]);
  return users[0];
};

/**
 * 사용자 생성
 */
export const createUser = async (userData) => {
  const { name } = userData;
  
  const query = `
    INSERT INTO users (name)
    VALUES (?)
  `;
  
  try {
    const [result] = await db.execute(query, [name]);
    console.log('✅ 사용자 생성 완료:', { userId: result.insertId, name });
    return result.insertId;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('이미 존재하는 사용자명입니다.');
    }
    throw error;
  }
};

/**
 * 사용자 삭제
 */
export const deleteUser = async (id) => {
  const query = `
    DELETE FROM users
    WHERE id = ?
  `;
  
  const [result] = await db.execute(query, [id]);
  console.log('✅ 사용자 삭제 완료:', { userId: id, affectedRows: result.affectedRows });
  return result.affectedRows > 0;
};

/**
 * 사용자별 작업지시서 개수 조회
 */
export const getUserWorkOrderCount = async (userId) => {
  const query = `
    SELECT COUNT(*) as count
    FROM work_orders
    WHERE uploaded_by = (SELECT name FROM users WHERE id = ?)
  `;
  
  const [result] = await db.execute(query, [userId]);
  return result[0].count;
};
