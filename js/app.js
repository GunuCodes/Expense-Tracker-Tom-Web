/**
 * Main Application JavaScript
 * Personal Expense Tracker
 */

// Application state
const App = {
  currentView: 'expenses',
  expenses: [],
  currentUser: null,
  
  // Initialize the application
  init() {
    console.log('Expense Tracker App initialized');
    this.checkAuthState();
    this.initializeViews();
    this.setupEventListeners();
    this.loadData();
    this.initializeCharts();
  },

  // Initialize view states
  initializeViews() {
    // Get all section views
    const sections = document.querySelectorAll('.section-view');
    
    // Find which section is currently active (if any)
    const activeSection = document.querySelector('.section-view--active');
    
    // Hide all sections except the active one
    sections.forEach(section => {
      if (section !== activeSection) {
        section.style.display = 'none';
        section.classList.remove('section-view--active');
      } else {
        // Ensure active section is visible
        section.style.display = 'block';
        this.currentView = section.id || 'expenses';
      }
    });
    
    // If no active section, show expenses by default
    if (!activeSection) {
      const expensesSection = document.querySelector('#expenses');
      if (expensesSection) {
        expensesSection.style.display = 'block';
        expensesSection.classList.add('section-view--active');
        this.currentView = 'expenses';
      }
    }
    
    // Update active nav link
    document.querySelectorAll('.nav__link').forEach(link => {
      link.classList.remove('nav__link--active');
    });
    
    const expensesLink = document.querySelector('[href="#expenses"]');
    if (expensesLink && this.currentView === 'expenses') {
      expensesLink.classList.add('nav__link--active');
    } else {
      const reportsLink = document.querySelector('[href="#reports"]');
      if (reportsLink && this.currentView === 'reports') {
        reportsLink.classList.add('nav__link--active');
      }
    }
  },

  // Setup event listeners using event delegation
  setupEventListeners() {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.header__menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
    }

    // Navigation using event delegation
    document.addEventListener('click', (e) => {
      if (e.target.matches('.nav__link')) {
        e.preventDefault();
        this.handleNavigation(e.target.getAttribute('href'));
      }
    });

    // Form submission
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
      expenseForm.addEventListener('submit', this.handleFormSubmit.bind(this));
    }

    // Filter controls
    const categoryFilter = document.getElementById('categoryFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    if (categoryFilter) {
      categoryFilter.addEventListener('change', this.filterExpenses.bind(this));
    }
    
    if (dateFilter) {
      dateFilter.addEventListener('change', this.filterExpenses.bind(this));
    }

    // Modal buttons (only if user is not logged in)
    // If logged in, buttons are created by updateAuthUI()
    if (!this.currentUser) {
      const loginBtn = document.getElementById('loginBtn');
      const signupBtn = document.getElementById('signupBtn');

      if (loginBtn) {
        loginBtn.addEventListener('click', () => this.openModal('login'));
      }

      if (signupBtn) {
        signupBtn.addEventListener('click', () => this.openModal('signup'));
      }
    }
    
    // Modal close buttons and switchers
    const closeLoginBtn = document.getElementById('closeLoginBtn');
    const closeSignupBtn = document.getElementById('closeSignupBtn');
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');

    if (closeLoginBtn) {
      closeLoginBtn.addEventListener('click', () => this.closeModal('login'));
    }

    if (closeSignupBtn) {
      closeSignupBtn.addEventListener('click', () => this.closeModal('signup'));
    }

    if (switchToSignup) {
      switchToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeModal('login');
        setTimeout(() => this.openModal('signup'), 200);
      });
    }

    if (switchToLogin) {
      switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeModal('signup');
        setTimeout(() => this.openModal('login'), 200);
      });
    }

    // Close modal on backdrop click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal__backdrop')) {
        const modal = e.target.closest('.modal');
        if (modal) {
          const modalId = modal.id === 'loginModal' ? 'login' : 'signup';
          this.closeModal(modalId);
        }
      }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const loginModal = document.getElementById('loginModal');
        const signupModal = document.getElementById('signupModal');
        const deleteModal = document.getElementById('deleteModal');
        
        if (deleteModal && deleteModal.classList.contains('modal--open')) {
          this.closeDeleteModal();
        } else if (loginModal && loginModal.classList.contains('modal--open')) {
          this.closeModal('login');
        } else if (signupModal && signupModal.classList.contains('modal--open')) {
          this.closeModal('signup');
        }
      }
    });

    // Handle form submissions (frontend only - prevent default)
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin(e.target);
      });
    }

    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSignup(e.target);
      });
    }
  },

  // Toggle mobile menu
  toggleMobileMenu() {
    const nav = document.querySelector('.header__nav');
    const menuToggle = document.querySelector('.header__menu-toggle');
    
    if (nav && menuToggle) {
      nav.classList.toggle('nav--open');
      menuToggle.classList.toggle('menu-toggle--active');
    }
  },

  // Handle navigation between views
  handleNavigation(target) {
    // Don't navigate if already on the target view
    const targetView = target.replace('#', '');
    if (this.currentView === targetView) {
      return;
    }

    // Remove active class from all nav links
    document.querySelectorAll('.nav__link').forEach(link => {
      link.classList.remove('nav__link--active');
    });

    // Add active class to clicked link
    const activeLink = document.querySelector(`[href="${target}"]`);
    if (activeLink) {
      activeLink.classList.add('nav__link--active');
    }

    // Get current and target sections
    const currentSection = document.querySelector(`#${this.currentView}`);
    const targetSection = document.querySelector(target);
    
    if (!targetSection) return;

    // Hide current section with fade out
    if (currentSection && currentSection !== targetSection) {
      currentSection.classList.remove('section-view--active');
      currentSection.classList.add('section-view--hiding');
      
      setTimeout(() => {
        currentSection.style.display = 'none';
        currentSection.classList.remove('section-view--hiding');
        
        // Show target section with fade in
        targetSection.style.display = 'block';
        setTimeout(() => {
          targetSection.classList.add('section-view--active');
        }, 10);
        
        this.currentView = targetView;
        
        // Update charts if navigating to reports
        if (this.currentView === 'reports') {
          setTimeout(() => {
            this.updateCharts();
          }, 200);
        }
      }, 200);
    } else {
      // If no current section or same section, just show target
      targetSection.style.display = 'block';
      setTimeout(() => {
        targetSection.classList.add('section-view--active');
      }, 10);
      this.currentView = targetView;
      
      if (this.currentView === 'reports') {
        setTimeout(() => {
          this.updateCharts();
        }, 200);
      }
    }

    // Close mobile menu if open
    const nav = document.querySelector('.header__nav');
    const menuToggle = document.querySelector('.header__menu-toggle');
    if (nav && menuToggle && nav.classList.contains('nav--open')) {
      nav.classList.remove('nav--open');
      menuToggle.classList.remove('menu-toggle--active');
    }
  },

  // Handle form submission
  handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const expense = {
      id: Date.now(),
      amount: parseFloat(formData.get('amount')),
      description: formData.get('description'),
      category: formData.get('category'),
      date: formData.get('date')
    };

    // Validate form
    if (this.validateExpense(expense)) {
      this.addExpense(expense);
      e.target.reset();
      this.showSuccessMessage('Expense added successfully!');
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

  // Add expense to the list
  addExpense(expense) {
    this.expenses.push(expense);
    this.saveData();
    this.updateExpenseList();
    this.updateCharts();
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
      .map(expense => this.createExpenseItem(expense))
      .join('');
    
    // Setup event listeners for edit/delete buttons using event delegation
    this.setupExpenseItemListeners();
  },

  // Setup event listeners for expense item actions
  setupExpenseItemListeners() {
    const expenseItems = document.getElementById('expenseItems');
    if (!expenseItems) return;

    // Use event delegation for edit and delete buttons
    expenseItems.addEventListener('click', (e) => {
      const button = e.target.closest('[data-action]');
      if (!button) return;

      const action = button.getAttribute('data-action');
      const expenseItem = button.closest('.expense-item');
      const expenseId = parseInt(expenseItem.getAttribute('data-expense-id'));

      if (action === 'edit') {
        this.showEditForm(expenseId);
      } else if (action === 'delete') {
        this.handleDeleteExpense(expenseId);
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
  showEditForm(expenseId) {
    const expense = this.getExpense(expenseId);
    if (!expense) return;

    const expenseItem = document.querySelector(`[data-expense-id="${expenseId}"]`);
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
        <form class="expense-item__edit-form-inner" data-expense-id="${expenseId}">
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
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveEditedExpense(expenseId, form);
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
  saveEditedExpense(expenseId, form) {
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
    if (this.updateExpense(expenseId, updatedData)) {
      // Expense list will be refreshed by updateExpense method
    }
  },

  // Cancel edit
  cancelEdit(expenseId) {
    this.updateExpenseList();
  },

  // Handle delete expense - show custom modal
  handleDeleteExpense(expenseId) {
    const expense = this.getExpense(expenseId);
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

    // Store expense ID for deletion
    modal.setAttribute('data-expense-id', expense.id);

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
        const expenseId = parseInt(modal.getAttribute('data-expense-id'));
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
  confirmDelete(expenseId) {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (!confirmBtn) return;

    // Add loading state
    confirmBtn.classList.add('btn--loading');
    confirmBtn.disabled = true;

    // Small delay for visual feedback, then delete
    setTimeout(() => {
      this.deleteExpense(expenseId);
      this.closeDeleteModal();
      
      // Reset button state
      confirmBtn.classList.remove('btn--loading');
      confirmBtn.disabled = false;
    }, 300);
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

  // Load data from localStorage with error handling
  loadData() {
    try {
      // Load expenses
      const savedExpenses = this.getFromStorage(this.STORAGE_KEYS.EXPENSES);
      if (savedExpenses && Array.isArray(savedExpenses)) {
        this.expenses = savedExpenses;
      } else {
        this.expenses = this.getDemoExpenses();
        this.saveExpenses();
      }

      // Load categories
      const savedCategories = this.getFromStorage(this.STORAGE_KEYS.CATEGORIES);
      if (savedCategories && Array.isArray(savedCategories)) {
        this.categories = savedCategories;
      } else {
        this.categories = [...this.defaultCategories];
        this.saveCategories();
      }

      // Load settings
      const savedSettings = this.getFromStorage(this.STORAGE_KEYS.SETTINGS);
      this.settings = savedSettings || this.getDefaultSettings();
      
      this.updateExpenseList();
      console.log('Data loaded successfully:', {
        expenses: this.expenses.length,
        categories: this.categories.length
      });
    } catch (error) {
      console.error('Error loading data:', error);
      this.showError('Failed to load saved data. Using demo data.');
      this.initializeWithDemoData();
    }
  },

  // Get demo expenses
  getDemoExpenses() {
    return [
      {
        id: Date.now() - 4,
        amount: 12.50,
        description: 'Lunch at Cafe',
        category: 'food',
        date: '2024-12-15',
        createdAt: new Date().toISOString()
      },
      {
        id: Date.now() - 3,
        amount: 45.00,
        description: 'Gas Station',
        category: 'transport',
        date: '2024-12-14',
        createdAt: new Date().toISOString()
      },
      {
        id: Date.now() - 2,
        amount: 24.00,
        description: 'Movie Tickets',
        category: 'entertainment',
        date: '2024-12-13',
        createdAt: new Date().toISOString()
      },
      {
        id: Date.now() - 1,
        amount: 89.50,
        description: 'Electric Bill',
        category: 'utilities',
        date: '2024-12-12',
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

  // Create - Add new expense
  addExpense(expense) {
    try {
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
    } catch (error) {
      console.error('Error adding expense:', error);
      this.showError('Failed to add expense. Please try again.');
      return null;
    }
  },

  // Read - Get expense by ID
  getExpense(id) {
    return this.expenses.find(expense => expense.id === id);
  },

  // Update - Update existing expense
  updateExpense(id, updatedData) {
    try {
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
    } catch (error) {
      console.error('Error updating expense:', error);
      this.showError('Failed to update expense. Please try again.');
      return false;
    }
  },

  // Delete - Remove expense
  deleteExpense(id) {
    try {
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
    } catch (error) {
      console.error('Error deleting expense:', error);
      this.showError('Failed to delete expense. Please try again.');
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
  // MODAL MANAGEMENT
  // ========================================

  // Open modal
  openModal(type) {
    const modalId = type === 'login' ? 'loginModal' : 'signupModal';
    const modal = document.getElementById(modalId);
    
    if (modal) {
      modal.classList.add('modal--open');
      document.body.classList.add('body--modal-open');
      
      // Focus on first input
      const firstInput = modal.querySelector('input');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  },

  // Close modal
  closeModal(type) {
    const modalId = type === 'login' ? 'loginModal' : 'signupModal';
    const modal = document.getElementById(modalId);
    
    if (modal) {
      modal.classList.remove('modal--open');
      
      // Clear any messages in the modal
      const messageEl = modal.querySelector('.modal__message');
      if (messageEl) {
        messageEl.classList.remove('modal__message--show', 'modal__message--success', 'modal__message--error');
        messageEl.textContent = '';
      }
      
      // Check if any other modal is open
      const loginModal = document.getElementById('loginModal');
      const signupModal = document.getElementById('signupModal');
      const deleteModal = document.getElementById('deleteModal');
      const anyModalOpen = (loginModal && loginModal.classList.contains('modal--open')) ||
                          (signupModal && signupModal.classList.contains('modal--open')) ||
                          (deleteModal && deleteModal.classList.contains('modal--open'));
      
      if (!anyModalOpen) {
        document.body.classList.remove('body--modal-open');
      }
    }
  },

  // ========================================
  // AUTHENTICATION
  // ========================================

  // Check authentication state on load
  checkAuthState() {
    const savedUser = this.getFromStorage(this.STORAGE_KEYS.CURRENT_USER);
    if (savedUser) {
      this.currentUser = savedUser;
      this.updateAuthUI();
    }
  },

  // Show message in modal
  showModalMessage(modalType, message, type) {
    const modalId = modalType === 'login' ? 'loginModal' : 'signupModal';
    const modal = document.getElementById(modalId);
    const messageEl = modal ? modal.querySelector('.modal__message') : null;
    
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `modal__message modal__message--show modal__message--${type}`;
      
      // Auto-hide success messages after 3 seconds
      if (type === 'success') {
        setTimeout(() => {
          messageEl.classList.remove('modal__message--show');
          setTimeout(() => {
            messageEl.textContent = '';
            messageEl.className = 'modal__message';
          }, 300);
        }, 3000);
      }
    }
  },

  // Handle signup
  handleSignup(form) {
    const formData = new FormData(form);
    const name = formData.get('name').trim();
    const email = formData.get('email').trim().toLowerCase();
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const terms = formData.get('terms');

    // Clear previous messages
    this.showModalMessage('signup', '', 'success');

    // Validation
    if (!name || name.length < 2) {
      this.showModalMessage('signup', 'Please enter your full name (at least 2 characters)', 'error');
      return;
    }

    if (!email || !this.validateEmail(email)) {
      this.showModalMessage('signup', 'Please enter a valid email address', 'error');
      return;
    }

    if (!password || password.length < 6) {
      this.showModalMessage('signup', 'Password must be at least 6 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      this.showModalMessage('signup', 'Passwords do not match', 'error');
      return;
    }

    if (!terms) {
      this.showModalMessage('signup', 'Please agree to the Terms of Service and Privacy Policy', 'error');
      return;
    }

    // Check if user already exists
    const users = this.getFromStorage(this.STORAGE_KEYS.USERS) || [];
    const existingUser = users.find(user => user.email === email);
    
    if (existingUser) {
      this.showModalMessage('signup', 'An account with this email already exists. Please login instead.', 'error');
      return;
    }

    // Create new user
    const newUser = {
      id: Date.now(),
      name: name,
      email: email,
      password: password, // In production, this should be hashed
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.setToStorage(this.STORAGE_KEYS.USERS, users);

    // Auto-login after signup
    this.currentUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    };
    this.setToStorage(this.STORAGE_KEYS.CURRENT_USER, this.currentUser);

    this.showModalMessage('signup', `Welcome, ${name}! Your account has been created successfully.`, 'success');
    
    // Close modal and update UI after short delay
    setTimeout(() => {
      this.closeModal('signup');
      this.updateAuthUI();
      form.reset();
    }, 1500);
  },

  // Handle login
  handleLogin(form) {
    const formData = new FormData(form);
    const email = formData.get('email').trim().toLowerCase();
    const password = formData.get('password');
    const remember = formData.get('remember');

    // Clear previous messages
    this.showModalMessage('login', '', 'success');

    // Validation
    if (!email || !this.validateEmail(email)) {
      this.showModalMessage('login', 'Please enter a valid email address', 'error');
      return;
    }

    if (!password) {
      this.showModalMessage('login', 'Please enter your password', 'error');
      return;
    }

    // Check credentials
    const users = this.getFromStorage(this.STORAGE_KEYS.USERS) || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      this.showModalMessage('login', 'Invalid email or password. Please try again.', 'error');
      return;
    }

    // Set current user
    this.currentUser = {
      id: user.id,
      name: user.name,
      email: user.email
    };
    this.setToStorage(this.STORAGE_KEYS.CURRENT_USER, this.currentUser);

    this.showModalMessage('login', `Welcome back, ${user.name}!`, 'success');
    
    // Close modal and update UI after short delay
    setTimeout(() => {
      this.closeModal('login');
      this.updateAuthUI();
      form.reset();
    }, 1500);
  },

  // Handle logout
  handleLogout() {
    this.currentUser = null;
    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
    this.updateAuthUI();
    this.showSuccessMessage('You have been logged out successfully.');
  },

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Update authentication UI
  updateAuthUI() {
    const authSection = document.querySelector('.header__auth');
    if (!authSection) return;

    if (this.currentUser) {
      // Show logged-in state
      authSection.innerHTML = `
        <div class="header__user-info">
          <span class="user__name">${this.currentUser.name}</span>
        </div>
        <button class="btn-auth btn-auth--logout" id="logoutBtn">Logout</button>
      `;

      // Add logout event listener
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.handleLogout());
      }
    } else {
      // Show login/signup buttons
      authSection.innerHTML = `
        <button class="btn-auth btn-auth--login" id="loginBtn">Login</button>
        <button class="btn-auth btn-auth--signup" id="signupBtn">Sign Up</button>
      `;

      // Re-attach event listeners
      const loginBtn = document.getElementById('loginBtn');
      const signupBtn = document.getElementById('signupBtn');
      
      if (loginBtn) {
        loginBtn.addEventListener('click', () => this.openModal('login'));
      }
      if (signupBtn) {
        signupBtn.addEventListener('click', () => this.openModal('signup'));
      }
    }
  }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
