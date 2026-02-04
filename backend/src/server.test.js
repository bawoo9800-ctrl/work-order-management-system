/**
 * ========================================
 * 서버 시작점 (테스트 모드)
 * ========================================
 * 파일: src/server.test.js
 * 설명: 데이터베이스 없이 서버 기능 테스트
 * ========================================
 */

import dotenv from 'dotenv';
import app from './app.js';
import logger from './utils/logger.js';

// 환경 변수 로딩
dotenv.config();

const PORT = process.env.PORT || 3200;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;

const startServer = async () => {
  try {
    logger.info('테스트 서버 시작 중... (DB 연결 스킵)', {
      environment: NODE_ENV,
      port: PORT,
    });
    
    logger.warn('⚠️  테스트 모드: 데이터베이스 연결 없이 서버 시작');
    
    // HTTP 서버 시작
    server = app.listen(PORT, () => {
      logger.info(`🚀 테스트 서버가 시작되었습니다!`, {
        port: PORT,
        environment: NODE_ENV,
        url: `http://localhost:${PORT}`,
        healthCheck: `http://localhost:${PORT}/health`,
        apiDocs: `http://localhost:${PORT}/api/v1`,
      });
      
      logger.info('═'.repeat(50));
      logger.info('📋 작업지시서 관리 시스템 Backend v1.0.0 (TEST MODE)');
      logger.info('═'.repeat(50));
      logger.info(`🌐 서버 주소: http://localhost:${PORT}`);
      logger.info(`🏥 헬스체크: http://localhost:${PORT}/health`);
      logger.info(`📊 API 정보: http://localhost:${PORT}/api/v1`);
      logger.info('⚠️  데이터베이스 기능은 사용할 수 없습니다.');
      logger.info('═'.repeat(50));
    });
    
  } catch (error) {
    logger.error('서버 시작 실패', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} 신호 수신. 서버 종료 중...`);
  
  if (server) {
    server.close(() => {
      logger.info('서버 종료 완료');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
