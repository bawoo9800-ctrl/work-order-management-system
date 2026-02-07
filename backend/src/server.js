/**
 * ========================================
 * 서버 시작점
 * ========================================
 * 파일: src/server.js
 * 설명: HTTP 서버 시작 및 초기화
 *       - 환경 변수 로딩
 *       - 데이터베이스 연결 테스트
 *       - Express 서버 시작
 *       - Graceful Shutdown 처리
 * ========================================
 */

import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app.js';
import { testConnection, closePool } from './config/database.js';
import logger from './utils/logger.js';
import { initializeSocket, getConnectedClientsCount } from './socket/socket.js';

/**
 * 환경 변수 로딩
 */
dotenv.config();

/**
 * 포트 설정
 */
const PORT = process.env.PORT || 3200;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * 서버 인스턴스
 */
let server;
let io;

/**
 * 서버 시작 함수
 */
const startServer = async () => {
  try {
    logger.info('서버 시작 중...', {
      environment: NODE_ENV,
      port: PORT,
    });
    
    // 데이터베이스 연결 테스트
    logger.info('데이터베이스 연결 테스트 중...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      logger.error('데이터베이스 연결 실패. 서버를 시작할 수 없습니다.');
      process.exit(1);
    }
    
    logger.info('데이터베이스 연결 성공 ✓');
    
    // HTTP 서버 생성
    const httpServer = createServer(app);
    
    // Socket.IO 초기화
    io = initializeSocket(httpServer);
    logger.info('🔌 Socket.IO 서버가 초기화되었습니다.');
    
    // HTTP 서버 시작
    server = httpServer.listen(PORT, () => {
      logger.info(`🚀 서버가 시작되었습니다!`, {
        port: PORT,
        environment: NODE_ENV,
        url: `http://localhost:${PORT}`,
        healthCheck: `http://localhost:${PORT}/health`,
        apiDocs: `http://localhost:${PORT}/api/v1`,
      });
      
      logger.info('═'.repeat(50));
      logger.info('📋 작업지시서 관리 시스템 Backend v1.0.0');
      logger.info('═'.repeat(50));
      logger.info(`🌐 서버 주소: http://localhost:${PORT}`);
      logger.info(`🏥 헬스체크: http://localhost:${PORT}/health`);
      logger.info(`📊 통계 API: http://localhost:${PORT}/api/v1/stats`);
      logger.info(`👥 거래처 API: http://localhost:${PORT}/api/v1/clients`);
      logger.info(`🔌 WebSocket: 연결 대기 중... (현재 ${getConnectedClientsCount()}명 연결)`);
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

/**
 * Graceful Shutdown 처리
 * - SIGTERM, SIGINT 신호 처리
 * - 진행 중인 요청 완료 대기
 * - 데이터베이스 연결 종료
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} 신호 수신. Graceful Shutdown 시작...`);
  
  if (server) {
    server.close(async () => {
      logger.info('HTTP 서버 종료 완료');
      
      // Socket.IO 연결 종료
      if (io) {
        io.close(() => {
          logger.info('Socket.IO 서버 종료 완료');
        });
      }
      
      // 데이터베이스 연결 종료
      await closePool();
      
      logger.info('모든 리소스 정리 완료. 프로세스 종료.');
      process.exit(0);
    });
    
    // 30초 후 강제 종료
    setTimeout(() => {
      logger.error('Graceful Shutdown 타임아웃. 강제 종료.');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

/**
 * 프로세스 신호 핸들러 등록
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * 처리되지 않은 Promise Rejection 핸들러
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('처리되지 않은 Promise Rejection', {
    reason,
    promise,
  });
  
  // 프로덕션 환경에서는 서버 재시작 권장
  if (NODE_ENV === 'production') {
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

/**
 * 처리되지 않은 예외 핸들러
 */
process.on('uncaughtException', (error) => {
  logger.error('처리되지 않은 예외 발생', {
    error: error.message,
    stack: error.stack,
  });
  
  // 예외 발생 시 서버 종료 (안전하지 않은 상태)
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

/**
 * 서버 시작
 */
startServer();
