/**
 * ========================================
 * MariaDB 데이터베이스 연결 설정
 * ========================================
 * 파일: src/config/database.js
 * 설명: MariaDB 연결 풀 생성 및 관리
 *       - Unix Socket 또는 TCP 연결 지원
 *       - Connection Pool 사용
 *       - 자동 재연결 처리
 *       - 쿼리 헬퍼 함수 제공
 * ========================================
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

// 환경 변수 로드
dotenv.config();

/**
 * 데이터베이스 연결 설정
 * Unix Socket 우선, 없으면 TCP 연결
 */
const dbConfig = process.env.DB_SOCKET_PATH
  ? {
      // Unix Socket 연결 (NAS 로컬 환경)
      socketPath: process.env.DB_SOCKET_PATH,
      user: process.env.DB_USER || 'work_order_user',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'work_order_management',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
      queueLimit: 0,
      connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
      // MariaDB 최적화 설정
      charset: 'utf8mb4',
      timezone: '+09:00',
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    }
  : {
      // TCP 연결 (원격 환경)
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'work_order_user',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'work_order_management',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
      queueLimit: 0,
      connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
      // MariaDB 최적화 설정
      charset: 'utf8mb4',
      timezone: '+09:00',
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    };

// 연결 방식 로깅
if (process.env.DB_SOCKET_PATH) {
  logger.info('Unix Socket 연결 사용', {
    socketPath: process.env.DB_SOCKET_PATH,
  });
} else {
  logger.info('TCP 연결 사용', {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
  });
}

/**
 * Connection Pool 생성
 */
let pool;

try {
  pool = mysql.createPool(dbConfig);
  
  const logConfig = { ...dbConfig };
  if (logConfig.password) {
    logConfig.passwordSet = true;
    delete logConfig.password;
  }
  
  logger.info('MariaDB Connection Pool 생성 완료', logConfig);
} catch (error) {
  logger.error('MariaDB Connection Pool 생성 실패', {
    error: error.message,
    stack: error.stack,
  });
  throw error;
}

/**
 * 데이터베이스 연결 테스트
 * @returns {Promise<boolean>} 연결 성공 여부
 */
export const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    logger.info('MariaDB 연결 테스트 성공', { result: rows[0].result });
    return true;
  } catch (error) {
    logger.error('MariaDB 연결 테스트 실패', {
      error: error.message,
      stack: error.stack,
    });
    return false;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * 쿼리 실행 (복수 행 반환)
 * @param {string} sql - SQL 쿼리
 * @param {Array} params - 쿼리 파라미터
 * @returns {Promise<Array>} 쿼리 결과
 */
export const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('쿼리 실행 실패', {
      sql,
      params,
      error: error.message,
    });
    throw error;
  }
};

/**
 * 쿼리 실행 (단일 행 반환)
 * @param {string} sql - SQL 쿼리
 * @param {Array} params - 쿼리 파라미터
 * @returns {Promise<object|null>} 쿼리 결과 (첫 번째 행)
 */
export const queryOne = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  } catch (error) {
    logger.error('쿼리 실행 실패', {
      sql,
      params,
      error: error.message,
    });
    throw error;
  }
};

/**
 * INSERT 쿼리 실행
 * @param {string} sql - SQL INSERT 쿼리
 * @param {Array} params - 쿼리 파라미터
 * @returns {Promise<number>} 생성된 레코드 ID
 */
export const insert = async (sql, params = []) => {
  try {
    const [result] = await pool.execute(sql, params);
    return result.insertId;
  } catch (error) {
    logger.error('INSERT 실행 실패', {
      sql,
      params,
      error: error.message,
    });
    throw error;
  }
};

/**
 * UPDATE/DELETE 쿼리 실행
 * @param {string} sql - SQL UPDATE/DELETE 쿼리
 * @param {Array} params - 쿼리 파라미터
 * @returns {Promise<number>} 영향받은 행 수
 */
export const execute = async (sql, params = []) => {
  try {
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  } catch (error) {
    logger.error('쿼리 실행 실패', {
      sql,
      params,
      error: error.message,
    });
    throw error;
  }
};

/**
 * 트랜잭션 시작
 * @returns {Promise<object>} 연결 객체
 */
export const beginTransaction = async () => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

/**
 * Connection Pool 종료
 */
export const closePool = async () => {
  try {
    await pool.end();
    logger.info('MariaDB Connection Pool 종료 완료');
  } catch (error) {
    logger.error('Connection Pool 종료 실패', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Pool 상태 조회
 * @returns {object} Pool 상태 정보
 */
export const getPoolStatus = () => {
  return {
    totalConnections: pool.pool._allConnections.length,
    freeConnections: pool.pool._freeConnections.length,
    queuedRequests: pool.pool._connectionQueue.length,
  };
};

// 기본 export
export default pool;
