import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

// Gzip 압축
app.use(compression());

// 정적 파일 서빙 (올바른 MIME 타입 자동 설정)
app.use(express.static(join(__dirname, 'dist'), {
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    // HTML 파일은 캐시 안 함
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    // JS/CSS 파일은 영구 캐시 (해시로 버전 관리)
    else if (filePath.match(/\.(js|css|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // 이미지는 중간 캐시
    else if (filePath.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// SPA 폴백: API 요청이 아닌 모든 GET 요청에 대해 index.html 반환
app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Frontend server running on port ${PORT}`);
  console.log(`📂 Serving: ${join(__dirname, 'dist')}`);
});


