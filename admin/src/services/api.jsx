const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => apiRequest('/dashboard/stats'),
  getSalesTrend: (period = 'monthly') => apiRequest(`/analytics/sales-trend?period=${period}`),
  getCustomerInsights: () => apiRequest('/analytics/customer-insights'),
  getAlerts: () => apiRequest('/analytics/alerts'),
};

// Reports APIs
export const reportsAPI = {
  getSalesReport: (format = 'json') => apiRequest(`/reports/sales?format=${format}`),
  getInventoryReport: (format = 'json') => apiRequest(`/reports/inventory?format=${format}`),
  getCustomerReport: (format = 'json') => apiRequest(`/reports/customers?format=${format}`),
};

// For file downloads
export const downloadReport = async (endpoint, filename, format = 'csv') => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}?format=${format}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};