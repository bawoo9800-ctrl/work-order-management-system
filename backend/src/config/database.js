/**
 * ========================================
 * MariaDB 데이터베이스 연결 설정
 * ========================================
 * 파일: src/config/database.js
 * 설명: MariaDB 연결 풀 생성 및 관리
 *       - 시놀로지 NAS MariaDB 연결
 *       - Connection Pool 사용
 *       - 자동 재연결 처리
 *       - 쿼리 헬퍼 함수 제공
 * ========================================
 */

import mysql from 'mysql2/promise';
import logger from '../utils/logger.js';

/**
 * 데이터베이스 연결 설정
 */
const dbConfig = {
  host: process.env.DB_HOST || '192.168.1.109',
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
  timezone: '+09:00', // 한국 시간대
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

/**
 * Connection Pool 생성
 */
let pool;

try {
  pool = mysql.createPool(dbConfig);
  logger.info('MariaDB Connection Pool 생성 완료', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    connectionLimit: dbConfig.connectionLimit,
  });
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
 * 쿼리 실행 헬퍼 (prepared statement 사용)
 * @param {string} sql - SQL 쿼리
 * @param {Array} params - 파라미터 배열
 * @returns {Promise<Array>} 쿼리 결과
 */
export const query = async (sql, params = []) => {
  const startTime = Date.now();
  let connection;
  
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(sql, params);
    
    const executionTime = Date.now() - startTime;
    
    // 성능 로깅 (DEBUG 레벨)
    if (process.env.LOG_LEVEL === 'debug') {
      logger.db(sql, executionTime, {
        rowCount: Array.isArray(rows) ? rows.length : 0,
        params: params.length,
      });
    }
    
    return rows;
  } catch (error) {
    logger.error('쿼리 실행 실패', {
      sql: sql.substring(0, 200),
      params,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * 트랜잭션 실행 헬퍼
 * @param {Function} callback - 트랜잭션 콜백 함수 (connection 인자 받음)
 * @returns {Promise<any>} 콜백 결과
 */
export const transaction = async (callback) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    logger.debug('트랜잭션 시작');
    
    const result = await callback(connection);
    
    await connection.commit();
    logger.debug('트랜잭션 커밋 완료');
    
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('트랜잭션 롤백', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * 단일 레코드 조회
 * @param {string} sql - SQL 쿼리
 * @param {Array} params - 파라미터 배열
 * @returns {Promise<object|null>} 조회 결과 (없으면 null)
 */
export const queryOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * INSERT 후 생성된 ID 반환
 * @param {string} sql - INSERT 쿼리
 * @param {Array} params - 파라미터 배열
 * @returns {Promise<number>} 생성된 ID
 */
export const insert = async (sql, params = []) => {
  const startTime = Date.now();
  let connection;
  
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute(sql, params);
    
    const executionTime = Date.now() - startTime;
    
    if (process.env.LOG_LEVEL === 'debug') {
      logger.db(sql, executionTime, {
        insertId: result.insertId,
        affectedRows: result.affectedRows,
      });
    }
    
    return result.insertId;
  } catch (error) {
    logger.error('INSERT 실행 실패', {
      sql: sql.substring(0, 200),
      params,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * UPDATE/DELETE 후 영향받은 행 수 반환
 * @param {string} sql - UPDATE/DELETE 쿼리
 * @param {Array} params - 파라미터 배열
 * @returns {Promise<number>} 영향받은 행 수
 */
export const execute = async (sql, params = []) => {
  const startTime = Date.now();
  let connection;
  
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute(sql, params);
    
    const executionTime = Date.now() - startTime;
    
    if (process.env.LOG_LEVEL === 'debug') {
      logger.db(sql, executionTime, {
        affectedRows: result.affectedRows,
      });
    }
    
    return result.affectedRows;
  } catch (error) {
    logger.error('쿼리 실행 실패', {
      sql: sql.substring(0, 200),
      params,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Connection Pool 종료
 * (애플리케이션 종료 시 호출)
 */
export const closePool = async () => {
  try {
    await pool.end();
    logger.info('MariaDB Connection Pool 종료 완료');
  } catch (error) {
    logger.error('MariaDB Connection Pool 종료 실패', {
      error: error.message,
    });
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
    config: {
      connectionLimit: dbConfig.connectionLimit,
      host: dbConfig.host,
      database: dbConfig.database,
    },
  };
};

// Pool 기본 export
export default pool;
