/**
 * API Client
 * Handles all API communication with MongoDB backend
 */

const API = {
  baseURL: window.location.origin,
  token: null,

  // Initialize API client
  init() {
    // Get token from localStorage
    this.token = localStorage.getItem('expenseTrackerToken');
  },

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('expenseTrackerToken', token);
    } else {
      localStorage.removeItem('expenseTrackerToken');
    }
  },

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  },

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  },

  // Authentication
  async signup(userData) {
    const response = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  },

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  },

  async getCurrentUser() {
    return await this.request('/auth/me');
  },

  async verifyToken() {
    try {
      return await this.request('/auth/verify');
    } catch (error) {
      this.setToken(null);
      return null;
    }
  },

  // Expenses
  async getExpenses() {
    const response = await this.request('/expenses');
    return response.expenses || [];
  },

  async getExpense(id) {
    const response = await this.request(`/expenses/${id}`);
    return response.expense;
  },

  async createExpense(expense) {
    const response = await this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense)
    });
    return response.expense;
  },

  async updateExpense(id, expense) {
    const response = await this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense)
    });
    return response.expense;
  },

  async deleteExpense(id) {
    return await this.request(`/expenses/${id}`, {
      method: 'DELETE'
    });
  },

  // User Profile
  async updateProfile(profileData) {
    const response = await this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return response.user;
  },

  async getProfile() {
    const response = await this.request('/users/profile');
    return response.user;
  },

  // Settings
  async getSettings() {
    const response = await this.request('/settings');
    return response.settings;
  },

  async updateSettings(settings) {
    const response = await this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    return response.settings;
  },

  // Budget
  async getBudget() {
    const response = await this.request('/budget');
    return response.budget;
  },

  async updateBudget(budget) {
    const response = await this.request('/budget', {
      method: 'PUT',
      body: JSON.stringify(budget)
    });
    return response.budget;
  }
};

// Initialize API on load
API.init();

