/**
 * ========================================
 * Document Scanner 유틸리티
 * ========================================
 * 설명: 이미지를 스캔 문서 품질로 변환
 *       - 자동 원근 보정
 *       - 대비 향상
 *       - 그레이스케일 변환
 *       - 노이즈 제거
 * ========================================
 */

/**
 * 이미지를 스캔 문서 품질로 변환
 * @param {File|Blob} imageFile - 원본 이미지 파일
 * @param {Object} options - 변환 옵션
 * @returns {Promise<Blob>} - 변환된 이미지
 */
export async function scanDocument(imageFile, options = {}) {
  const {
    grayscale = true,          // 흑백 변환
    contrast = 1.5,            // 대비 (1.0 = 원본, 1.5 = 50% 향상)
    brightness = 1.1,          // 밝기 (1.0 = 원본)
    sharpen = true,            // 선명도 향상
    quality = 0.92,            // JPEG 품질 (0.0 ~ 1.0)
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      try {
        // Canvas 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 원본 이미지 그리기
        ctx.drawImage(img, 0, 0);
        
        // 이미지 데이터 가져오기
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 1. 그레이스케일 변환 (선택적)
        if (grayscale) {
          for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
          }
        }
        
        // 2. 대비 및 밝기 조정
        for (let i = 0; i < data.length; i += 4) {
          // 대비
          data[i] = ((data[i] - 128) * contrast + 128) * brightness;
          data[i + 1] = ((data[i + 1] - 128) * contrast + 128) * brightness;
          data[i + 2] = ((data[i + 2] - 128) * contrast + 128) * brightness;
          
          // 값 범위 제한 (0-255)
          data[i] = Math.max(0, Math.min(255, data[i]));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
        }
        
        // 3. 선명도 향상 (언샤프 마스크 간소화 버전)
        if (sharpen) {
          const tempData = new Uint8ClampedArray(data);
          const w = canvas.width;
          const h = canvas.height;
          
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const i = (y * w + x) * 4;
              
              // 간단한 언샤프 마스크 필터
              for (let c = 0; c < 3; c++) {
                const center = tempData[i + c];
                const top = tempData[((y - 1) * w + x) * 4 + c];
                const bottom = tempData[((y + 1) * w + x) * 4 + c];
                const left = tempData[(y * w + (x - 1)) * 4 + c];
                const right = tempData[(y * w + (x + 1)) * 4 + c];
                
                const avg = (top + bottom + left + right) / 4;
                const sharpened = center + (center - avg) * 0.5;
                
                data[i + c] = Math.max(0, Math.min(255, sharpened));
              }
            }
          }
        }
        
        // 처리된 이미지 데이터 적용
        ctx.putImageData(imageData, 0, 0);
        
        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log('✅ 문서 스캔 완료:', {
                원본크기: (imageFile.size / 1024).toFixed(2) + 'KB',
                변환크기: (blob.size / 1024).toFixed(2) + 'KB',
                압축률: ((1 - blob.size / imageFile.size) * 100).toFixed(1) + '%'
              });
              resolve(blob);
            } else {
              reject(new Error('Blob 변환 실패'));
            }
          },
          'image/jpeg',
          quality
        );
        
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('이미지 로드 실패'));
    };

    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'));
    };

    reader.readAsDataURL(imageFile);
  });
}

/**
 * 자동 문서 감지 및 원근 보정 (고급 기능)
 * @param {File|Blob} imageFile - 원본 이미지
 * @returns {Promise<Blob>} - 보정된 이미지
 */
export async function autoDetectDocument(imageFile) {
  // 향후 구현: OpenCV.js 또는 TensorFlow.js 사용
  console.log('⚠️ 자동 문서 감지는 향후 구현 예정');
  return scanDocument(imageFile);
}

/**
 * 빠른 스캔 프리셋
 */
export const SCAN_PRESETS = {
  // 일반 문서 (기본)
  document: {
    grayscale: true,
    contrast: 1.5,
    brightness: 1.1,
    sharpen: true,
    quality: 0.92,
  },
  
  // 컬러 보존 (사진 포함 문서)
  color: {
    grayscale: false,
    contrast: 1.3,
    brightness: 1.05,
    sharpen: true,
    quality: 0.92,
  },
  
  // 고대비 (흐린 문서)
  highContrast: {
    grayscale: true,
    contrast: 2.0,
    brightness: 1.2,
    sharpen: true,
    quality: 0.90,
  },
  
  // 원본 유지 (압축만)
  original: {
    grayscale: false,
    contrast: 1.0,
    brightness: 1.0,
    sharpen: false,
    quality: 0.95,
  },
};
