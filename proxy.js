/**
 * ========================================
 * 리버스 프록시 서버
 * ========================================
 * 포트 8080에서 실행되며:
 * - / → 프론트엔드 (포트 9000)
 * - /api → 백엔드 (포트 3200)
 * - /socket.io → WebSocket (포트 3200)
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 8080;

// ========================================
// 백엔드 API 프록시
// ========================================
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3200',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api' // 경로 유지
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.originalUrl} → http://localhost:3200${req.url}`);
  },
  onError: (err, req, res) => {
    console.error(`[Proxy Error] ${req.method} ${req.path}:`, err.message);
    res.status(502).json({ 
      error: 'Bad Gateway',
      message: '백엔드 서버에 연결할 수 없습니다.',
      details: err.message 
    });
  }
}));

// ========================================
// WebSocket 프록시
// ========================================
app.use('/socket.io', createProxyMiddleware({
  target: 'http://localhost:3200',
  changeOrigin: true,
  ws: true, // WebSocket 지원
  pathRewrite: {
    '^/socket.io': '/socket.io' // 경로 유지
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] WebSocket ${req.originalUrl} → http://localhost:3200${req.url}`);
  },
  onError: (err, req, res) => {
    console.error(`[Proxy Error] WebSocket ${req.path}:`, err.message);
  }
}));

// ========================================
// 프론트엔드 프록시 (모든 나머지 요청)
// ========================================
app.use('/', createProxyMiddleware({
  target: 'http://localhost:9000',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.path} → http://localhost:9000`);
  },
  onError: (err, req, res) => {
    console.error(`[Proxy Error] ${req.method} ${req.path}:`, err.message);
    res.status(502).json({ 
      error: 'Bad Gateway',
      message: '프론트엔드 서버에 연결할 수 없습니다.',
      details: err.message 
    });
  }
}));

// ========================================
// 서버 시작
// ========================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('🌐 리버스 프록시 서버 시작');
  console.log('========================================');
  console.log(`📍 프록시 포트: ${PORT}`);
  console.log(`🎨 프론트엔드: http://localhost:9000`);
  console.log(`🔧 백엔드: http://localhost:3200`);
  console.log(`🔌 WebSocket: http://localhost:3200`);
  console.log('========================================');
});

// WebSocket 업그레이드 처리
server.on('upgrade', (req, socket, head) => {
  console.log(`[Proxy] WebSocket Upgrade: ${req.url}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM 수신, 서버 종료 중...');
  server.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT 수신, 서버 종료 중...');
  server.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});
