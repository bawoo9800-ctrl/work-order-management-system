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
  maxAge: 0, // HTML 캐시 안 함
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

// SPA 폴백: 모든 경로를 index.html로
app.get('*', (req, res) => {
  // API 요청이나 정적 파일이 아닌 경우에만 index.html 반환
  if (!req.path.startsWith('/api') && !req.path.includes('.')) {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  } else {
    res.status(404).send('Not Found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Frontend server running on port ${PORT}`);
  console.log(`📂 Serving: ${join(__dirname, 'dist')}`);
});

