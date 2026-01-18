const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    localStorage.setItem('token', token);
  }

  removeToken() {
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 204) {
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 Unauthorized - clear token and throw special error
        if (response.status === 401) {
          this.removeToken();
          const authError = new Error('Authentication required');
          authError.status = 401;
          throw authError;
        }
        throw new Error(data.detail || 'An error occurred');
      }

      return data;
    } catch (error) {
      // Re-throw if it's already an Error with status
      if (error.status) {
        throw error;
      }
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(username, password) {
    return this.request('/admin/auth/login', {
      method: 'POST',
      body: { username, password },
    });
  }

  async register(username, email, password) {
    return this.request('/admin/auth/register', {
      method: 'POST',
      body: { username, email, password },
    });
  }

  // Customer endpoints
  async getCustomers() {
    return this.request('/admin/customers');
  }

  async getCustomer(customerId) {
    return this.request(`/admin/customer/${customerId}`);
  }

  async createCustomer(customerData) {
    return this.request('/admin/customer', {
      method: 'POST',
      body: customerData,
    });
  }

  async updateCustomer(customerId, customerData) {
    return this.request(`/admin/customer/${customerId}`, {
      method: 'PUT',
      body: customerData,
    });
  }

  async deleteCustomer(customerId) {
    return this.request(`/admin/customer/${customerId}`, {
      method: 'DELETE',
    });
  }

  // Story endpoints
  async getStories(customerId) {
    return this.request(`/admin/stories/${customerId}`);
  }

  async getStory(storyId) {
    return this.request(`/admin/story/${storyId}`);
  }

  async createStory(storyData) {
    return this.request('/admin/story', {
      method: 'POST',
      body: storyData,
    });
  }

  async updateStory(storyId, storyData) {
    return this.request(`/admin/story/${storyId}`, {
      method: 'PUT',
      body: storyData,
    });
  }

  async deleteStory(storyId) {
    return this.request(`/admin/story/${storyId}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiClient();

