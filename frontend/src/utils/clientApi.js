const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ClientApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.tokenKey = 'client_token';
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken() {
    localStorage.removeItem(this.tokenKey);
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
      if (error.status) {
        throw error;
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  // Client Auth endpoints
  async login(username, password) {
    return this.request('/api/client/auth/login', {
      method: 'POST',
      body: { username, password },
    });
  }

  async register(username, email, password) {
    return this.request('/api/client/auth/register', {
      method: 'POST',
      body: { username, email, password },
    });
  }

  // Client Customer endpoints
  async getMyCustomer() {
    return this.request('/api/client/customer');
  }

  async getMyCustomerWithStories() {
    return this.request('/api/client/customer/with-stories');
  }

  async updateMyCustomer(customerData) {
    return this.request('/api/client/customer', {
      method: 'PUT',
      body: customerData,
    });
  }

  // Client Story endpoints
  async getMyStories() {
    return this.request('/api/client/stories');
  }

  async getPublishedStories() {
    return this.request('/api/client/stories/published');
  }

  async getMyStory(storyId) {
    return this.request(`/api/client/story/${storyId}`);
  }

  async createStory(storyData) {
    return this.request('/api/client/story', {
      method: 'POST',
      body: storyData,
    });
  }

  async updateMyStory(storyId, storyData) {
    return this.request(`/api/client/story/${storyId}`, {
      method: 'PUT',
      body: storyData,
    });
  }

  async deleteMyStory(storyId) {
    return this.request(`/api/client/story/${storyId}`, {
      method: 'DELETE',
    });
  }
}

export default new ClientApiClient();

