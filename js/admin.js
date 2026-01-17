/**
 * Admin Panel JavaScript
 * Handles admin panel functionality and user management
 */

const Admin = {
  // Admin credentials
  ADMIN_EMAIL: 'admintrust@email.com',
  ADMIN_PASSWORD: 'admin123',

  // Initialize admin panel
  async init() {
    console.log('Admin panel initialized');
    
    // Refresh user data from API to ensure we have latest isAdmin status
    if (typeof Auth !== 'undefined' && Auth.checkAuthState) {
      console.log('Refreshing auth state...');
      await Auth.checkAuthState();
      console.log('Auth state refreshed, currentUser:', Auth.getCurrentUser());
    }
    
    // Check if user is admin
    const isAdmin = this.isAdmin();
    console.log('Admin panel - isAdmin check result:', isAdmin);
    console.log('Admin panel - currentUser from Auth:', Auth.getCurrentUser());
    console.log('Admin panel - currentUser from App:', App.currentUser);
    
    if (!isAdmin) {
      console.log('Admin panel - Access denied, redirecting...');
      App.showError('Access denied. Admin privileges required.');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
      return;
    }

    console.log('Admin panel - Access granted, loading data...');
    this.loadAdminData();
    this.setupEventListeners();
  },

  // Check if current user is admin
  isAdmin() {
    const currentUser = Auth.getCurrentUser() || App.currentUser;
    if (!currentUser) {
      console.log('Admin.isAdmin check: No currentUser');
      return false;
    }
    
    console.log('Admin.isAdmin check - currentUser:', {
      email: currentUser.email,
      isAdmin: currentUser.isAdmin,
      isAdminType: typeof currentUser.isAdmin,
      isAdminStrict: currentUser.isAdmin === true
    });
    
    // Check isAdmin field from MongoDB (primary check)
    // Handle both boolean true and string "true" cases
    if (currentUser.isAdmin === true || currentUser.isAdmin === 'true') {
      console.log('Admin.isAdmin check: User is admin (isAdmin field)');
      return true;
    }
    
    // Fallback to email check for backwards compatibility
    const isAdminByEmail = currentUser.email === this.ADMIN_EMAIL;
    if (isAdminByEmail) {
      console.log('Admin.isAdmin check: User is admin (email check)');
    }
    return isAdminByEmail;
  },

  // Load admin data
  async loadAdminData() {
    await this.updateAdminStats();
    await this.updateUsersList();
  },

  // Update admin statistics
  async updateAdminStats() {
    const statsContainer = document.getElementById('adminStats');
    if (!statsContainer) return;

    try {
      // Get stats from API
      if (typeof API !== 'undefined' && API.getAdminStats) {
        const stats = await API.getAdminStats();
        
        const totalUsers = stats.totalUsers || 0;
        const activeUsers = stats.activeUsers || 0;
        const totalExpenses = stats.totalExpenses || 0;
        const totalSpending = stats.totalSpending || 0;

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
      } else {
        // Fallback to localStorage
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
        
        const totalUsers = users.length;
        const activeUsers = users.length;
        const totalExpenses = expenses.length;
        const totalSpending = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        
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
      }
    } catch (error) {
      console.error('Error loading admin stats:', error);
      App.showError('Failed to load statistics');
    }
  },

  // Update users list
  async updateUsersList(searchTerm = '') {
    const usersContainer = document.getElementById('adminUsers');
    if (!usersContainer) return;

    try {
      // Get users from API
      let users = [];
      if (typeof API !== 'undefined' && API.getAllUsers) {
        users = await API.getAllUsers();
      } else {
        // Fallback to localStorage
        users = App.getFromStorage(App.STORAGE_KEYS.USERS) || [];
      }
      
      // Get expenses from API for each user
      let allExpenses = [];
      if (typeof API !== 'undefined' && API.getExpenses) {
        try {
          allExpenses = await API.getExpenses();
        } catch (error) {
          console.error('Error loading expenses:', error);
        }
      } else if (typeof App !== 'undefined') {
        if (App.getAllExpenses) {
          allExpenses = App.getAllExpenses();
        } else if (App.expenses) {
          allExpenses = App.expenses;
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
      // Use MongoDB _id if available, otherwise use id
      const userId = user._id || user.id;
      const isAdminUser = user.isAdmin === true || user.email === this.ADMIN_EMAIL;
      
      // Get expenses for this specific user
      const userExpenses = allExpenses.filter(e => {
        const expenseUserId = String(e.userId || e._id || '');
        return expenseUserId === String(userId);
      });
      const userSpending = userExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';
      
      // Get profile picture or use default
      const profilePicture = user.profilePicture || 'assets/images/avatars/default-avatar.svg';

      return `
        <div class="admin-user-item" data-user-id="${userId}">
          <div class="admin-user-item__info">
            <div class="admin-user-item__avatar">
              <img src="${profilePicture}" alt="User Avatar" class="admin-user-item__avatar-img">
              ${isAdminUser ? '<span class="admin-user-item__badge"><i class="fas fa-shield-alt"></i></span>' : ''}
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
            ${!isAdminUser ? `
              <button class="btn btn--danger btn--small" data-action="delete" data-user-id="${userId}">
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
    } catch (error) {
      console.error('Error loading users list:', error);
      App.showError('Failed to load users');
      usersContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">⚠️</div>
          <h4 class="empty-state__title">Error loading users</h4>
          <p class="empty-state__message">${error.message || 'Please try again later.'}</p>
        </div>
      `;
    }
  },

  // Setup event listeners
  setupEventListeners() {
    // User search
    const searchInput = document.getElementById('userSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', async (e) => {
        await this.updateUsersList(e.target.value);
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
  async handleDeleteUser(userId) {
    try {
      // Get user details from API
      let user = null;
      if (typeof API !== 'undefined' && API.getUserDetails) {
        try {
          const userData = await API.getUserDetails(userId);
          user = userData.user;
        } catch (error) {
          console.error('Error fetching user details:', error);
          // Fallback to finding in current users list
          const users = await this.getAllUsersList();
          user = users.find(u => String(u._id || u.id) === String(userId));
        }
      } else {
        // Fallback to localStorage
        const users = App.getFromStorage(App.STORAGE_KEYS.USERS) || [];
        user = users.find(u => String(u.id) === String(userId));
      }
      
      if (!user) {
        App.showError('User not found');
        return;
      }

      // Check if user is admin
      const isAdminUser = user.isAdmin === true || user.email === this.ADMIN_EMAIL;
      if (isAdminUser) {
        App.showError('Cannot delete admin account');
        return;
      }

    const modal = document.getElementById('deleteUserModal');
    const modalBody = document.getElementById('deleteUserModalBody');
    const confirmBtn = document.getElementById('confirmDeleteUserBtn');
    const cancelBtn = document.getElementById('cancelDeleteUserBtn');

    if (modal && modalBody) {
      const userProfilePicture = user.profilePicture || 'assets/images/avatars/default-avatar.svg';
      modalBody.innerHTML = `
        <div class="admin-user-preview">
          <div class="admin-user-preview__info">
            <img src="${userProfilePicture}" alt="User Avatar" class="admin-user-preview__avatar">
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
      document.getElementById('confirmDeleteUserBtn').addEventListener('click', async () => {
        await this.deleteUser(userId);
        modal.classList.remove('modal--open');
        document.body.classList.remove('body--modal-open');
      });

      document.getElementById('cancelDeleteUserBtn').addEventListener('click', () => {
        modal.classList.remove('modal--open');
        document.body.classList.remove('body--modal-open');
      });
    }
    } catch (error) {
      console.error('Error handling delete user:', error);
      App.showError('Failed to load user details');
    }
  },

  // Delete user
  async deleteUser(userId) {
    try {
      // Delete user via API
      if (typeof API !== 'undefined' && API.deleteUser) {
        await API.deleteUser(userId);
        
        // If deleted user is currently logged in, log them out
        const currentUser = Auth.getCurrentUser() || App.currentUser;
        const currentUserId = String(currentUser?._id || currentUser?.id || '');
        if (currentUserId === String(userId)) {
          Auth.logout();
          window.location.href = 'index.html';
          return;
        }

        // Update UI
        await this.updateAdminStats();
        await this.updateUsersList(document.getElementById('userSearchInput')?.value || '');
        
        App.showSuccessMessage('User deleted successfully!');
      } else {
        // Fallback to localStorage
        const users = App.getFromStorage(App.STORAGE_KEYS.USERS) || [];
        const updatedUsers = users.filter(u => String(u.id) !== String(userId));
        
        App.setToStorage(App.STORAGE_KEYS.USERS, updatedUsers);

        // If deleted user is currently logged in, log them out
        const currentUser = Auth.getCurrentUser() || App.currentUser;
        if (currentUser && String(currentUser.id) === String(userId)) {
          Auth.logout();
          window.location.href = 'index.html';
          return;
        }

        // Update UI
        this.updateAdminStats();
        this.updateUsersList(document.getElementById('userSearchInput')?.value || '');
        
        App.showSuccessMessage('User deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      App.showError(error.message || 'Failed to delete user');
    }
  },
  
  // Helper to get all users list (for fallback)
  async getAllUsersList() {
    if (typeof API !== 'undefined' && API.getAllUsers) {
      try {
        return await API.getAllUsers();
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }
    // Fallback to localStorage
    return App.getFromStorage(App.STORAGE_KEYS.USERS) || [];
  }
};

// Initialize admin panel when DOM is loaded - wait for Auth to complete
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for Auth to initialize first
  if (typeof Auth !== 'undefined' && Auth.init) {
    await Auth.init();
  }
  // Wait a bit more to ensure user data is loaded
  await new Promise(resolve => setTimeout(resolve, 200));
  await Admin.init();
});

