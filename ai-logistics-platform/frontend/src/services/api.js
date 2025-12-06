import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (updates) => api.put('/auth/profile', updates),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getAIInsights: () => api.get('/dashboard/ai-insights'),
  getTrends: (periodDays = 30) => api.get(`/dashboard/trends?period_days=${periodDays}`),
  getAgentPerformance: () => api.get('/dashboard/agent-performance'),
  getAlerts: (limit = 20) => api.get(`/dashboard/alerts?limit=${limit}`),
};

// Onboarding API
export const onboardingAPI = {
  getPartners: (page = 1, pageSize = 20, status = null) => {
    let url = `/onboarding/partners?page=${page}&page_size=${pageSize}`;
    if (status) url += `&status=${status}`;
    return api.get(url);
  },
  getPartner: (id) => api.get(`/onboarding/partners/${id}`),
  createPartner: (data) => api.post('/onboarding/partners', data),
  uploadDocument: (partnerId, formData) => 
    api.post(`/onboarding/partners/${partnerId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  validateCompliance: (partnerId) => api.post(`/onboarding/partners/${partnerId}/validate`),
  getOnboardingStatus: (partnerId) => api.post(`/onboarding/partners/${partnerId}/onboarding-status`),
  getComplianceSummary: () => api.get('/onboarding/compliance-summary'),
  analyzeContract: (content) => api.post('/onboarding/analyze-contract', { contract_content: content }),
};

// Communication API
export const communicationAPI = {
  getCommunications: (page = 1, pageSize = 20, filters = {}) => {
    let url = `/communication/?page=${page}&page_size=${pageSize}`;
    if (filters.category) url += `&category=${filters.category}`;
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.priority) url += `&priority=${filters.priority}`;
    return api.get(url);
  },
  getCommunication: (id) => api.get(`/communication/${id}`),
  processIncoming: (data) => api.post('/communication/incoming', data),
  classifyEmail: (data) => api.post('/communication/classify', data),
  generateResponse: (commId, context = {}) => 
    api.post(`/communication/generate-response?comm_id=${commId}`, context),
  assignCommunication: (id, assignee) => 
    api.put(`/communication/${id}/assign?assignee=${assignee}`),
  updateStatus: (id, status, notes = null) => {
    let url = `/communication/${id}/status?new_status=${status}`;
    if (notes) url += `&resolution_notes=${encodeURIComponent(notes)}`;
    return api.put(url);
  },
  getSummary: () => api.get('/communication/summary/by-category'),
};

// Tracking API
export const trackingAPI = {
  getShipments: (page = 1, pageSize = 20, filters = {}) => {
    let url = `/tracking/shipments?page=${page}&page_size=${pageSize}`;
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.carrier) url += `&carrier=${filters.carrier}`;
    return api.get(url);
  },
  getShipment: (id) => api.get(`/tracking/shipments/${id}`),
  trackByNumber: (trackingNumber) => api.get(`/tracking/track/${trackingNumber}`),
  createShipment: (data) => api.post('/tracking/shipments', data),
  updateLocation: (id, location, temperature = null) => 
    api.post(`/tracking/shipments/${id}/location`, { ...location, temperature }),
  predictETA: (id, traffic = 'normal', weather = 'clear') =>
    api.post(`/tracking/shipments/${id}/predict-eta?traffic_conditions=${traffic}&weather_conditions=${weather}`),
  optimizeRoute: (id, waypoints = [], constraints = {}) =>
    api.post(`/tracking/shipments/${id}/optimize-route`, { waypoints, constraints }),
  updateStatus: (id, status, notes = null) => {
    let url = `/tracking/shipments/${id}/status?new_status=${status}`;
    if (notes) url += `&notes=${encodeURIComponent(notes)}`;
    return api.put(url);
  },
  getAlerts: (id) => api.get(`/tracking/shipments/${id}/alerts`),
  getActiveDashboard: () => api.get('/tracking/dashboard/active'),
};

// POD API
export const podAPI = {
  getPODs: (page = 1, pageSize = 20, filters = {}) => {
    let url = `/pod/?page=${page}&page_size=${pageSize}`;
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.shipment_id) url += `&shipment_id=${filters.shipment_id}`;
    return api.get(url);
  },
  getPOD: (id) => api.get(`/pod/${id}`),
  capturePOD: (data) => api.post('/pod/capture', data),
  capturePODWithFiles: (formData) =>
    api.post('/pod/capture-with-files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  validatePOD: (id, expectedDelivery = {}) =>
    api.post(`/pod/${id}/validate`, expectedDelivery),
  analyzePhoto: (id) => api.post(`/pod/${id}/analyze-photo`),
  createDispute: (data) => api.post('/pod/disputes', data),
  resolveDispute: (disputeId, customerClaim = null) =>
    api.post(`/pod/disputes/${disputeId}/resolve`, { customer_claim: customerClaim }),
  syncBilling: (id) => api.post(`/pod/${id}/sync-billing`),
  getStats: () => api.get('/pod/summary/stats'),
};

// Billing API
export const billingAPI = {
  getInvoices: (page = 1, pageSize = 20, filters = {}) => {
    let url = `/billing/invoices?page=${page}&page_size=${pageSize}`;
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.vendor) url += `&vendor=${filters.vendor}`;
    return api.get(url);
  },
  getInvoice: (id) => api.get(`/billing/invoices/${id}`),
  createInvoice: (data) => api.post('/billing/invoices', data),
  uploadInvoice: (formData) =>
    api.post('/billing/invoices/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  reconcileInvoice: (id, deliveryRecordIds = []) =>
    api.post(`/billing/invoices/${id}/reconcile`, { delivery_record_ids: deliveryRecordIds }),
  checkAutoApproval: (id) => api.post(`/billing/invoices/${id}/auto-approve`),
  updateStatus: (id, status, notes = null) => {
    let url = `/billing/invoices/${id}/status?new_status=${status}`;
    if (notes) url += `&notes=${encodeURIComponent(notes)}`;
    return api.put(url);
  },
  detectExceptions: (invoiceIds = null) =>
    api.post('/billing/detect-exceptions', { invoice_ids: invoiceIds }),
  predictCashFlow: (forecastDays = 30) =>
    api.post(`/billing/cashflow-prediction?forecast_days=${forecastDays}`),
  generateReport: (periodStart, periodEnd) =>
    api.post(`/billing/financial-report?period_start=${periodStart}&period_end=${periodEnd}`),
  getDashboard: () => api.get('/billing/dashboard/summary'),
};

export default api;
