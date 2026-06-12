import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Customers
export const fetchCustomers = (params?: Record<string, any>) => api.get('/customers', { params }).then(r => r.data);
export const fetchCustomer = (id: string) => api.get(`/customers/${id}`).then(r => r.data);

// Orders
export const fetchOrders = (params?: Record<string, any>) => api.get('/orders', { params }).then(r => r.data);

// Campaigns
export const fetchCampaigns = (params?: Record<string, any>) => api.get('/campaigns', { params }).then(r => r.data);
export const fetchCampaign = (id: string) => api.get(`/campaigns/${id}`).then(r => r.data);
export const fetchCampaignStats = (id: string) => api.get(`/campaigns/${id}/stats`).then(r => r.data);
export const fetchCampaignComms = (id: string, params?: Record<string, any>) => api.get(`/campaigns/${id}/communications`, { params }).then(r => r.data);
export const launchCampaign = (id: string) => api.post(`/campaigns/${id}/launch`).then(r => r.data);

// Segments
export const fetchSegments = () => api.get('/segments').then(r => r.data);
export const createSegment = (data: any) => api.post('/segments', data).then(r => r.data);
export const previewSegment = (filter_config: any) => api.post('/segments/preview', { filter_config }).then(r => r.data);

// Analytics
export const fetchOverview = () => api.get('/analytics/overview').then(r => r.data);
export const fetchChannelPerformance = () => api.get('/analytics/channels').then(r => r.data);

// Agent
export const sendAgentMessage = (message: string, session_id?: string) =>
  api.post('/agent/chat', { message, session_id }).then(r => r.data);
export const fetchAgentSessions = () => api.get('/agent/sessions').then(r => r.data);
