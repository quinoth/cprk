// src/services/api.ts
// Центральный сервис для работы с бэкендом

export const API_GATEWAY = 'http://localhost:8000'; // API Gateway (BFF)

// Сервисы бэкенда
export const SERVICES = {
  AUTH: 'http://localhost:8001',
  DOCFLOW: 'http://localhost:8002',
  ADMIN: 'http://localhost:8003',
  WORKFLOW: 'http://localhost:8004',
  CHAT: 'http://localhost:8005',
  ANALYTICS: 'http://localhost:8006',
  LOGGING: 'http://localhost:8007',
  VIDEO: 'http://localhost:8008',
};

// Базовая конфигурация запросов
const defaultHeaders = {
  'Content-Type': 'application/json',
};

// Получение токена из localStorage
const getAuthToken = () => localStorage.getItem('authToken');

// Обогащение заголовков авторизацией
const getHeaders = (additionalHeaders = {}) => {
  const token = getAuthToken();
  return {
    ...defaultHeaders,
    ...(token && { Authorization: `Bearer ${token}` }),
    ...additionalHeaders,
  };
};

// Обработка ошибок
const handleError = (error: any) => {
  if (error.response?.status === 401) {
    // Токен истёк, перенаправляем на вход
    localStorage.removeItem('authToken');
    window.location.href = '/auth';
  }
  throw error;
};

