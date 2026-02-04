/**
 * API Client
 * Axios 기반 API 클라이언트
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200';

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
  // 업로드
  upload: async (file, strategy = 'auto') => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await apiClient.post(
      `/api/v1/work-orders/upload?strategy=${strategy}`,
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

  // 삭제
  delete: async (id) => {
    const response = await apiClient.delete(`/api/v1/work-orders/${id}`);
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

export default apiClient;
