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
              <img src="${profilePicture}" alt="User Avatar" class="admin-user-item__avatar-img" onerror="this.src='assets/images/avatars/default-avatar.svg'">
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
              <button class="btn btn--primary btn--small" data-action="manage" data-user-id="${userId}">
                <i class="fas fa-cog"></i>
                <span>Manage Settings</span>
              </button>
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
    
    // Manage user modal close buttons
    const closeManageModal = document.getElementById('closeManageUserModal');
    const closeManageModalBtn = document.getElementById('closeManageUserModalBtn');
    const manageModal = document.getElementById('manageUserModal');
    
    if (closeManageModal) {
      closeManageModal.addEventListener('click', () => {
        if (manageModal) {
          manageModal.classList.remove('modal--open');
          document.body.classList.remove('body--modal-open');
        }
      });
    }
    
    if (closeManageModalBtn) {
      closeManageModalBtn.addEventListener('click', () => {
        if (manageModal) {
          manageModal.classList.remove('modal--open');
          document.body.classList.remove('body--modal-open');
        }
      });
    }
    
    // Close modal on backdrop click
    if (manageModal) {
      const backdrop = manageModal.querySelector('.modal__backdrop');
      if (backdrop) {
        backdrop.addEventListener('click', () => {
          manageModal.classList.remove('modal--open');
          document.body.classList.remove('body--modal-open');
        });
      }
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
    
    const manageButtons = document.querySelectorAll('[data-action="manage"]');
    manageButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = btn.getAttribute('data-user-id');
        this.handleManageUser(userId);
      });
    });
  },

  // Handle manage user (view stats and expenses)
  async handleManageUser(userId) {
    try {
      // Get user details and expenses from API
      let userData = null;
      if (typeof API !== 'undefined' && API.getUserDetails) {
        userData = await API.getUserDetails(userId);
      } else {
        App.showError('API not available');
        return;
      }
      
      if (!userData || !userData.user) {
        App.showError('User not found');
        return;
      }
      
      const user = userData.user;
      const expenses = userData.expenseList || [];
      const expensesByCategory = userData.expensesByCategory || [];
      const monthlySpending = userData.monthlySpending || [];
      
      // Calculate additional stats
      const totalExpenses = expenses.length;
      const totalSpending = userData.totalSpending || 0;
      const avgExpense = totalExpenses > 0 ? totalSpending / totalExpenses : 0;
      
      // Get most recent expense date
      const mostRecentExpense = expenses.length > 0 ? new Date(expenses[0].date) : null;
      const lastActivity = mostRecentExpense ? mostRecentExpense.toLocaleDateString() : 'Never';
      
      // Show modal
      this.showManageUserModal(user, {
        totalExpenses,
        totalSpending,
        avgExpense,
        lastActivity,
        expensesByCategory,
        monthlySpending,
        expenses
      });
    } catch (error) {
      console.error('Error loading user details:', error);
      App.showError('Failed to load user details');
    }
  },
  
  // Show manage user modal
  showManageUserModal(user, stats) {
    const modal = document.getElementById('manageUserModal');
    const modalBody = document.getElementById('manageUserModalBody');
    if (!modal || !modalBody) return;
    
    const userProfilePicture = user.profilePicture || 'assets/images/avatars/default-avatar.svg';
    
    // Build expenses list HTML
    const expensesListHTML = stats.expenses.length > 0 ? stats.expenses.map(expense => {
      const expenseId = expense._id || expense.id;
      const expenseDate = new Date(expense.date).toLocaleDateString();
      const categoryIcon = this.getCategoryIcon(expense.category);
      
      return `
        <div class="admin-expense-item" data-expense-id="${expenseId}">
          <div class="admin-expense-item__info">
            <div class="admin-expense-item__icon">
              <i class="${categoryIcon}"></i>
            </div>
            <div class="admin-expense-item__details">
              <h4 class="admin-expense-item__description">${expense.description || 'No description'}</h4>
              <div class="admin-expense-item__meta">
                <span class="admin-expense-item__category">${this.formatCategory(expense.category)}</span>
                <span class="admin-expense-item__date">${expenseDate}</span>
              </div>
            </div>
          </div>
          <div class="admin-expense-item__amount">
            $${(expense.amount || 0).toFixed(2)}
          </div>
          <div class="admin-expense-item__actions">
            <button class="btn btn--danger btn--icon-only btn--small" data-action="delete-expense" data-expense-id="${expenseId}" title="Delete expense">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('') : `
      <div class="empty-state">
        <div class="empty-state__icon">📝</div>
        <h4 class="empty-state__title">No expenses found</h4>
        <p class="empty-state__message">This user hasn't recorded any expenses yet.</p>
      </div>
    `;
    
    // Build category breakdown HTML
    const categoryBreakdownHTML = stats.expensesByCategory.length > 0 ? stats.expensesByCategory.map(cat => {
      return `
        <div class="admin-category-stat">
          <div class="admin-category-stat__info">
            <i class="${this.getCategoryIcon(cat._id)}"></i>
            <span>${this.formatCategory(cat._id)}</span>
          </div>
          <div class="admin-category-stat__values">
            <span class="admin-category-stat__count">${cat.count} expenses</span>
            <span class="admin-category-stat__total">$${cat.total.toFixed(2)}</span>
          </div>
        </div>
      `;
    }).join('') : '<p class="text-muted">No category data available</p>';
    
    modalBody.innerHTML = `
      <div class="manage-user-header">
        <div class="manage-user-header__profile">
          <img src="${userProfilePicture}" alt="User Avatar" class="manage-user-header__avatar" onerror="this.src='assets/images/avatars/default-avatar.svg'">
          <div class="manage-user-header__info">
            <h3>${user.name || 'No Name'}</h3>
            <p>${user.email}</p>
            <p class="manage-user-header__joined">Joined: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</p>
          </div>
        </div>
      </div>
      
      <div class="manage-user-stats">
        <div class="manage-user-stat-card">
          <div class="manage-user-stat-card__icon">
            <i class="fas fa-receipt"></i>
          </div>
          <div class="manage-user-stat-card__content">
            <h4>Total Expenses</h4>
            <p class="manage-user-stat-card__value">${stats.totalExpenses}</p>
          </div>
        </div>
        
        <div class="manage-user-stat-card">
          <div class="manage-user-stat-card__icon">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="manage-user-stat-card__content">
            <h4>Total Spending</h4>
            <p class="manage-user-stat-card__value">$${stats.totalSpending.toFixed(2)}</p>
          </div>
        </div>
        
        <div class="manage-user-stat-card">
          <div class="manage-user-stat-card__icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="manage-user-stat-card__content">
            <h4>Average Expense</h4>
            <p class="manage-user-stat-card__value">$${stats.avgExpense.toFixed(2)}</p>
          </div>
        </div>
        
        <div class="manage-user-stat-card">
          <div class="manage-user-stat-card__icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="manage-user-stat-card__content">
            <h4>Last Activity</h4>
            <p class="manage-user-stat-card__value">${stats.lastActivity}</p>
          </div>
        </div>
      </div>
      
      <div class="manage-user-section">
        <h4 class="manage-user-section__title">
          <i class="fas fa-tags"></i>
          Category Breakdown
        </h4>
        <div class="manage-user-section__content">
          ${categoryBreakdownHTML}
        </div>
      </div>
      
      <div class="manage-user-section">
        <h4 class="manage-user-section__title">
          <i class="fas fa-list"></i>
          Expense List
        </h4>
        <div class="manage-user-section__content manage-user-section__content--expenses">
          ${expensesListHTML}
        </div>
      </div>
    `;
    
    // Store current user ID for expense deletion
    modal.setAttribute('data-current-user-id', user._id || user.id);
    
    // Show modal
    modal.classList.add('modal--open');
    document.body.classList.add('body--modal-open');
    
    // Setup expense delete listeners
    this.setupExpenseDeleteListeners();
  },
  
  // Setup expense delete listeners
  setupExpenseDeleteListeners() {
    const deleteExpenseButtons = document.querySelectorAll('[data-action="delete-expense"]');
    deleteExpenseButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const expenseId = btn.getAttribute('data-expense-id');
        await this.handleDeleteExpense(expenseId);
      });
    });
  },
  
  // Handle delete expense
  async handleDeleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Get current user ID from modal
      const modal = document.getElementById('manageUserModal');
      const userId = modal?.getAttribute('data-current-user-id');
      
      if (!userId) {
        App.showError('User ID not found');
        return;
      }
      
      if (typeof API !== 'undefined' && API.deleteUserExpense) {
        // Use admin endpoint to delete expense
        await API.deleteUserExpense(userId, expenseId);
        
        // Show success message
        if (typeof App !== 'undefined') {
          if (App.showSuccessMessage) {
            App.showSuccessMessage('Expense deleted successfully!');
          } else if (App.showMessage) {
            App.showMessage('Expense deleted successfully!', 'success');
          } else {
            // Fallback: create a temporary success message
            this.showTemporaryMessage('Expense deleted successfully!', 'success');
          }
        } else {
          alert('Expense deleted successfully!');
        }
        
        // Reload user data to refresh the list
        await this.handleManageUser(userId);
      } else {
        App.showError('API not available');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      const errorMessage = error.message || 'Failed to delete expense';
      if (typeof App !== 'undefined' && App.showError) {
        App.showError(errorMessage);
      } else {
        alert('Error: ' + errorMessage);
      }
    }
  },
  
  // Helper: Get category icon
  getCategoryIcon(category) {
    const icons = {
      food: 'fas fa-utensils',
      transport: 'fas fa-car',
      entertainment: 'fas fa-film',
      utilities: 'fas fa-bolt',
      shopping: 'fas fa-shopping-bag',
      healthcare: 'fas fa-heartbeat',
      education: 'fas fa-graduation-cap',
      other: 'fas fa-ellipsis-h'
    };
    return icons[category] || icons.other;
  },
  
  // Helper: Format category name
  formatCategory(category) {
    return category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Other';
  },
  
  // Helper: Show temporary success/error message
  showTemporaryMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `admin-temp-message admin-temp-message--${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.parentNode.removeChild(messageDiv);
        }
      }, 300);
    }, 3000);
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
            <img src="${userProfilePicture}" alt="User Avatar" class="admin-user-preview__avatar" onerror="this.src='assets/images/avatars/default-avatar.svg'">
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

