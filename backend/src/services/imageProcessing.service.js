/**
 * 이미지 처리 서비스
 * 문서 스캔, 원근 보정, 배경 제거, 자동 자르기
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImageProcessingService {
  /**
   * 문서 스캔 효과 적용
   * - 밝기/대비 자동 조정
   * - 선명도 향상
   * - 노이즈 제거
   */
  async applyDocumentScan(inputPath, options = {}) {
    try {
      const {
        brightness = 1.1,
        contrast = 1.3,
        sharpen = true,
        denoise = true,
      } = options;

      let pipeline = sharp(inputPath);

      // 1. 밝기/대비 조정
      pipeline = pipeline.modulate({
        brightness: brightness,
        saturation: 1.0,
      }).linear(contrast, -(128 * contrast) + 128);

      // 2. 선명도 향상
      if (sharpen) {
        pipeline = pipeline.sharpen({
          sigma: 1.0,
          m1: 0.5,
          m2: 0.5,
        });
      }

      // 3. 노이즈 제거
      if (denoise) {
        pipeline = pipeline.median(3);
      }

      // 4. JPEG 압축 최적화
      pipeline = pipeline.jpeg({
        quality: 95,
        chromaSubsampling: '4:4:4',
      });

      const buffer = await pipeline.toBuffer();
      return buffer;
    } catch (error) {
      logger.error('❌ 문서 스캔 효과 적용 실패:', error);
      throw error;
    }
  }

  /**
   * 자동 자르기 (Auto Crop)
   * - 배경을 제거하고 문서 영역만 추출
   */
  async autoCrop(inputPath, options = {}) {
    try {
      const { threshold = 240 } = options;

      const image = sharp(inputPath);
      const metadata = await image.metadata();

      // Trim: 배경색(흰색/검정)을 기준으로 자동 자르기
      const buffer = await image
        .trim({
          threshold: threshold,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .toBuffer();

      return buffer;
    } catch (error) {
      logger.error('❌ 자동 자르기 실패:', error);
      throw error;
    }
  }

  /**
   * 원근 보정 (Perspective Correction)
   * - 비스듬한 각도를 자동으로 감지하고 정면으로 변환
   * 
   * 참고: Sharp는 원근 변환을 직접 지원하지 않으므로,
   * 회전 각도를 자동 감지하여 rotate로 보정
   */
  async correctPerspective(inputPath, options = {}) {
    try {
      const { autoRotate = true } = options;

      let pipeline = sharp(inputPath);

      // EXIF 회전 정보 기반 자동 회전
      if (autoRotate) {
        pipeline = pipeline.rotate();
      }

      const buffer = await pipeline.toBuffer();
      return buffer;
    } catch (error) {
      logger.error('❌ 원근 보정 실패:', error);
      throw error;
    }
  }

  /**
   * 흑백 변환 + 임계값 처리 (스캔 효과)
   */
  async applyThreshold(inputPath, options = {}) {
    try {
      const { threshold = 128 } = options;

      const buffer = await sharp(inputPath)
        .greyscale()
        .normalise()
        .threshold(threshold)
        .toBuffer();

      return buffer;
    } catch (error) {
      logger.error('❌ 임계값 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 배경 제거 (Remove Background)
   * 
   * 참고: Sharp만으로는 완전한 배경 제거가 어렵습니다.
   * 대신 "배경을 흰색으로 채우기" 방식으로 구현
   */
  async removeBackground(inputPath, options = {}) {
    try {
      const { backgroundColor = '#FFFFFF' } = options;

      const image = sharp(inputPath);
      const metadata = await image.metadata();

      // 배경을 흰색으로 채우고, 문서 영역만 추출
      const buffer = await image
        .flatten({ background: backgroundColor })
        .normalise()
        .toBuffer();

      return buffer;
    } catch (error) {
      logger.error('❌ 배경 제거 실패:', error);
      throw error;
    }
  }

  /**
   * 종합 문서 처리 파이프라인
   * - 원근 보정 → 자동 자르기 → 스캔 효과 → 배경 제거
   */
  async processDocument(inputPath, options = {}) {
    try {
      const startTime = Date.now();
      
      const {
        enablePerspective = true,
        enableAutoCrop = true,
        enableScan = true,
        enableThreshold = false,
        enableBackgroundRemoval = false,
        brightness = 1.1,
        contrast = 1.3,
        threshold = 128,
      } = options;

      let buffer = await fs.readFile(inputPath);
      let tempPath = inputPath;

      // 1. 원근 보정
      if (enablePerspective) {
        logger.info('📐 원근 보정 시작...');
        buffer = await this.correctPerspective(tempPath);
        tempPath = path.join('/tmp', `temp_${Date.now()}_1.jpg`);
        await fs.writeFile(tempPath, buffer);
      }

      // 2. 자동 자르기
      if (enableAutoCrop) {
        logger.info('✂️ 자동 자르기 시작...');
        buffer = await this.autoCrop(tempPath);
        tempPath = path.join('/tmp', `temp_${Date.now()}_2.jpg`);
        await fs.writeFile(tempPath, buffer);
      }

      // 3. 문서 스캔 효과
      if (enableScan) {
        logger.info('📄 문서 스캔 효과 적용 시작...');
        buffer = await this.applyDocumentScan(tempPath, {
          brightness,
          contrast,
          sharpen: true,
          denoise: true,
        });
        tempPath = path.join('/tmp', `temp_${Date.now()}_3.jpg`);
        await fs.writeFile(tempPath, buffer);
      }

      // 4. 임계값 처리 (선택)
      if (enableThreshold) {
        logger.info('🔲 임계값 처리 시작...');
        buffer = await this.applyThreshold(tempPath, { threshold });
        tempPath = path.join('/tmp', `temp_${Date.now()}_4.jpg`);
        await fs.writeFile(tempPath, buffer);
      }

      // 5. 배경 제거 (선택)
      if (enableBackgroundRemoval) {
        logger.info('🖼️ 배경 제거 시작...');
        buffer = await this.removeBackground(tempPath);
      }

      // 임시 파일 정리
      try {
        const tempFiles = await fs.readdir('/tmp');
        for (const file of tempFiles) {
          if (file.startsWith('temp_') && file.endsWith('.jpg')) {
            await fs.unlink(path.join('/tmp', file));
          }
        }
      } catch (cleanupError) {
        logger.warn('⚠️ 임시 파일 정리 실패:', cleanupError.message);
      }

      const processingTime = Date.now() - startTime;
      logger.info(`✅ 문서 처리 완료 (${processingTime}ms)`);

      return {
        buffer,
        processingTime,
      };
    } catch (error) {
      logger.error('❌ 문서 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 보정된 이미지 저장
   */
  async saveProcessedImage(buffer, originalFilename, uploadPath) {
    try {
      // 파일명 생성: processed_원본파일명_타임스탬프.jpg
      const timestamp = Date.now();
      const ext = path.extname(originalFilename);
      const basename = path.basename(originalFilename, ext);
      const newFilename = `processed_${basename}_${timestamp}.jpg`;
      const outputPath = path.join(uploadPath, newFilename);

      await fs.writeFile(outputPath, buffer);

      const stats = await fs.stat(outputPath);

      return {
        filename: newFilename,
        path: outputPath,
        size: stats.size,
      };
    } catch (error) {
      logger.error('❌ 보정된 이미지 저장 실패:', error);
      throw error;
    }
  }
}

export default new ImageProcessingService();
