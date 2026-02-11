import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 8080;

console.log('🚀 프록시 서버 초기화 중...');

// 전체를 백엔드 + 프론트엔드로 프록시
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3200',
  changeOrigin: true,
  router: (req) => {
    // API, 이미지, WebSocket은 백엔드로
    if (req.url.startsWith('/api') || 
        req.url.startsWith('/uploads') || 
        req.url.startsWith('/socket.io')) {
      console.log(`[→ Backend] ${req.method} ${req.url}`);
      return 'http://localhost:3200';
    }
    // 그 외는 프론트엔드로
    console.log(`[→ Frontend] ${req.method} ${req.url}`);
    return 'http://localhost:9000';
  },
  ws: true,
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[← ${proxyRes.statusCode}] ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error(`[Error] ${req.url}:`, err.message);
    res.status(502).json({
      success: false,
      error: { message: '서버 연결 실패' }
    });
  }
}));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('🌐 리버스 프록시 서버 시작 완료');
  console.log('========================================');
  console.log(`📍 프록시 포트: ${PORT}`);
  console.log(`🔧 백엔드: http://localhost:3200 (/api, /uploads, /socket.io)`);
  console.log(`🎨 프론트엔드: http://localhost:9000 (나머지)`);
  console.log('========================================');
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
