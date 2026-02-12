/**
 * API Client
 * Axios 기반 API 클라이언트
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`[API Error]`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * 작업지시서 API
 */
export const workOrderAPI = {
  // 업로드 (수동 분류)
  upload: async (formData) => {
    const response = await apiClient.post(
      `/api/v1/work-orders/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // 목록 조회
  list: async (params = {}) => {
    const response = await apiClient.get('/api/v1/work-orders', { params });
    return response.data;
  },

  // 상세 조회
  getById: async (id) => {
    const response = await apiClient.get(`/api/v1/work-orders/${id}`);
    return response.data;
  },

  // UUID로 조회
  getByUuid: async (uuid) => {
    const response = await apiClient.get(`/api/v1/work-orders/uuid/${uuid}`);
    return response.data;
  },

  // 최근 업로드
  recent: async (limit = 10) => {
    const response = await apiClient.get('/api/v1/work-orders/recent', {
      params: { limit },
    });
    return response.data;
  },

  // 통계
  stats: async () => {
    const response = await apiClient.get('/api/v1/work-orders/stats/summary');
    return response.data;
  },

  // 수정
  update: async (id, data) => {
    const response = await apiClient.put(`/api/v1/work-orders/${id}`, data);
    return response.data;
  },

  // 삭제 (휴지통으로 이동)
  delete: async (id) => {
    const response = await apiClient.delete(`/api/v1/work-orders/${id}`);
    return response.data;
  },

  // 휴지통 조회
  trash: async (params = {}) => {
    const response = await apiClient.get('/api/v1/work-orders/trash', { params });
    return response.data;
  },

  // 복구
  restore: async (id) => {
    const response = await apiClient.post(`/api/v1/work-orders/${id}/restore`);
    return response.data;
  },

  // 영구 삭제
  permanentDelete: async (id) => {
    const response = await apiClient.delete(`/api/v1/work-orders/${id}/permanent`);
    return response.data;
  },

  // 재분류
  reclassify: async (id, clientId, reason) => {
    const response = await apiClient.post(`/api/v1/work-orders/${id}/reclassify`, {
      clientId,
      reason,
    });
    return response.data;
  },

  // 이미지 처리 (서버 측 고급 보정)
  processImage: async (id, options = {}) => {
    const response = await apiClient.post(`/api/v1/work-orders/${id}/process-image`, options);
    return response.data;
  },

  // 편집된 이미지 업로드
  uploadEditedImage: async (id, formData) => {
    const response = await apiClient.post(
      `/api/v1/work-orders/${id}/upload-edited-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // 이미지 추가 (추가촬영)
  addImage: async (id, formData) => {
    const response = await apiClient.post(
      `/api/v1/work-orders/${id}/add-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

/**
 * 거래처 API
 */
export const clientAPI = {
  // 목록 조회
  list: async () => {
    const response = await apiClient.get('/api/v1/clients');
    return response.data;
  },

  // 검색 (자동완성용)
  search: async (query) => {
    const response = await apiClient.get('/api/v1/clients/search', {
      params: { q: query },
    });
    return response.data;
  },

  // 상세 조회
  getById: async (id) => {
    const response = await apiClient.get(`/api/v1/clients/${id}`);
    return response.data;
  },

  // 통계
  stats: async () => {
    const response = await apiClient.get('/api/v1/clients/stats');
    return response.data;
  },

  // 거래처 생성
  create: async (clientData) => {
    const response = await apiClient.post('/api/v1/clients', clientData);
    return response.data;
  },
};

/**
 * 헬스 체크
 */
export const healthAPI = {
  check: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

/**
 * 알림 API
 */
export const notificationAPI = {
  // FCM 토큰 등록
  registerToken: async (token, userId = null, deviceInfo = null) => {
    const response = await apiClient.post('/api/v1/notifications/register', {
      token,
      userId,
      deviceInfo: deviceInfo || navigator.userAgent,
    });
    return response.data;
  },

  // FCM 토큰 삭제 (구독 해제)
  unregisterToken: async (token) => {
    const response = await apiClient.delete('/api/v1/notifications/unregister', {
      data: { token },
    });
    return response.data;
  },

  // 알림 상태 확인
  getStatus: async () => {
    const response = await apiClient.get('/api/v1/notifications/status');
    return response.data;
  },

  // 테스트 알림 전송
  sendTest: async (token) => {
    const response = await apiClient.post('/api/v1/notifications/test', {
      token,
    });
    return response.data;
  },
};

export default apiClient;
