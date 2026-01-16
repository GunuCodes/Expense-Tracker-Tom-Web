/**
 * Admin Panel JavaScript
 * Handles admin panel functionality and user management
 */

const Admin = {
  // Admin credentials
  ADMIN_EMAIL: 'admintrust@email.com',
  ADMIN_PASSWORD: 'admin123',

  // Initialize admin panel
  init() {
    console.log('Admin panel initialized');
    
    // Check if user is admin
    if (!this.isAdmin()) {
      App.showError('Access denied. Admin privileges required.');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
      return;
    }

    this.loadAdminData();
    this.setupEventListeners();
  },

  // Check if current user is admin
  isAdmin() {
    const currentUser = Auth.getCurrentUser() || App.currentUser;
    if (!currentUser) return false;
    
    return currentUser.email === this.ADMIN_EMAIL;
  },

  // Load admin data
  loadAdminData() {
    this.updateAdminStats();
    this.updateUsersList();
  },

  // Update admin statistics
  updateAdminStats() {
    const statsContainer = document.getElementById('adminStats');
    if (!statsContainer) return;

    const users = App.getFromStorage(App.STORAGE_KEYS.USERS) || [];
    let expenses = [];
    if (typeof App !== 'undefined') {
      if (App.getAllExpenses) {
        expenses = App.getAllExpenses();
      } else if (App.expenses) {
        expenses = App.expenses;
      } else {
        const savedExpenses = App.getFromStorage(App.STORAGE_KEYS.EXPENSES);
        expenses = savedExpenses || [];
      }
    }
    
    // Calculate stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => {
      // Check if user has expenses (active user)
      return expenses.some(e => {
        // In a real app, you'd link expenses to users
        return true; // For now, all users are considered active
      });
    }).length;
    
    const totalExpenses = expenses.length;
    const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);

    statsContainer.innerHTML = `
      <div class="metric-card metric-card--primary">
        <div class="metric-card__icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="metric-card__content">
          <h3 class="metric-card__label">Total Users</h3>
          <p class="metric-card__value">${totalUsers}</p>
        </div>
      </div>
      
      <div class="metric-card metric-card--success">
        <div class="metric-card__icon">
          <i class="fas fa-user-check"></i>
        </div>
        <div class="metric-card__content">
          <h3 class="metric-card__label">Active Users</h3>
          <p class="metric-card__value">${activeUsers}</p>
        </div>
      </div>
      
      <div class="metric-card metric-card--info">
        <div class="metric-card__icon">
          <i class="fas fa-receipt"></i>
        </div>
        <div class="metric-card__content">
          <h3 class="metric-card__label">Total Expenses</h3>
          <p class="metric-card__value">${totalExpenses}</p>
        </div>
      </div>
      
      <div class="metric-card metric-card--warning">
        <div class="metric-card__icon">
          <i class="fas fa-dollar-sign"></i>
        </div>
        <div class="metric-card__content">
          <h3 class="metric-card__label">Total Spending</h3>
          <p class="metric-card__value">$${totalSpending.toFixed(2)}</p>
        </div>
      </div>
    `;
  },

  // Update users list
  updateUsersList(searchTerm = '') {
    const usersContainer = document.getElementById('adminUsers');
    if (!usersContainer) return;

    const users = App.getFromStorage(App.STORAGE_KEYS.USERS) || [];
    let expenses = [];
    if (typeof App !== 'undefined') {
      if (App.getAllExpenses) {
        expenses = App.getAllExpenses();
      } else if (App.expenses) {
        expenses = App.expenses;
      } else {
        const savedExpenses = App.getFromStorage(App.STORAGE_KEYS.EXPENSES);
        expenses = savedExpenses || [];
      }
    }
    
    // Filter users by search term
    let filteredUsers = users;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredUsers = users.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        (user.name && user.name.toLowerCase().includes(searchLower))
      );
    }

    if (filteredUsers.length === 0) {
      usersContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">👥</div>
          <h4 class="empty-state__title">No users found</h4>
          <p class="empty-state__message">${searchTerm ? 'Try adjusting your search terms.' : 'No users registered yet.'}</p>
        </div>
      `;
      return;
    }

    usersContainer.innerHTML = filteredUsers.map(user => {
      const isAdmin = user.email === this.ADMIN_EMAIL;
      const userExpenses = expenses.filter(e => {
        // In a real app, expenses would be linked to users
        // For now, we'll show all expenses for all users
        return true;
      });
      const userSpending = userExpenses.reduce((sum, e) => sum + e.amount, 0);
      const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';

      return `
        <div class="admin-user-item" data-user-id="${user.id}">
          <div class="admin-user-item__info">
            <div class="admin-user-item__avatar">
              <img src="assets/images/avatars/default-avatar.svg" alt="User Avatar" class="admin-user-item__avatar-img">
              ${isAdmin ? '<span class="admin-user-item__badge"><i class="fas fa-shield-alt"></i></span>' : ''}
            </div>
            <div class="admin-user-item__details">
              <h4 class="admin-user-item__name">${user.name || 'No Name'}</h4>
              <p class="admin-user-item__email">${user.email}</p>
              <div class="admin-user-item__meta">
                <span class="admin-user-item__meta-item">
                  <i class="fas fa-calendar"></i>
                  Joined: ${createdAt}
                </span>
                <span class="admin-user-item__meta-item">
                  <i class="fas fa-receipt"></i>
                  Expenses: ${userExpenses.length}
                </span>
                <span class="admin-user-item__meta-item">
                  <i class="fas fa-dollar-sign"></i>
                  Total: $${userSpending.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <div class="admin-user-item__actions">
            ${!isAdmin ? `
              <button class="btn btn--danger btn--small" data-action="delete" data-user-id="${user.id}">
                <i class="fas fa-trash"></i>
                <span>Delete</span>
              </button>
            ` : `
              <span class="admin-user-item__admin-label">Admin Account</span>
            `}
          </div>
        </div>
      `;
    }).join('');

    // Setup event listeners for action buttons
    this.setupUserActionListeners();
  },

  // Setup event listeners
  setupEventListeners() {
    // User search
    const searchInput = document.getElementById('userSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.updateUsersList(e.target.value);
      });
    }
  },

  // Setup user action listeners
  setupUserActionListeners() {
    const deleteButtons = document.querySelectorAll('[data-action="delete"]');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = btn.getAttribute('data-user-id');
        this.handleDeleteUser(userId);
      });
    });
  },

  // Handle delete user
  handleDeleteUser(userId) {
    const users = App.getFromStorage(App.STORAGE_KEYS.USERS) || [];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      App.showError('User not found');
      return;
    }

    if (user.email === this.ADMIN_EMAIL) {
      App.showError('Cannot delete admin account');
      return;
    }

    const modal = document.getElementById('deleteUserModal');
    const modalBody = document.getElementById('deleteUserModalBody');
    const confirmBtn = document.getElementById('confirmDeleteUserBtn');
    const cancelBtn = document.getElementById('cancelDeleteUserBtn');

    if (modal && modalBody) {
      modalBody.innerHTML = `
        <div class="admin-user-preview">
          <div class="admin-user-preview__info">
            <img src="assets/images/avatars/default-avatar.svg" alt="User Avatar" class="admin-user-preview__avatar">
            <div>
              <h4>${user.name || 'No Name'}</h4>
              <p>${user.email}</p>
            </div>
          </div>
          <p><strong>Warning:</strong> This will permanently delete the user account and all associated data.</p>
        </div>
      `;

      modal.classList.add('modal--open');
      document.body.classList.add('body--modal-open');

      // Remove existing listeners
      const newConfirmBtn = confirmBtn.cloneNode(true);
      confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
      const newCancelBtn = cancelBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

      // Add new listeners
      document.getElementById('confirmDeleteUserBtn').addEventListener('click', () => {
        this.deleteUser(userId);
        modal.classList.remove('modal--open');
        document.body.classList.remove('body--modal-open');
      });

      document.getElementById('cancelDeleteUserBtn').addEventListener('click', () => {
        modal.classList.remove('modal--open');
        document.body.classList.remove('body--modal-open');
      });
    }
  },

  // Delete user
  deleteUser(userId) {
    try {
      const users = App.getFromStorage(App.STORAGE_KEYS.USERS) || [];
      const updatedUsers = users.filter(u => u.id !== userId);
      
      App.setToStorage(App.STORAGE_KEYS.USERS, updatedUsers);

      // If deleted user is currently logged in, log them out
      const currentUser = Auth.getCurrentUser() || App.currentUser;
      if (currentUser && currentUser.id === userId) {
        Auth.logout();
        window.location.href = 'index.html';
        return;
      }

      // Update UI
      this.updateAdminStats();
      this.updateUsersList(document.getElementById('userSearchInput')?.value || '');
      
      App.showSuccessMessage('User account deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      App.showError('Failed to delete user account');
    }
  }
};

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  Admin.init();
});