// ========== AUTH SERVICE ==========
export const authAPI = {
  register: async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    const response = await fetch(`${SERVICES.AUTH}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${SERVICES.AUTH}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    // Сохраняем токен
    if (data.token) localStorage.setItem('authToken', data.token);
    return data;
  },

  forgotPassword: async (email: string) => {
    const response = await fetch(`${SERVICES.AUTH}/auth/forgot-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error('Forgot password request failed');
    return response.json();
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await fetch(`${SERVICES.AUTH}/auth/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ token, newPassword }),
    });
    if (!response.ok) throw new Error('Reset password failed');
    return response.json();
  },

  confirmCode: async (email: string, code: string) => {
    const response = await fetch(`${SERVICES.AUTH}/auth/confirm-code`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, code }),
    });
    if (!response.ok) throw new Error('Code confirmation failed');
    return response.json();
  },
};

// ========== BFF (Backend for Frontend) ==========
export const bffAPI = {
  getProfile: async () => {
    const response = await fetch(`${API_GATEWAY}/bff/profile`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) handleError({ response });
    return response.json();
  },

  getSidebarMenu: async () => {
    const response = await fetch(`${API_GATEWAY}/bff/sidebar-menu`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) handleError({ response });
    return response.json();
  },
};

// ========== ADMIN SERVICE ==========
export const adminAPI = {
  getUsers: async () => {
    const response = await fetch(`${SERVICES.ADMIN}/api/admin/users`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) handleError({ response });
    return response.json();
  },

  createUnderground: async (data: any) => {
    const response = await fetch(`${SERVICES.ADMIN}/api/admin/underground`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create underground');
    return response.json();
  },

  importUnderground: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${SERVICES.ADMIN}/api/admin/underground/import`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      body: formData,
    });
    if (!response.ok) throw new Error('Import failed');
    return response.json();
  },

  updateUserPermissions: async (userId: string, permissions: any) => {
    const response = await fetch(`${SERVICES.ADMIN}/api/admin/users/${userId}/permissions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(permissions),
    });
    if (!response.ok) throw new Error('Failed to update permissions');
    return response.json();
  },

  deleteUser: async (userId: string) => {
    const response = await fetch(`${SERVICES.ADMIN}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  },

  restoreUser: async (userId: string) => {
    const response = await fetch(`${SERVICES.ADMIN}/api/admin/users/${userId}/restore`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to restore user');
    return response.json();
  },

  getTrash: async () => {
    const response = await fetch(`${SERVICES.ADMIN}/api/admin/traish`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) handleError({ response });
    return response.json();
  },
};

// ========== ANALYTICS SERVICE ==========
export const analyticsAPI = {
  getTestStats: async () => {
    const response = await fetch(`${SERVICES.ANALYTICS}/api/analytics/dashboards/test-stats`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch test stats');
    return response.json();
  },

  getChatMonitoring: async () => {
    const response = await fetch(`${SERVICES.ANALYTICS}/api/analytics/dashboards/chat-monitoring`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch chat monitoring');
    return response.json();
  },

  getRegionalTrends: async () => {
    const response = await fetch(`${SERVICES.ANALYTICS}/api/analytics/dashboards/regional-trends`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch regional trends');
    return response.json();
  },

  exportCSV: async (query?: string) => {
    const url = new URL(`${SERVICES.ANALYTICS}/api/analytics/export/csv`);
    if (query) url.searchParams.append('query', query);
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  },

  exportPDF: async (query?: string) => {
    const url = new URL(`${SERVICES.ANALYTICS}/api/analytics/export/pdf`);
    if (query) url.searchParams.append('query', query);
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  },

  getChatHistory: async (userEmail: string) => {
    const response = await fetch(`${SERVICES.ANALYTICS}/api/analytics/chat-history/${userEmail}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch chat history');
    return response.json();
  },
};

// ========== CHAT SERVICE ==========
export const chatAPI = {
  sendMessage: async (data: { recipientId: string; text: string }) => {
    const response = await fetch(`${SERVICES.CHAT}/api/chat/message`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  createGroup: async (data: { name: string; members: string[] }) => {
    const response = await fetch(`${SERVICES.CHAT}/api/chat/group`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create group');
    return response.json();
  },

  addToGroup: async (groupId: string, userId: string) => {
    const response = await fetch(`${SERVICES.CHAT}/api/chat/group/${groupId}/add`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) throw new Error('Failed to add user to group');
    return response.json();
  },

  removeFromGroup: async (groupId: string, userId: string) => {
    const response = await fetch(`${SERVICES.CHAT}/api/chat/group/${groupId}/remove/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to remove user from group');
    return response.json();
  },

  sendGroupMessage: async (groupId: string, data: { text: string }) => {
    const response = await fetch(`${SERVICES.CHAT}/api/chat/group/${groupId}/message`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to send group message');
    return response.json();
  },

  sendBroadcast: async (data: { text: string; recipientIds: string[] }) => {
    const response = await fetch(`${SERVICES.CHAT}/api/chat/broadcast`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to send broadcast');
    return response.json();
  },

  getPrivateHistory: async () => {
    const response = await fetch(`${SERVICES.CHAT}/api/chat/history/private`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch private history');
    return response.json();
  },

  getGroupHistory: async (groupId: string) => {
    const response = await fetch(`${SERVICES.CHAT}/api/chat/history/group/${groupId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch group history');
    return response.json();
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${SERVICES.CHAT}/api/files/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      body: formData,
    });
    if (!response.ok) throw new Error('File upload failed');
    return response.json();
  },

  getFile: async (filename: string) => {
    const response = await fetch(`${SERVICES.CHAT}/api/files/${filename}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch file');
    return response.blob();
  },
};

// ========== DOCFLOW SERVICE ==========
export const docflowAPI = {
  createDocument: async (data: any) => {
    const response = await fetch(`${SERVICES.DOCFLOW}/api/docs/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create document');
    return response.json();
  },

  signDocument: async (docId: string, data: any) => {
    const response = await fetch(`${SERVICES.DOCFLOW}/api/docs/sign/${docId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to sign document');
    return response.json();
  },

  updateDocument: async (docId: string, data: any) => {
    const response = await fetch(`${SERVICES.DOCFLOW}/api/docs/update/${docId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update document');
    return response.json();
  },

  getDocumentHistory: async (docId: string) => {
    const response = await fetch(`${SERVICES.DOCFLOW}/api/docs/history/${docId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch document history');
    return response.json();
  },

  searchDocuments: async (query: string) => {
    const response = await fetch(`${SERVICES.DOCFLOW}/api/docs/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to search documents');
    return response.json();
  },

  archiveDocument: async (docId: string) => {
    const response = await fetch(`${SERVICES.DOCFLOW}/api/docs/archive/${docId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to archive document');
    return response.json();
  },
};

// ========== WORKFLOW SERVICE (Tests) ==========
export const workflowAPI = {
  updateTest: async (testId: string, data: any) => {
    const response = await fetch(`${SERVICES.WORKFLOW}/api/admin/fests/${testId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update test');
    return response.json();
  },

  getSpecifications: async () => {
    const response = await fetch(`${SERVICES.WORKFLOW}/api/bank/specsions`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch specifications');
    return response.json();
  },

  createSpecification: async (data: any) => {
    const response = await fetch(`${SERVICES.WORKFLOW}/api/bank/specsions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create specification');
    return response.json();
  },

  updateSpecification: async (gld: string, data: any) => {
    const response = await fetch(`${SERVICES.WORKFLOW}/api/bank/specsions/${gld}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update specification');
    return response.json();
  },

  deleteSpecification: async (gld: string) => {
    const response = await fetch(`${SERVICES.WORKFLOW}/api/bank/specsions/${gld}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete specification');
    return response.json();
  },

  startTest: async (testId: string) => {
    const response = await fetch(`${SERVICES.WORKFLOW}/api/test/start/${testId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to start test');
    return response.json();
  },

  submitAnswer: async (data: { testId: string; questionId: string; answer: any }) => {
    const response = await fetch(`${SERVICES.WORKFLOW}/api/test/answer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to submit answer');
    return response.json();
  },
};

// ========== VIDEO SERVICE ==========
export const videoAPI = {
  createSession: async (data: { title: string; scheduledTime: string; participantIds: string[] }) => {
    const response = await fetch(`${SERVICES.VIDEO}/api/video/session`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create video session');
    return response.json();
  },

  getMySessions: async () => {
    const response = await fetch(`${SERVICES.VIDEO}/api/video/sessions/my`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return response.json();
  },

  getCalendarEvent: async (sessionId: string) => {
    const response = await fetch(`${SERVICES.VIDEO}/api/video/events/${sessionId}.ics`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch calendar event');
    return response.text();
  },

  syncRecordings: async () => {
    const response = await fetch(`${SERVICES.VIDEO}/api/video/recordings/sync`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to sync recordings');
    return response.json();
  },

  getRecordings: async () => {
    const response = await fetch(`${SERVICES.VIDEO}/api/video/recordings`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch recordings');
    return response.json();
  },

  startSession: async (sessionId: string) => {
    const response = await fetch(`${SERVICES.VIDEO}/api/video/session/${sessionId}/start`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to start session');
    return response.json();
  },

  endSession: async (sessionId: string) => {
    const response = await fetch(`${SERVICES.VIDEO}/api/video/session/${sessionId}/end`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to end session');
    return response.json();
  },
};

// ========== LOGGING SERVICE ==========
export const loggingAPI = {
  getLogs: async (filters?: { userId?: string; action?: string; dateFrom?: string; dateTo?: string }) => {
    const url = new URL(`${SERVICES.LOGGING}/api/logs`);
    if (filters?.userId) url.searchParams.append('userId', filters.userId);
    if (filters?.action) url.searchParams.append('action', filters.action);
    if (filters?.dateFrom) url.searchParams.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) url.searchParams.append('dateTo', filters.dateTo);

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) handleError({ response });
    return response.json();
  },
};

// Экспорт всех API для удобного использования
export default {
  authAPI,
  bffAPI,
  adminAPI,
  analyticsAPI,
  chatAPI,
  docflowAPI,
  workflowAPI,
  videoAPI,
  loggingAPI,
};