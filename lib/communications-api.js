/**
 * Unified Communications API
 * Handles all user-to-admin communications (custom requests, contact messages, reports)
 */

import { config } from './config';

const API_BASE_URL = config.API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash if present

/**
 * Get authorization headers
 */
const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

/**
 * Get all communications with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.token - Auth token
 * @param {string} params.communication_type - Filter by type (custom_request, contact_message, report)
 * @param {string} params.status - Filter by status
 * @param {string} params.search - Search query
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.ordering - Sort order
 */
export const getCommunications = async (params) => {
  const { token, ...queryParams } = params;
  
  const queryString = new URLSearchParams(
    Object.entries(queryParams).filter(([_, value]) => value !== undefined && value !== '')
  ).toString();
  
  const url = `${API_BASE_URL}/communications/${queryString ? '?' + queryString : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch communications');
  }
  
  return await response.json();
};

/**
 * Get single communication by ID
 */
export const getCommunication = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/communications/${id}/`, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch communication');
  }
  
  return await response.json();
};

/**
 * Update communication
 */
export const updateCommunication = async (id, data, token) => {
  const response = await fetch(`${API_BASE_URL}/communications/${id}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to update communication');
  }
  
  return await response.json();
};

/**
 * Delete communication
 */
export const deleteCommunication = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/communications/${id}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to delete communication');
  }
};

/**
 * Mark communication as contacted
 */
export const markContacted = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/communications/${id}/mark_contacted/`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to mark as contacted');
  }
  
  return await response.json();
};

/**
 * Update communication status with notes
 */
export const updateStatus = async (id, statusData, token) => {
  const response = await fetch(`${API_BASE_URL}/communications/${id}/update_status/`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(statusData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to update status');
  }
  
  return await response.json();
};

/**
 * Mark communication as resolved
 */
export const markResolved = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/communications/${id}/mark_resolved/`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to mark as resolved');
  }
  
  return await response.json();
};

/**
 * Get pending communications
 */
export const getPendingCommunications = async (token) => {
  const response = await fetch(`${API_BASE_URL}/communications/pending/`, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch pending communications');
  }
  
  return await response.json();
};

/**
 * Get communication statistics
 */
export const getCommunicationStats = async (token) => {
  const response = await fetch(`${API_BASE_URL}/communications/stats/`, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch statistics');
  }
  
  return await response.json();
};

/**
 * Create custom course request (public endpoint)
 */
export const createCustomCourseRequest = async (data) => {
  const response = await fetch(`${API_BASE_URL}/custom-course-request/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || 'Failed to submit request');
  }
  
  return await response.json();
};

/**
 * Create contact message (public endpoint)
 */
export const createContactMessage = async (data) => {
  const response = await fetch(`${API_BASE_URL}/contact/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || 'Failed to send message');
  }
  
  return await response.json();
};

/**
 * Create report (authenticated endpoint)
 */
export const createReport = async (formData, token) => {
  const response = await fetch(`${API_BASE_URL}/report/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData, // FormData for file upload
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || 'Failed to submit report');
  }
  
  return await response.json();
};

/**
 * Update report
 */
export const updateReport = async (id, formData, token) => {
  const response = await fetch(`${API_BASE_URL}/report/${id}/`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || 'Failed to update report');
  }
  
  return await response.json();
};

/**
 * Delete report
 */
export const deleteReport = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/report/${id}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to delete report');
  }
};

