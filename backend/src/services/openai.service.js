/**
 * ========================================
 * OpenAI API 서비스
 * ========================================
 * 파일: src/services/openai.service.js
 * 설명: OpenAI GPT-4o Vision API 연동
 *       - 이미지 분석 및 텍스트 추출
 *       - 거래처 자동 식별
 *       - 작업 내용 분석
 * ========================================
 */

import OpenAI from 'openai';
import fs from 'fs';
import logger from '../utils/logger.js';

/**
 * OpenAI 클라이언트 초기화
 */
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

/**
 * 이미지를 Base64로 인코딩
 * @param {string} imagePath - 이미지 파일 경로
 * @returns {Promise<string>} Base64 인코딩된 이미지
 */
export const encodeImageToBase64 = async (imagePath) => {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    return base64Image;
  } catch (error) {
    logger.error('이미지 Base64 인코딩 실패', {
      imagePath,
      error: error.message,
    });
    throw error;
  }
};

/**
 * GPT-4o Vision으로 이미지 분석
 * @param {string} imagePath - 분석할 이미지 경로
 * @param {Array} clients - 거래처 목록
 * @returns {Promise<object>} 분석 결과
 */
export const analyzeWorkOrderImage = async (imagePath, clients = []) => {
  const startTime = Date.now();

  try {
    // 이미지를 Base64로 인코딩
    const base64Image = await encodeImageToBase64(imagePath);

    // 거래처 목록을 프롬프트에 포함
    const clientList = clients
      .map((c) => `- ${c.name} (코드: ${c.code})`)
      .join('\n');

    // GPT-4o Vision 프롬프트
    const prompt = `당신은 작업지시서 이미지를 분석하는 전문가입니다.

다음 이미지를 분석하여 아래 정보를 추출해주세요:

1. **거래처명**: 이미지에서 회사명, 거래처명을 찾아주세요.
2. **작업 날짜**: 작업 예정일, 납기일 등의 날짜를 찾아주세요 (YYYY-MM-DD 형식).
3. **작업 내용**: 어떤 작업을 해야 하는지 간단히 요약해주세요.
4. **특이사항**: 중요한 메모나 특이사항이 있다면 알려주세요.

**등록된 거래처 목록**:
${clientList || '(거래처 정보 없음)'}

**응답 형식** (반드시 JSON 형식으로):
{
  "clientName": "추출된 거래처명 (또는 null)",
  "clientCode": "매칭된 거래처 코드 (또는 null)",
  "workDate": "YYYY-MM-DD (또는 null)",
  "workType": "작업 내용 요약 (50자 이내)",
  "notes": "특이사항 또는 메모",
  "confidence": 0.85,
  "reasoning": "분석 근거 설명"
}

**중요**: 
- 거래처명은 등록된 목록에서 가장 유사한 것을 선택하세요.
- 확실하지 않으면 confidence를 낮게 설정하세요.
- 날짜는 반드시 YYYY-MM-DD 형식으로 변환하세요.`;

    // GPT-4o Vision API 호출
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL_VISION || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.3,
    });

    const content = response.choices[0].message.content;
    const processingTime = Date.now() - startTime;

    // JSON 추출 (```json ... ``` 또는 {...} 형식)
    let analysisResult;
    try {
      // JSON 코드 블록 제거
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      
      const jsonString = jsonMatch[1] || content;
      analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
      logger.error('GPT-4o 응답 파싱 실패', {
        content,
        error: parseError.message,
      });
      throw new Error('AI 응답을 파싱할 수 없습니다.');
    }

    // API 사용량 계산
    const apiCost = calculateCost(response.usage);

    logger.info('GPT-4o Vision 분석 완료', {
      imagePath,
      clientName: analysisResult.clientName,
      confidence: analysisResult.confidence,
      processingTime,
      apiCost,
      usage: response.usage,
    });

    return {
      ...analysisResult,
      apiCost,
      processingTime,
      usage: response.usage,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('GPT-4o Vision 분석 실패', {
      imagePath,
      error: error.message,
      stack: error.stack,
      processingTime,
    });

    throw error;
  }
};

/**
 * GPT-4o API 사용 비용 계산
 * @param {object} usage - API 사용량 정보
 * @returns {number} 비용 (USD)
 */
const calculateCost = (usage) => {
  if (!usage) return 0;

  // GPT-4o Vision 가격 (2024년 기준)
  // Input: $5 / 1M tokens
  // Output: $15 / 1M tokens
  const inputCost = (usage.prompt_tokens || 0) * 0.000005;
  const outputCost = (usage.completion_tokens || 0) * 0.000015;
  
  return inputCost + outputCost;
};

/**
 * 텍스트 기반 분류 (OCR 텍스트 사용)
 * @param {string} ocrText - OCR 추출 텍스트
 * @param {Array} clients - 거래처 목록
 * @returns {Promise<object>} 분석 결과
 */
export const classifyByText = async (ocrText, clients = []) => {
  const startTime = Date.now();

  try {
    const clientList = clients
      .map((c) => `- ${c.name} (코드: ${c.code}, 키워드: ${(c.keywords || []).join(', ')})`)
      .join('\n');

    const prompt = `다음 텍스트는 작업지시서에서 OCR로 추출한 내용입니다.
이 텍스트를 분석하여 거래처를 식별하고 작업 정보를 추출해주세요.

**OCR 텍스트**:
${ocrText}

**등록된 거래처 목록**:
${clientList || '(거래처 정보 없음)'}

**응답 형식** (반드시 JSON 형식으로):
{
  "clientName": "추출된 거래처명 (또는 null)",
  "clientCode": "매칭된 거래처 코드 (또는 null)",
  "workDate": "YYYY-MM-DD (또는 null)",
  "workType": "작업 내용 요약 (50자 이내)",
  "confidence": 0.85,
  "reasoning": "분석 근거 설명"
}`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL_TEXT || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 작업지시서 텍스트를 분석하는 전문가입니다.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    const analysisResult = JSON.parse(content);
    const processingTime = Date.now() - startTime;
    const apiCost = calculateCost(response.usage);

    logger.info('GPT-4o 텍스트 분류 완료', {
      clientName: analysisResult.clientName,
      confidence: analysisResult.confidence,
      processingTime,
      apiCost,
    });

    return {
      ...analysisResult,
      apiCost,
      processingTime,
      usage: response.usage,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('GPT-4o 텍스트 분류 실패', {
      error: error.message,
      processingTime,
    });

    throw error;
  }
};

export default {
  analyzeWorkOrderImage,
  classifyByText,
  encodeImageToBase64,
};
