/**
 * ========================================
 * 헬스체크 컨트롤러 (Health Controller)
 * ========================================
 * 파일: src/controllers/health.controller.js
 * 설명: 서버 및 시스템 상태 확인
 *       - 서버 가동 상태
 *       - 데이터베이스 연결 상태
 *       - 시스템 정보
 * ========================================
 */

import { testConnection, getPoolStatus } from '../config/database.js';
import os from 'os';

/**
 * 서버 헬스체크
 * GET /health
 */
export const healthCheck = async (req, res) => {
  const startTime = Date.now();
  
  // 데이터베이스 연결 테스트
  const dbConnected = await testConnection();
  
  const responseTime = Date.now() - startTime;
  
  // 시스템 정보
  const systemInfo = {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
    freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
    uptime: `${(os.uptime() / 3600).toFixed(2)} hours`,
    nodeVersion: process.version,
  };
  
  // Connection Pool 상태
  const poolStatus = getPoolStatus();
  
  // 전체 상태
  const status = dbConnected ? 'healthy' : 'unhealthy';
  
  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    data: {
      status,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      server: {
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3200,
        socketPort: process.env.SOCKET_PORT || 3201,
      },
      database: {
        connected: dbConnected,
        pool: poolStatus,
      },
      system: systemInfo,
    },
    error: dbConnected ? null : { message: '데이터베이스 연결 실패' },
  });
};

/**
 * 상세 통계 조회
 * GET /api/v1/stats
 */
export const getStats = async (req, res) => {
  // 데이터베이스에서 통계 조회
  const { query } = await import('../config/database.js');
  
  // 작업지시서 통계
  const workOrderStats = await query(`
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing,
      SUM(CASE WHEN status = 'classified' THEN 1 ELSE 0 END) AS classified,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
      SUM(CASE WHEN classification_method = 'keyword' THEN 1 ELSE 0 END) AS keyword_classified,
      SUM(CASE WHEN classification_method = 'ai_text' THEN 1 ELSE 0 END) AS ai_text_classified,
      SUM(CASE WHEN classification_method = 'ai_vision' THEN 1 ELSE 0 END) AS ai_vision_classified,
      SUM(CASE WHEN classification_method = 'manual' THEN 1 ELSE 0 END) AS manual_classified,
      AVG(confidence_score) AS avg_confidence,
      AVG(processing_time_ms) AS avg_processing_time_ms,
      SUM(api_cost_usd) AS total_api_cost
    FROM work_orders
  `);
  
  // 거래처 통계
  const clientStats = await query(`
    SELECT 
      COUNT(*) AS total_clients,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_clients
    FROM clients
  `);
  
  // 오늘의 API 비용
  const todayCost = await query(`
    SELECT 
      SUM(total_cost_usd) AS today_cost,
      SUM(total_calls) AS today_calls,
      SUM(total_tokens) AS today_tokens
    FROM api_cost_tracking
    WHERE date = CURDATE()
  `);
  
  res.json({
    success: true,
    data: {
      workOrders: workOrderStats[0],
      clients: clientStats[0],
      todayApiUsage: todayCost[0] || { today_cost: 0, today_calls: 0, today_tokens: 0 },
      timestamp: new Date().toISOString(),
    },
    error: null,
  });
};
