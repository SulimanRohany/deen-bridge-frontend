import { config, getApiUrl } from '@/lib/config';

class ContactAPI {
  constructor() {
    this.baseURL = config.API_BASE_URL;
  }

  // Create a new contact message
  async createContactMessage(data) {
    try {
      const response = await fetch(getApiUrl(config.ENDPOINTS.CONTACT.CREATE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Safely read body using a clone to avoid "body stream already read" in some browsers
      const text = await response.clone().text();
      let payload;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch (_) {
        if (text && text.trim().startsWith('<')) {
          throw new Error('Server returned an unexpected HTML response. Please check the API URL and CORS/CSRF settings.');
        }
        throw new Error('Unexpected response from server.');
      }

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to send message');
      }

      return payload;
    } catch (error) {
      throw error;
    }
  }

  // Get contact messages list (admin only)
  async getContactMessages(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);
      if (params.ordering) queryParams.append('ordering', params.ordering);
      if (params.page) queryParams.append('page', params.page);
      if (params.page_size) queryParams.append('page_size', params.page_size);

      const url = `${getApiUrl(config.ENDPOINTS.CONTACT.LIST)}?${queryParams}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${params.token}`,
        },
      });

      const text = await response.text();
      let payload;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch (_) {
        if (text && text.trim().startsWith('<')) {
          throw new Error('Server returned an unexpected HTML response for list endpoint.');
        }
        throw new Error('Unexpected response from server.');
      }

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to fetch contact messages');
      }

      return payload;
    } catch (error) {
      throw error;
    }
  }

  // Get contact message details (admin only)
  async getContactMessage(id, token) {
    try {
      const response = await fetch(getApiUrl(config.ENDPOINTS.CONTACT.DETAIL, { id }), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const text = await response.text();
      let payload;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch (_) {
        if (text && text.trim().startsWith('<')) {
          throw new Error('Server returned an unexpected HTML response for detail endpoint.');
        }
        throw new Error('Unexpected response from server.');
      }

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to fetch contact message');
      }

      return payload;
    } catch (error) {
      throw error;
    }
  }

  // Update contact message status (admin only)
  async updateContactMessage(id, data, token) {
    try {
      const response = await fetch(getApiUrl(config.ENDPOINTS.CONTACT.DETAIL, { id }), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const text = await response.text();
      let payload;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch (_) {
        if (text && text.trim().startsWith('<')) {
          throw new Error('Server returned an unexpected HTML response for update endpoint.');
        }
        throw new Error('Unexpected response from server.');
      }

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to update contact message');
      }

      return payload;
    } catch (error) {
      throw error;
    }
  }

  // Get contact message statistics (admin only)
  async getContactStats(token) {
    try {
      const response = await fetch(getApiUrl(config.ENDPOINTS.CONTACT.STATS), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const text = await response.text();
      let payload;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch (_) {
        if (text && text.trim().startsWith('<')) {
          throw new Error('Server returned an unexpected HTML response for stats endpoint.');
        }
        throw new Error('Unexpected response from server.');
      }

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to fetch contact stats');
      }

      return payload;
    } catch (error) {
      throw error;
    }
  }
}

// Create and export a singleton instance
export const contactAPI = new ContactAPI();
