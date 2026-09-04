// API Service for Enterprise Restaurant Ecosystem
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const API_TIMEOUT = 10000; // 10 seconds

// Create axios instance with default configuration
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for adding auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for handling token refresh
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expired, try to refresh
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
              refresh_token: refreshToken,
            });
            
            const newAccessToken = response.data.accessToken;
            const newRefreshToken = response.data.refreshToken;
            
            // Store new tokens
            localStorage.setItem('access_token', newAccessToken);
            localStorage.setItem('refresh_token', newRefreshToken);
            
            // Retry the original request
            return instance.request(error.config);
          }
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const api = createApiInstance();

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
  };
}

// Generic API methods
export const apiRequest = async <T>(
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  url: string,
  data?: any,
  config?: any
): Promise<ApiResponse<T>> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await api.request({
      method,
      url,
      data,
      ...config,
    });

    return response.data;
  } catch (error: any) {
    console.error('API Request Error:', error);
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR') {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection.',
        },
      };
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT_ERROR',
          message: 'Request timeout. Please try again.',
        },
      };
    }

    // Handle API errors
    if (error.response?.data) {
      return error.response.data;
    }

    // Unknown error
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred.',
        details: error,
      },
    };
  }
};

// Specific API methods
export const apiGet = <T>(url: string, config?: any): Promise<ApiResponse<T>> =>
  apiRequest<T>('get', url, undefined, config);

export const apiPost = <T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> =>
  apiRequest<T>('post', url, data, config);

export const apiPut = <T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> =>
  apiRequest<T>('put', url, data, config);

export const apiDelete = <T>(url: string, config?: any): Promise<ApiResponse<T>> =>
  apiRequest<T>('delete', url, undefined, config);

export const apiPatch = <T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> =>
  apiRequest<T>('patch', url, data, config);

// Utility functions
export const setAuthToken = (token: string): void => {
  localStorage.setItem('access_token', token);
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem('refresh_token', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

export const clearTokens = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Error handling utilities
export const handleApiError = (error: any): string => {
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Request cancellation utility
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

export const isCancel = (error: any): boolean => {
  return axios.isCancel(error);
};
