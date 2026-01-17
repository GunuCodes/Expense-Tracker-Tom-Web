/**
 * Main Application JavaScript
 * Personal Expense Tracker
 */

// Application state
const App = {
  currentView: 'expenses',
  expenses: [],
  currentUser: null,
  budgetSettings: { monthlyBudget: 3000 }, // Store budget settings from API
  
  // Initialize the application
  async init() {
    console.log('Expense Tracker App initialized');
    
    // Clear all localStorage data (migrate to MongoDB)
    this.clearAllLocalStorage();
    
    // Wait for Auth to initialize and check route protection FIRST
    if (typeof Auth !== 'undefined') {
      // Auth should already be initialized, but verify state
      await Auth.checkAuthState();
      this.currentUser = Auth.getCurrentUser();
      
      // Check if we're on a protected page and not authenticated
      const currentPage = Auth.getCurrentPage ? Auth.getCurrentPage() : this.getCurrentPage();
      const requiresAuth = Auth.requiresAuthentication ? Auth.requiresAuthentication(currentPage) : false;
      
      if (requiresAuth && !Auth.isAuthenticated) {
        // Don't continue initialization if not authenticated on protected page
        console.log('Unauthorized access - stopping initialization');
        return;
      }
    } else {
      this.checkAuthState();
    }
    
    // Apply settings (theme, currency) after auth check
    await this.applySettings();
    
    this.setupEventListeners();
    await this.loadData();
    
    // Initialize page-specific features
    this.initializePageFeatures();
  },

  // Clear all localStorage data (migrate to MongoDB)
  clearAllLocalStorage() {
    try {
      // Keep only the authentication tokens if they exist
      const apiToken = localStorage.getItem('expenseTrackerToken');
      const sessionToken = localStorage.getItem('expenseTrackerSessionToken');
      const currentUser = localStorage.getItem('expenseTrackerCurrentUser');
      
      // Get all keys and remove non-auth ones
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Keep only auth-related keys
        if (key && 
            key !== 'expenseTrackerToken' && 
            key !== 'expenseTrackerSessionToken' && 
            key !== 'expenseTrackerCurrentUser') {
          keysToRemove.push(key);
        }
      }
      
      // Remove all non-auth keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Sync tokens between API and Auth
      if (sessionToken && typeof API !== 'undefined') {
        API.setToken(sessionToken);
      } else if (apiToken && typeof API !== 'undefined') {
        API.setToken(apiToken);
        // Also store in Auth's key for consistency
        if (!sessionToken) {
          localStorage.setItem('expenseTrackerSessionToken', apiToken);
        }
      }
      
      console.log('LocalStorage cleared - all data now in MongoDB. Auth tokens preserved.');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  // Ensure admin account exists (now handled by server-side initialization)
  async ensureAdminAccount() {
    // Admin account is now created server-side on startup
    // This function is kept for compatibility but does nothing
    // The admin account is automatically created in MongoDB by the server
    console.log('Admin account initialization handled by server');
  },

  // Apply settings (theme, currency)
  async applySettings() {
    // Check if user is logged in
    const isAuthenticated = (typeof Auth !== 'undefined' && Auth.isUserAuthenticated && Auth.isUserAuthenticated()) ||
                           (this.currentUser !== null);
    
    // Force light mode for logged out users
    if (!isAuthenticated) {
      document.body.setAttribute('data-theme', 'light');
      return;
    }
    
    try {
      // Load settings from API
      if (typeof API !== 'undefined' && API.getSettings) {
        try {
          const settingsData = await API.getSettings();
          const theme = settingsData.theme || 'light';
          document.body.setAttribute('data-theme', theme);
          
          // Store in local settings for quick access
          this.settings = {
            ...this.settings,
            theme: settingsData.theme,
            currency: settingsData.currency
          };
        } catch (error) {
          console.error('Error loading settings from API:', error);
          // Fallback to localStorage
          const settings = this.getFromStorage(this.STORAGE_KEYS.SETTINGS) || this.getDefaultSettings();
          const theme = settings.theme || 'light';
          document.body.setAttribute('data-theme', theme);
        }
      } else {
        // Fallback to localStorage
        const settings = this.getFromStorage(this.STORAGE_KEYS.SETTINGS) || this.getDefaultSettings();
        const theme = settings.theme || 'light';
        document.body.setAttribute('data-theme', theme);
      }
    } catch (error) {
      console.error('Error applying settings:', error);
      // Default to light theme on error
      document.body.setAttribute('data-theme', 'light');
    }
  },

  // Initialize page-specific features
  initializePageFeatures() {
    const currentPage = this.getCurrentPage();
    
    if (currentPage === 'dashboard') {
      // Initialize dashboard features
      this.updateExpenseList();
    } else if (currentPage === 'reports') {
      // Charts will be initialized after loadData completes
    } else if (currentPage === 'login') {
      // Setup login form
      this.setupLoginForm();
    } else if (currentPage === 'signup') {
      // Setup signup form
      this.setupSignupForm();
      }
  },
    
  // Get current page name
  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    if (filename === 'index.html' || filename === '' || filename.endsWith('/')) {
      return 'index';
    } else if (filename === 'dashboard.html') {
      return 'dashboard';
    } else if (filename === 'reports.html') {
      return 'reports';
    } else if (filename === 'settings.html') {
      return 'settings';
    } else if (filename === 'admin.html') {
      return 'admin';
    } else if (filename === 'login.html') {
      return 'login';
    } else if (filename === 'signup.html') {
      return 'signup';
    }
    
    return 'index';
  },

  // Setup event listeners using event delegation
  setupEventListeners() {
    // Clear form button
    const clearFormBtn = document.getElementById('clearFormBtn');
    if (clearFormBtn) {
      clearFormBtn.addEventListener('click', () => {
        if (expenseForm) {
          expenseForm.reset();
        }
      });
    }

    // Filter controls (dashboard page)
    const categoryFilter = document.getElementById('categoryFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    if (categoryFilter) {
      categoryFilter.addEventListener('change', this.filterExpenses.bind(this));
    }
    
    if (dateFilter) {
      dateFilter.addEventListener('change', this.filterExpenses.bind(this));
    }

    // Delete modal handlers (dashboard page)
    this.setupDeleteModalListeners();
  },

  // Setup login form (login page)
  setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin(e.target);
      });
    }
  },

  // Setup signup form (signup page)
  setupSignupForm() {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSignup(e.target);
      });
    }
  },


  // Handle form submission
  async handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const expense = {
      amount: parseFloat(formData.get('amount')),
      description: formData.get('description'),
      category: formData.get('category'),
      date: formData.get('date')
    };

    // Validate form
    if (this.validateExpense(expense)) {
      await this.addExpense(expense);
      e.target.reset();
    }
  },

  // Validate expense data
  validateExpense(expense) {
    if (!expense.amount || expense.amount <= 0) {
      this.showError('Please enter a valid amount');
      return false;
    }
    
    if (!expense.description.trim()) {
      this.showError('Please enter a description');
      return false;
    }
    
    if (!expense.category) {
      this.showError('Please select a category');
      return false;
    }
    
    if (!expense.date) {
      this.showError('Please select a date');
      return false;
    }
    
    return true;
  },


  // Update expense list display
  updateExpenseList() {
    const expenseItems = document.getElementById('expenseItems');
    if (!expenseItems) return;

    if (this.expenses.length === 0) {
      expenseItems.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📊</div>
          <h4 class="empty-state__title">No expenses yet</h4>
          <p class="empty-state__message">Add your first expense to get started.</p>
        </div>
      `;
      return;
    }

    expenseItems.innerHTML = this.expenses
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(expense => {
        // Use MongoDB _id if available, otherwise use id
        const expenseId = expense._id || expense.id;
        return this.createExpenseItem({ ...expense, id: expenseId });
      })
      .join('');
    
    // Setup event listeners for edit/delete buttons using event delegation
    this.setupExpenseItemListeners();
  },

  // Setup event listeners for expense item actions
  setupExpenseItemListeners() {
    const expenseItems = document.getElementById('expenseItems');
    if (!expenseItems) return;

    // Remove existing listener to prevent duplicates
    const newExpenseItems = expenseItems.cloneNode(true);
    expenseItems.parentNode.replaceChild(newExpenseItems, expenseItems);
    const updatedExpenseItems = document.getElementById('expenseItems');
    if (!updatedExpenseItems) return;

    // Use event delegation for edit and delete buttons
    updatedExpenseItems.addEventListener('click', (e) => {
      // Check for edit/delete buttons by class
      const editBtn = e.target.closest('.expense-item__action--edit');
      const deleteBtn = e.target.closest('.expense-item__action--delete');
      
      if (editBtn) {
        e.preventDefault();
        e.stopPropagation();
        const expenseId = editBtn.getAttribute('data-id');
        if (expenseId && typeof Dashboard !== 'undefined' && Dashboard.handleEditExpense) {
          Dashboard.handleEditExpense(expenseId);
        }
      } else if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const expenseId = deleteBtn.getAttribute('data-id');
        if (expenseId && typeof Dashboard !== 'undefined' && Dashboard.handleDeleteExpense) {
          Dashboard.handleDeleteExpense(expenseId);
        }
      }
    });
  },

  // Create expense item HTML
  createExpenseItem(expense) {
    const categoryIcons = {
      food: '🍔',
      transport: '🚗',
      entertainment: '🎬',
      utilities: '⚡',
      shopping: '🛍️',
      healthcare: '🏥',
      education: '📚',
      other: '📋'
    };

    const categoryNames = {
      food: 'Food & Dining',
      transport: 'Transportation',
      entertainment: 'Entertainment',
      utilities: 'Utilities',
      shopping: 'Shopping',
      healthcare: 'Healthcare',
      education: 'Education',
      other: 'Other'
    };

    const date = new Date(expense.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });

    return `
      <div class="expense-item" data-expense-id="${expense.id}">
        <div class="expense-item__icon">${categoryIcons[expense.category] || '📋'}</div>
        <div class="expense-item__content">
          <h4 class="expense-item__title">${expense.description}</h4>
          <p class="expense-item__category">${categoryNames[expense.category] || 'Other'}</p>
        </div>
        <div class="expense-item__amount">$${expense.amount.toFixed(2)}</div>
        <div class="expense-item__date">${formattedDate}</div>
        <div class="expense-item__actions">
          <button class="expense-item__btn expense-item__btn--edit" aria-label="Edit expense" data-action="edit">
            <span class="expense-item__btn-icon">✏️</span>
          </button>
          <button class="expense-item__btn expense-item__btn--delete" aria-label="Delete expense" data-action="delete">
            <span class="expense-item__btn-icon">🗑️</span>
          </button>
        </div>
      </div>
    `;
  },

  // Filter expenses
  filterExpenses() {
    const categoryFilter = document.getElementById('categoryFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    let filteredExpenses = [...this.expenses];
    
    if (categoryFilter && categoryFilter.value) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.category === categoryFilter.value
      );
    }
    
    if (dateFilter && dateFilter.value) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.date === dateFilter.value
      );
    }
    
    // Update display with filtered results
    this.displayFilteredExpenses(filteredExpenses);
  },

  // Display filtered expenses
  displayFilteredExpenses(expenses) {
    const expenseItems = document.getElementById('expenseItems');
    if (!expenseItems) return;

    if (expenses.length === 0) {
      expenseItems.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🔍</div>
          <h4 class="empty-state__title">No expenses found</h4>
          <p class="empty-state__message">Try adjusting your filters.</p>
        </div>
      `;
      return;
    }

    expenseItems.innerHTML = expenses
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(expense => this.createExpenseItem(expense))
      .join('');
    
    // Setup event listeners for edit/delete buttons
    this.setupExpenseItemListeners();
  },

  // Show edit form for expense
  async showEditForm(expenseId) {
    const expense = await this.getExpense(expenseId);
    if (!expense) return;

    // Use MongoDB _id if available, otherwise use the provided id
    const expenseIdToUse = expense._id || expense.id || expenseId;
    
    // Find expense item by either id
    const expenseItem = document.querySelector(`[data-expense-id="${expenseId}"]`) ||
                       document.querySelector(`[data-expense-id="${expenseIdToUse}"]`);
    if (!expenseItem || expenseItem.classList.contains('expense-item--editing')) return;

    expenseItem.classList.add('expense-item--editing');
    
    const categoryIcons = {
      food: '🍔',
      transport: '🚗',
      entertainment: '🎬',
      utilities: '⚡',
      shopping: '🛍️',
      healthcare: '🏥',
      education: '📚',
      other: '📋'
    };

    const editFormHTML = `
      <div class="expense-item__edit-form">
        <div class="expense-item__edit-header">
          <h4 class="expense-item__edit-title">Edit Expense</h4>
        </div>
        <form class="expense-item__edit-form-inner" data-expense-id="${expenseIdToUse}">
          <div class="form__group">
            <label for="editAmount_${expenseId}" class="form__label">Amount</label>
            <div class="form__input-wrapper">
              <span class="form__currency">$</span>
              <input 
                type="number" 
                id="editAmount_${expenseId}" 
                name="amount" 
                class="form__input form__input--number" 
                value="${expense.amount}"
                step="0.01"
                min="0"
                required
              >
            </div>
          </div>
          
          <div class="form__group">
            <label for="editDescription_${expenseId}" class="form__label">Description</label>
            <input 
              type="text" 
              id="editDescription_${expenseId}" 
              name="description" 
              class="form__input" 
              value="${expense.description}"
              required
            >
          </div>
          
          <div class="form__group">
            <label for="editCategory_${expenseId}" class="form__label">Category</label>
            <select id="editCategory_${expenseId}" name="category" class="form__select" required>
              <option value="food" ${expense.category === 'food' ? 'selected' : ''}>🍔 Food & Dining</option>
              <option value="transport" ${expense.category === 'transport' ? 'selected' : ''}>🚗 Transportation</option>
              <option value="entertainment" ${expense.category === 'entertainment' ? 'selected' : ''}>🎬 Entertainment</option>
              <option value="utilities" ${expense.category === 'utilities' ? 'selected' : ''}>⚡ Utilities</option>
              <option value="shopping" ${expense.category === 'shopping' ? 'selected' : ''}>🛍️ Shopping</option>
              <option value="healthcare" ${expense.category === 'healthcare' ? 'selected' : ''}>🏥 Healthcare</option>
              <option value="education" ${expense.category === 'education' ? 'selected' : ''}>📚 Education</option>
              <option value="other" ${expense.category === 'other' ? 'selected' : ''}>📋 Other</option>
            </select>
          </div>
          
          <div class="form__group">
            <label for="editDate_${expenseId}" class="form__label">Date</label>
            <input 
              type="date" 
              id="editDate_${expenseId}" 
              name="date" 
              class="form__input" 
              value="${expense.date}"
              required
            >
          </div>
          
          <div class="expense-item__edit-actions">
            <button type="submit" class="btn btn--primary">Save</button>
            <button type="button" class="btn btn--secondary" data-action="cancel-edit">Cancel</button>
          </div>
        </form>
      </div>
    `;

    expenseItem.innerHTML = editFormHTML;

    // Focus on first input
    const firstInput = expenseItem.querySelector('input');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }

    // Handle form submission
    const form = expenseItem.querySelector('form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Use MongoDB _id if available
        const idToUse = expense._id || expense.id || expenseId;
        await this.saveEditedExpense(idToUse, form);
      });
    }

    // Handle cancel button
    const cancelBtn = expenseItem.querySelector('[data-action="cancel-edit"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.cancelEdit(expenseId);
      });
    }
  },

  // Save edited expense
  async saveEditedExpense(expenseId, form) {
    const formData = new FormData(form);
    const updatedData = {
      amount: parseFloat(formData.get('amount')),
      description: formData.get('description').trim(),
      category: formData.get('category'),
      date: formData.get('date')
    };

    // Validate
    if (!this.validateExpense(updatedData)) {
      return;
    }

    // Update expense
    await this.updateExpense(expenseId, updatedData);
  },

  // Cancel edit
  cancelEdit(expenseId) {
    this.updateExpenseList();
  },

  // Handle delete expense - show custom modal
  async handleDeleteExpense(expenseId) {
    const expense = await this.getExpense(expenseId);
    if (!expense) return;

    this.showDeleteModal(expense);
  },

  // Show delete confirmation modal
  showDeleteModal(expense) {
    const modal = document.getElementById('deleteModal');
    const modalBody = document.getElementById('deleteModalBody');
    if (!modal || !modalBody) return;

    // Populate expense details
    const categoryNames = {
      food: 'Food & Dining',
      transport: 'Transportation',
      entertainment: 'Entertainment',
      utilities: 'Utilities',
      shopping: 'Shopping',
      healthcare: 'Healthcare',
      education: 'Education',
      other: 'Other'
    };

    const date = new Date(expense.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });

    modalBody.innerHTML = `
      <div class="delete-expense-details">
        <div class="delete-expense-item">
          <span class="delete-expense-label">Description:</span>
          <span class="delete-expense-value">${expense.description}</span>
        </div>
        <div class="delete-expense-item">
          <span class="delete-expense-label">Amount:</span>
          <span class="delete-expense-value delete-expense-value--amount">$${expense.amount.toFixed(2)}</span>
        </div>
        <div class="delete-expense-item">
          <span class="delete-expense-label">Category:</span>
          <span class="delete-expense-value">${categoryNames[expense.category] || 'Other'}</span>
        </div>
        <div class="delete-expense-item">
          <span class="delete-expense-label">Date:</span>
          <span class="delete-expense-value">${formattedDate}</span>
        </div>
      </div>
    `;

    // Store expense ID for deletion (use MongoDB _id if available)
    const expenseId = expense._id || expense.id;
    modal.setAttribute('data-expense-id', expenseId);

    // Show modal
    modal.classList.add('modal--open');
    document.body.classList.add('body--modal-open');

    // Focus on cancel button for accessibility
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    if (cancelBtn) {
      setTimeout(() => cancelBtn.focus(), 100);
    }

    // Setup event listeners (only once)
    this.setupDeleteModalListeners();
  },

  // Setup delete modal event listeners
  setupDeleteModalListeners() {
    const modal = document.getElementById('deleteModal');
    if (!modal) return;

    // Check if listeners are already attached
    if (modal.hasAttribute('data-listeners-attached')) return;
    modal.setAttribute('data-listeners-attached', 'true');

    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const backdrop = modal.querySelector('.modal__backdrop');

    // Cancel button
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeDeleteModal());
    }

    // Confirm delete button
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const expenseId = modal.getAttribute('data-expense-id');
        if (expenseId) {
          this.confirmDelete(expenseId);
        }
      });
    }

    // Backdrop click
    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeDeleteModal());
    }

    // ESC key handler - check existing global handler handles it
    // If not, this will be handled by the global ESC handler in setupEventListeners
  },

  // Close delete modal
  closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (!modal) return;

    modal.classList.remove('modal--open');
    
    // Check if any other modal is open
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const anyModalOpen = (loginModal && loginModal.classList.contains('modal--open')) ||
                        (signupModal && signupModal.classList.contains('modal--open'));
    
    if (!anyModalOpen) {
      document.body.classList.remove('body--modal-open');
    }

    // Remove expense ID
    modal.removeAttribute('data-expense-id');
  },

  // Confirm and execute deletion
  async confirmDelete(expenseId) {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (!confirmBtn) return;

    // Add loading state
    confirmBtn.classList.add('btn--loading');
    confirmBtn.disabled = true;

    try {
    // Small delay for visual feedback, then delete
      await this.deleteExpense(expenseId);
      this.closeDeleteModal();
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      // Reset button state
      confirmBtn.classList.remove('btn--loading');
      confirmBtn.disabled = false;
    }
  },

  // Show success message
  showSuccessMessage(message) {
    this.showMessage(message, 'success');
  },

  // Show error message
  showError(message) {
    this.showMessage(message, 'error');
  },

  // Show message (success or error)
  showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message--${type}`;
    messageDiv.textContent = message;
    
    // Add to top of main content
    const main = document.querySelector('.main');
    if (main) {
      main.insertBefore(messageDiv, main.firstChild);
      
      // Remove after 3 seconds
      setTimeout(() => {
        messageDiv.remove();
      }, 3000);
    }
  },

  // ========================================
  // LOCAL STORAGE MANAGEMENT
  // ========================================
  
  // Storage keys
  STORAGE_KEYS: {
    EXPENSES: 'expenseTrackerExpenses',
    CATEGORIES: 'expenseTrackerCategories',
    SETTINGS: 'expenseTrackerSettings',
    USERS: 'expenseTrackerUsers',
    CURRENT_USER: 'expenseTrackerCurrentUser'
  },

  // Default categories
  defaultCategories: [
    { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#fbbf24' },
    { id: 'transport', name: 'Transportation', icon: '🚗', color: '#3b82f6' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
    { id: 'utilities', name: 'Utilities', icon: '⚡', color: '#10b981' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#ec4899' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: '#ef4444' },
    { id: 'education', name: 'Education', icon: '📚', color: '#06b6d4' },
    { id: 'other', name: 'Other', icon: '📋', color: '#6b7280' }
  ],

  // Load data from API or localStorage with error handling
  async loadData() {
    try {
      // Load expenses from API
      if (typeof API !== 'undefined' && API.getExpenses) {
        try {
          const expenses = await API.getExpenses();
          this.expenses = expenses.map(expense => ({
            id: expense._id || expense.id,
            ...expense
          }));
        } catch (error) {
          console.error('Error loading expenses from API:', error);
          // Fallback to localStorage
      const savedExpenses = this.getFromStorage(this.STORAGE_KEYS.EXPENSES);
      if (savedExpenses && Array.isArray(savedExpenses)) {
        this.expenses = savedExpenses;
      } else {
            this.expenses = [];
          }
        }
      } else {
        // Fallback to localStorage
        const savedExpenses = this.getFromStorage(this.STORAGE_KEYS.EXPENSES);
        if (savedExpenses && Array.isArray(savedExpenses)) {
          this.expenses = savedExpenses;
        } else {
          this.expenses = [];
        }
      }

      // Load categories (always from default, not stored in DB)
      const savedCategories = this.getFromStorage(this.STORAGE_KEYS.CATEGORIES);
      if (savedCategories && Array.isArray(savedCategories)) {
        this.categories = savedCategories;
      } else {
        this.categories = [...this.defaultCategories];
        this.saveCategories();
      }

      // Load settings from API
      if (typeof API !== 'undefined' && API.getSettings) {
        try {
          const settingsData = await API.getSettings();
          this.settings = {
            theme: settingsData.theme || 'light',
            currency: settingsData.currency || 'USD',
            dateFormat: settingsData.dateFormat || 'MM/DD/YYYY',
            notifications: settingsData.notifications !== undefined ? settingsData.notifications : true
          };
          // Apply settings immediately
          this.applySettings();
        } catch (error) {
          console.error('Error loading settings from API:', error);
          // Fallback to localStorage
      const savedSettings = this.getFromStorage(this.STORAGE_KEYS.SETTINGS);
      this.settings = savedSettings || this.getDefaultSettings();
          this.applySettings();
        }
      } else {
        // Fallback to localStorage
        const savedSettings = this.getFromStorage(this.STORAGE_KEYS.SETTINGS);
        this.settings = savedSettings || this.getDefaultSettings();
        this.applySettings();
      }
      
      // Load budget from API
      if (typeof API !== 'undefined' && API.getBudget) {
        try {
          const budgetData = await API.getBudget();
          this.budgetSettings = {
            monthlyBudget: budgetData.monthlyBudget || 3000
          };
        } catch (error) {
          console.error('Error loading budget from API:', error);
          // Fallback to default
          this.budgetSettings = { monthlyBudget: 3000 };
        }
      } else {
        // Fallback to default
        this.budgetSettings = { monthlyBudget: 3000 };
      }
      
      this.updateExpenseList();
      console.log('Data loaded successfully:', {
        expenses: this.expenses.length,
        categories: this.categories.length
      });
      
      // Initialize charts if on reports page
      if (this.getCurrentPage() === 'reports') {
        setTimeout(() => {
          this.initializeCharts();
        }, 100);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.showError('Failed to load saved data.');
      this.expenses = [];
      this.categories = [...this.defaultCategories];
      this.settings = this.getDefaultSettings();
      this.updateExpenseList();
      
      // Initialize charts if on reports page
      if (this.getCurrentPage() === 'reports') {
        setTimeout(() => {
          this.initializeCharts();
        }, 100);
      }
    }
  },

  // Get demo expenses
  getDemoExpenses() {
    const baseId = Date.now();
    return [
      {
        id: baseId - 20,
        amount: 12.50,
        description: 'Lunch at Cafe',
        category: 'food',
        date: '2025-11-13',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 19,
        amount: 45.00,
        description: 'Gas Station',
        category: 'transport',
        date: '2025-11-08',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 18,
        amount: 24.00,
        description: 'Movie Tickets',
        category: 'entertainment',
        date: '2025-11-02',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 17,
        amount: 89.50,
        description: 'Electric Bill',
        category: 'utilities',
        date: '2025-10-28',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 16,
        amount: 125.00,
        description: 'Grocery Shopping',
        category: 'food',
        date: '2025-10-22',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 15,
        amount: 75.00,
        description: 'Doctor Visit',
        category: 'healthcare',
        date: '2025-10-15',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 14,
        amount: 199.99,
        description: 'New Shoes',
        category: 'shopping',
        date: '2025-10-08',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 13,
        amount: 35.00,
        description: 'Uber Ride',
        category: 'transport',
        date: '2025-09-30',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 12,
        amount: 49.99,
        description: 'Online Course',
        category: 'education',
        date: '2025-09-25',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 11,
        amount: 28.50,
        description: 'Coffee & Pastries',
        category: 'food',
        date: '2025-09-18',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 10,
        amount: 120.00,
        description: 'Water Bill',
        category: 'utilities',
        date: '2025-09-12',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 9,
        amount: 65.00,
        description: 'Concert Tickets',
        category: 'entertainment',
        date: '2025-09-05',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 8,
        amount: 85.00,
        description: 'Pharmacy',
        category: 'healthcare',
        date: '2025-08-28',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 7,
        amount: 150.00,
        description: 'Clothing Store',
        category: 'shopping',
        date: '2025-08-20',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 6,
        amount: 22.00,
        description: 'Bus Pass',
        category: 'transport',
        date: '2025-08-14',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 5,
        amount: 95.00,
        description: 'Textbook Purchase',
        category: 'education',
        date: '2025-08-07',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 4,
        amount: 18.75,
        description: 'Dinner Out',
        category: 'food',
        date: '2025-07-30',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 3,
        amount: 110.00,
        description: 'Internet Bill',
        category: 'utilities',
        date: '2025-07-22',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 2,
        amount: 42.00,
        description: 'Streaming Service',
        category: 'entertainment',
        date: '2025-07-15',
        createdAt: new Date().toISOString()
      },
      {
        id: baseId - 1,
        amount: 55.00,
        description: 'Gym Membership',
        category: 'healthcare',
        date: '2025-06-10',
        createdAt: new Date().toISOString()
      }
    ];
  },

  // Get default settings
  getDefaultSettings() {
    return {
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      theme: 'light',
      notifications: true,
      budgetLimit: 3000
    };
  },

  // Initialize with demo data
  initializeWithDemoData() {
    this.expenses = this.getDemoExpenses();
    this.categories = [...this.defaultCategories];
    this.settings = this.getDefaultSettings();
    this.updateExpenseList();
  },

  // Generic storage getter with error handling
  getFromStorage(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  },

  // Generic storage setter with error handling
  setToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
      return false;
    }
  },

  // Save expenses to localStorage
  saveExpenses() {
    const success = this.setToStorage(this.STORAGE_KEYS.EXPENSES, this.expenses);
    if (!success) {
      this.showError('Failed to save expenses. Data may be lost.');
    }
    return success;
  },

  // Save categories to localStorage
  saveCategories() {
    const success = this.setToStorage(this.STORAGE_KEYS.CATEGORIES, this.categories);
    if (!success) {
      this.showError('Failed to save categories.');
    }
    return success;
  },

  // Save settings to localStorage
  saveSettings() {
    const success = this.setToStorage(this.STORAGE_KEYS.SETTINGS, this.settings);
    if (!success) {
      this.showError('Failed to save settings.');
    }
    return success;
  },

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  // Create - Add new expense (using API)
  async addExpense(expense) {
    try {
      if (typeof API !== 'undefined' && API.createExpense) {
        const newExpense = await API.createExpense({
          amount: parseFloat(expense.amount),
          description: expense.description.trim(),
          category: expense.category,
          date: expense.date
        });
        
        // Add to local array for immediate UI update
        this.expenses.push({
          id: newExpense._id || newExpense.id,
          ...newExpense
        });
        this.updateExpenseList();
        this.updateCharts();
        this.showSuccessMessage('Expense added successfully!');
        return newExpense;
      } else {
        // Fallback to localStorage if API not available
      const newExpense = {
        id: Date.now(),
        amount: parseFloat(expense.amount),
        description: expense.description.trim(),
        category: expense.category,
        date: expense.date,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.expenses.push(newExpense);
      this.saveExpenses();
      this.updateExpenseList();
      this.updateCharts();
      this.showSuccessMessage('Expense added successfully!');
      return newExpense;
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      this.showError(error.message || 'Failed to add expense. Please try again.');
      return null;
    }
  },

  // Read - Get expense by ID
  async getExpense(id) {
    try {
      if (typeof API !== 'undefined' && API.getExpense) {
        const expense = await API.getExpense(id);
        return expense;
      } else {
        // Fallback to local array
        return this.expenses.find(expense => expense.id === id || expense._id === id);
      }
    } catch (error) {
      console.error('Error getting expense:', error);
      // Fallback to local array
      return this.expenses.find(expense => expense.id === id || expense._id === id);
    }
  },

  // Update - Update existing expense (using API)
  async updateExpense(id, updatedData) {
    try {
      if (typeof API !== 'undefined' && API.updateExpense) {
        // Convert id to string for comparison
        const idStr = String(id);
        const updatedExpense = await API.updateExpense(idStr, updatedData);
        
        if (!updatedExpense) {
          throw new Error('Failed to update expense');
        }
        
        // Update local array - handle both _id and id formats
        const index = this.expenses.findIndex(expense => {
          const expenseId = String(expense._id || expense.id);
          const updatedId = String(updatedExpense._id || updatedExpense.id);
          return expenseId === idStr || expenseId === updatedId;
        });
        
        if (index !== -1) {
          this.expenses[index] = {
            ...this.expenses[index],
            ...updatedExpense,
            id: updatedExpense._id || updatedExpense.id,
            _id: updatedExpense._id
          };
        } else {
          // If not found, add it
          this.expenses.push({
            id: updatedExpense._id || updatedExpense.id,
            _id: updatedExpense._id,
            ...updatedExpense
          });
        }
        
        this.updateExpenseList();
        this.updateCharts();
        this.showSuccessMessage('Expense updated successfully!');
        return true;
      } else {
        // Fallback to localStorage
      const index = this.expenses.findIndex(expense => expense.id === id);
      if (index === -1) {
        this.showError('Expense not found.');
        return false;
      }

      this.expenses[index] = {
        ...this.expenses[index],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };

      this.saveExpenses();
      this.updateExpenseList();
      this.updateCharts();
      this.showSuccessMessage('Expense updated successfully!');
      return true;
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      this.showError(error.message || 'Failed to update expense. Please try again.');
      return false;
    }
  },

  // Delete - Remove expense (using API)
  async deleteExpense(id) {
    try {
      if (typeof API !== 'undefined' && API.deleteExpense) {
        await API.deleteExpense(id);
        
        // Remove from local array
        const index = this.expenses.findIndex(expense => 
          expense.id === id || expense._id === id
        );
        if (index !== -1) {
          this.expenses.splice(index, 1);
        }
        
        this.updateExpenseList();
        this.updateCharts();
        this.showSuccessMessage('Expense deleted successfully!');
        return true;
      } else {
        // Fallback to localStorage
      const index = this.expenses.findIndex(expense => expense.id === id);
      if (index === -1) {
        this.showError('Expense not found.');
        return false;
      }

      this.expenses.splice(index, 1);
      this.saveExpenses();
      this.updateExpenseList();
      this.updateCharts();
      this.showSuccessMessage('Expense deleted successfully!');
      return true;
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      this.showError(error.message || 'Failed to delete expense. Please try again.');
      return false;
    }
  },

  // Get all expenses
  getAllExpenses() {
    return [...this.expenses];
  },

  // Get expenses by category
  getExpensesByCategory(category) {
    return this.expenses.filter(expense => expense.category === category);
  },

  // Get expenses by date range
  getExpensesByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= start && expenseDate <= end;
    });
  },

  // Get total spending
  getTotalSpending() {
    return this.expenses.reduce((total, expense) => total + expense.amount, 0);
  },

  // Get spending by category
  getSpendingByCategory() {
    const categoryTotals = {};
    this.expenses.forEach(expense => {
      if (categoryTotals[expense.category]) {
        categoryTotals[expense.category] += expense.amount;
      } else {
        categoryTotals[expense.category] = expense.amount;
      }
    });
    return categoryTotals;
  },

  // Clear all data
  clearAllData() {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.EXPENSES);
      localStorage.removeItem(this.STORAGE_KEYS.CATEGORIES);
      localStorage.removeItem(this.STORAGE_KEYS.SETTINGS);
      
      this.expenses = [];
      this.categories = [...this.defaultCategories];
      this.settings = this.getDefaultSettings();
      
      this.updateExpenseList();
      this.updateCharts();
      this.showSuccessMessage('All data cleared successfully!');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      this.showError('Failed to clear data. Please try again.');
      return false;
    }
  },

  // Export data as JSON
  exportData() {
    try {
      const exportData = {
        expenses: this.expenses,
        categories: this.categories,
        settings: this.settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      this.showSuccessMessage('Data exported successfully!');
      return true;
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showError('Failed to export data. Please try again.');
      return false;
    }
  },

  // Import data from JSON
  importData(file) {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          if (importData.expenses && Array.isArray(importData.expenses)) {
            this.expenses = importData.expenses;
            this.saveExpenses();
          }
          
          if (importData.categories && Array.isArray(importData.categories)) {
            this.categories = importData.categories;
            this.saveCategories();
          }
          
          if (importData.settings) {
            this.settings = { ...this.settings, ...importData.settings };
            this.saveSettings();
          }
          
          this.updateExpenseList();
          this.updateCharts();
          this.showSuccessMessage('Data imported successfully!');
        } catch (parseError) {
          console.error('Error parsing imported data:', parseError);
          this.showError('Invalid file format. Please check your backup file.');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing data:', error);
      this.showError('Failed to import data. Please try again.');
    }
  },

  // Initialize charts (called from charts.js)
  initializeCharts() {
    if (typeof Charts !== 'undefined') {
      Charts.init(this.expenses);
    }
  },

  // Update charts with current data
  updateCharts() {
    if (typeof Charts !== 'undefined') {
      Charts.updateCharts(this.expenses);
    }
  },


  // ========================================
  // AUTHENTICATION
  // ========================================

  // Check authentication state on load
  checkAuthState() {
    // Use Auth manager if available
    if (typeof Auth !== 'undefined' && Auth.checkAuthState) {
      Auth.checkAuthState();
      this.currentUser = Auth.getCurrentUser();
    } else {
      // Fallback to direct check
      const savedUser = this.getFromStorage(this.STORAGE_KEYS.CURRENT_USER);
      if (savedUser) {
        this.currentUser = savedUser;
        this.updateAuthUI();
      }
    }
  },

  // Show message in auth page
  showAuthMessage(pageType, message, type) {
    const messageId = pageType === 'login' ? 'loginMessage' : 'signupMessage';
    const messageEl = document.getElementById(messageId);
    
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `auth-card__message auth-card__message--${type}`;
      
      // Auto-hide success messages after 3 seconds
      if (type === 'success') {
        setTimeout(() => {
          messageEl.className = 'auth-card__message';
            messageEl.textContent = '';
        }, 3000);
      }
    }
  },

  // Handle signup
  async handleSignup(form) {
    const formData = new FormData(form);
    const name = formData.get('name').trim();
    const email = formData.get('email').trim().toLowerCase();
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const terms = formData.get('terms');

    // Clear previous messages
    this.showAuthMessage('signup', '', 'success');

    // Validation
    if (!name || name.length < 2) {
      this.showAuthMessage('signup', 'Please enter your full name (at least 2 characters)', 'error');
      return;
    }

    if (!email || !this.validateEmail(email)) {
      this.showAuthMessage('signup', 'Please enter a valid email address', 'error');
      return;
    }

    if (!password || password.length < 6) {
      this.showAuthMessage('signup', 'Password must be at least 6 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      this.showAuthMessage('signup', 'Passwords do not match', 'error');
      return;
    }

    if (!terms) {
      this.showAuthMessage('signup', 'Please agree to the Terms of Service and Privacy Policy', 'error');
      return;
    }

    // Use API to signup
    try {
      if (typeof API !== 'undefined') {
        const response = await API.signup({ name, email, password });

    // Auto-login after signup
        if (response.user && response.token) {
    if (typeof Auth !== 'undefined' && Auth.login) {
            Auth.login(response.user, response.token);
          }
          this.currentUser = response.user;
    }

    this.showAuthMessage('signup', `Welcome, ${name}! Your account has been created successfully. Redirecting...`, 'success');
    
    // Redirect to dashboard after short delay
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
      } else {
        // Fallback to localStorage if API not available
        this.showAuthMessage('signup', 'API not available. Please ensure the server is running.', 'error');
      }
    } catch (error) {
      this.showAuthMessage('signup', error.message || 'Failed to create account. Please try again.', 'error');
    }
  },

  // Handle login
  async handleLogin(form) {
    const formData = new FormData(form);
    const email = formData.get('email').trim().toLowerCase();
    const password = formData.get('password');
    const remember = formData.get('remember');

    const messageEl = document.getElementById('loginMessage');
    
    // Clear previous messages
    if (messageEl) {
      messageEl.textContent = '';
      messageEl.className = 'auth-card__message';
    }

    // Validation
    if (!email || !this.validateEmail(email)) {
      this.showAuthMessage('login', 'Please enter a valid email address', 'error');
      return;
    }

    if (!password) {
      this.showAuthMessage('login', 'Please enter your password', 'error');
      return;
    }

    // Use API to login
    try {
      if (typeof API !== 'undefined') {
        const response = await API.login(email, password);
        
        if (response.user && response.token) {
    // Use Auth manager to login
    if (typeof Auth !== 'undefined' && Auth.login) {
            Auth.login(response.user, response.token);
          }
          this.currentUser = response.user;

          this.showAuthMessage('login', `Welcome back, ${response.user.name}! Redirecting...`, 'success');
    
    // Redirect to dashboard after short delay
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
        }
      } else {
        // Fallback to localStorage if API not available
        this.showAuthMessage('login', 'API not available. Please ensure the server is running.', 'error');
      }
    } catch (error) {
      this.showAuthMessage('login', error.message || 'Invalid email or password. Please try again.', 'error');
    }
  },

  // Handle logout
  handleLogout() {
    // Use Auth manager to logout
    if (typeof Auth !== 'undefined' && Auth.handleLogout) {
      Auth.handleLogout();
    } else {
      // Fallback to direct logout
      this.currentUser = null;
      localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
      this.updateAuthUI();
      this.showSuccessMessage('You have been logged out successfully.');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    }
  },

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Update authentication UI (handled by navigation.js)
  updateAuthUI() {
    if (typeof Navigation !== 'undefined' && Navigation.updateAuthUI) {
      Navigation.updateAuthUI(true);
    }
  }
};

// Initialize app when DOM is loaded - RUN AFTER AUTH
document.addEventListener('DOMContentLoaded', async () => {
  // Wait a bit for Auth to initialize first (Auth.init runs first)
  await new Promise(resolve => setTimeout(resolve, 50));
  await App.init();
});
