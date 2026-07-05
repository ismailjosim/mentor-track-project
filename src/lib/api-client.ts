/* eslint-disable @typescript-eslint/no-explicit-any */
import { CACHE_TAGS } from './cache-config';

const API_BASE_URL = typeof window === 'undefined' ? process.env.NEXT_PUBLIC_API_URL || '' : '';

interface FetchOptions extends RequestInit {
  cacheTags?: string[];
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    options?: FetchOptions
  ): Promise<{ data?: T; error?: string; statusCode: number; rawResponse?: any }> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const { cacheTags, ...fetchOptions } = options || {};
      const isBrowser = typeof window !== 'undefined';

      const nextConfig: any = {};

      if (cacheTags && !isBrowser && fetchOptions.method === 'GET') {
        nextConfig.tags = cacheTags;
      }

      const response = await fetch(url, {
        ...fetchOptions,
        next: Object.keys(nextConfig).length > 0 ? nextConfig : undefined,
        cache: fetchOptions.method === 'GET' && !isBrowser ? undefined : 'no-store',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      const responseData = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        return {
          error: (responseData.message as string) || 'An error occurred',
          statusCode: response.status,
        };
      }

      return {
        data: (responseData.data || responseData) as T,
        statusCode: response.status,
        rawResponse: responseData,
      };
    } catch (error) {
      console.error('API request error:', error);

      return {
        error: error instanceof Error ? error.message : 'An error occurred',
        statusCode: 500,
      };
    }
  }

  async get<T>(endpoint: string, options?: FetchOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, body?: any, options?: FetchOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any, options?: FetchOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, options?: FetchOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

export const studentApi = {
  getAll: () =>
    apiClient.get('/api/students', {
      cacheTags: [CACHE_TAGS.ALL_STUDENTS, CACHE_TAGS.STUDENT_LIST],
    }),

  getAllPaginated: (
    page: number = 1,
    limit: number = 10,
    search: string = '',
    status: string = '',
    filters: {
      device?: string;
      group?: string;
      progress?: string;
      programType?: string;
    } = {}
  ) => {
    const params = new URLSearchParams();

    params.set('page', page.toString());
    params.set('limit', limit.toString());

    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (filters.progress) params.set('progress', filters.progress);
    if (filters.group) params.set('group', filters.group);
    if (filters.device) params.set('device', filters.device);
    if (filters.programType) params.set('programType', filters.programType);

    const shouldCache =
      page === 1 &&
      !search &&
      !status &&
      !filters.progress &&
      !filters.group &&
      !filters.device &&
      !filters.programType;

    return apiClient.get(`/api/students?${params.toString()}`, {
      cacheTags: shouldCache ? [CACHE_TAGS.STUDENT_LIST] : undefined,
    });
  },

  getById: (id: string) =>
    apiClient.get(`/api/students/${id}`, {
      cacheTags: [`student-${id}`],
    }),

  create: (data: Record<string, unknown>) => apiClient.post('/api/students', data),

  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/api/students/${id}`, data),

  delete: (id: string) => apiClient.delete(`/api/students/${id}`),
};

export const assignmentApi = {
  getAll: () =>
    apiClient.get('/api/assignments', {
      cacheTags: [CACHE_TAGS.ASSIGNMENTS],
    }),

  getByStudentId: (studentId: string) =>
    apiClient.get(`/api/students/${studentId}/assignments`, {
      cacheTags: [CACHE_TAGS.ASSIGNMENTS],
    }),

  create: (studentId: string, data: Record<string, unknown>) =>
    apiClient.post(`/api/students/${studentId}/assignments`, data),

  update: (studentId: string, data: Record<string, unknown>) =>
    apiClient.put(`/api/students/${studentId}/assignments`, data),

  delete: (studentId: string, assignmentNumber: number) =>
    apiClient.delete(`/api/students/${studentId}/assignments?assignmentNumber=${assignmentNumber}`),
};

export const callLogApi = {
  getAll: () =>
    apiClient.get('/api/call-logs', {
      cacheTags: [CACHE_TAGS.CALL_LOGS, CACHE_TAGS.CALL_STATISTICS],
    }),

  getById: (id: string) =>
    apiClient.get(`/api/call-logs/${id}`, {
      cacheTags: [CACHE_TAGS.CALL_LOGS],
    }),

  create: (data: Record<string, unknown>) => apiClient.post('/api/call-logs', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/api/call-logs/${id}`, data),

  delete: (id: string) => apiClient.delete(`/api/call-logs/${id}`),
};

export const followUpApi = {
  getAll: () =>
    apiClient.get('/api/follow-ups', {
      cacheTags: [CACHE_TAGS.FOLLOW_UPS],
    }),

  getById: (id: string) =>
    apiClient.get(`/api/follow-ups/${id}`, {
      cacheTags: [CACHE_TAGS.FOLLOW_UPS],
    }),

  create: (data: Record<string, unknown>) => apiClient.post('/api/follow-ups', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/api/follow-ups/${id}`, data),

  delete: (id: string) => apiClient.delete(`/api/follow-ups/${id}`),
};

export const dashboardApi = {
  getOverview: () => apiClient.get('/api/dashboard'),

  getStats: () =>
    apiClient.get('/api/dashboard/stats', {
      cacheTags: [CACHE_TAGS.DASHBOARD_STATS],
    }),

  getFailingStudents: (page: number = 1, limit: number = 10) =>
    apiClient.get(`/api/dashboard/failing-students?page=${page}&limit=${limit}`, {
      cacheTags: [CACHE_TAGS.FAILING_STUDENTS],
    }),

  getCallQueue: (page: number = 1, limit: number = 10) =>
    apiClient.get(`/api/call-queue?page=${page}&limit=${limit}`, {
      cacheTags: [CACHE_TAGS.CALL_QUEUE_STUDENTS],
    }),

  getAssignmentStats: () =>
    apiClient.get('/api/dashboard/assignment-stats', {
      cacheTags: [CACHE_TAGS.SUBMISSION_DATA, CACHE_TAGS.DASHBOARD_STATS],
    }),
};

export const reportsApi = {
  generate: (sections: string[], onlyMentorshipGroup: boolean = false) => {
    const params = new URLSearchParams();
    params.set('sections', sections.join(','));
    if (onlyMentorshipGroup) params.set('onlyMentorshipGroup', 'true');

    return apiClient.get(`/api/reports?${params.toString()}`, {
      cacheTags: [CACHE_TAGS.REPORTS],
    });
  },
};
