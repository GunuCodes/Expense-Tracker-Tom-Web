/**
 * Settings JavaScript
 * Handles all settings page functionality
 */

const Settings = {
  // Initialize settings page
  init() {
    console.log('Settings page initialized');
    
    // Wait for App to load data
    if (App.expenses && App.expenses.length > 0) {
      this.loadUserSettings();
      this.setupEventListeners();
      this.initializeCategoryBudgets();
      this.updateBudgetVisual();
    } else {
      // Wait a bit for data to load
      setTimeout(() => {
        this.loadUserSettings();
        this.setupEventListeners();
        this.initializeCategoryBudgets();
        this.updateBudgetVisual();
      }, 300);
    }
  },

  // Load user settings from storage
  loadUserSettings() {
    try {
      // Get current user
      const currentUser = Auth.getCurrentUser() || App.currentUser;
      if (currentUser) {
        // Load profile settings
        this.loadProfileSettings(currentUser);
      }

      // Load preferences
      const settings = App.getFromStorage(App.STORAGE_KEYS.SETTINGS) || App.getDefaultSettings();
      this.loadPreferences(settings);

      // Load budget settings
      const budgetSettings = this.getBudgetSettings();
      this.loadBudgetSettings(budgetSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  },

  // Load profile settings
  loadProfileSettings(user) {
    const displayNameInput = document.getElementById('displayName');
    if (displayNameInput) {
      displayNameInput.value = user.name || '';
    }
  },

  // Load preferences
  loadPreferences(settings) {
    const themeSelect = document.getElementById('theme');
    const currencySelect = document.getElementById('currency');

    if (themeSelect) themeSelect.value = settings.theme || 'light';
    if (currencySelect) currencySelect.value = settings.currency || 'USD';
    
    // Apply theme immediately
    this.applyTheme(settings.theme || 'light');
  },

  // Apply theme
  applyTheme(theme) {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.body.setAttribute('data-theme', theme);
    }
  },

  // Load budget settings
  loadBudgetSettings(budgetSettings) {
    const monthlyBudgetInput = document.getElementById('monthlyBudget');
    const budgetPeriodSelect = document.getElementById('budgetPeriod');

    if (monthlyBudgetInput) {
      monthlyBudgetInput.value = budgetSettings.monthlyBudget || 3000;
    }
    if (budgetPeriodSelect) {
      budgetPeriodSelect.value = budgetSettings.period || 'monthly';
    }

    this.updateBudgetVisual();
  },

  // Get budget settings
  getBudgetSettings() {
    try {
      const budgetData = localStorage.getItem('expenseTrackerBudgetSettings');
      return budgetData ? JSON.parse(budgetData) : {
        monthlyBudget: 3000,
        period: 'monthly',
        categoryBudgets: {}
      };
    } catch {
      return {
        monthlyBudget: 3000,
        period: 'monthly',
        categoryBudgets: {}
      };
    }
  },

  // Save budget settings
  saveBudgetSettings(budgetSettings) {
    try {
      localStorage.setItem('expenseTrackerBudgetSettings', JSON.stringify(budgetSettings));
      return true;
    } catch (error) {
      console.error('Error saving budget settings:', error);
      return false;
    }
  },

  // Initialize category budgets
  initializeCategoryBudgets() {
    const categoryBudgetsContainer = document.getElementById('categoryBudgets');
    if (!categoryBudgetsContainer) return;

    const categories = App.defaultCategories || [
      { id: 'food', name: 'Food & Dining', icon: '🍔' },
      { id: 'transport', name: 'Transportation', icon: '🚗' },
      { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
      { id: 'utilities', name: 'Utilities', icon: '⚡' },
      { id: 'shopping', name: 'Shopping', icon: '🛍️' },
      { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
      { id: 'education', name: 'Education', icon: '📚' },
      { id: 'other', name: 'Other', icon: '📋' }
    ];

    const budgetSettings = this.getBudgetSettings();
    const categoryBudgets = budgetSettings.categoryBudgets || {};

    categoryBudgetsContainer.innerHTML = categories.map(category => {
      const budget = categoryBudgets[category.id] || 0;
      const spent = this.getCategorySpending(category.id);
      const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
      const isOverBudget = spent > budget && budget > 0;

      return `
        <div class="category-budget-item ${isOverBudget ? 'category-budget-item--over' : ''}" data-category="${category.id}">
          <div class="category-budget-item__header">
            <div class="category-budget-item__info">
              <span class="category-budget-item__icon">${category.icon}</span>
              <span class="category-budget-item__name">${category.name}</span>
            </div>
            <div class="category-budget-item__amount">
              <span class="category-budget-item__spent">$${spent.toFixed(2)}</span>
              <span class="category-budget-item__separator">/</span>
              <input 
                type="number" 
                class="category-budget-item__input" 
                value="${budget}"
                placeholder="0.00"
                step="0.01"
                min="0"
                data-category="${category.id}"
              >
            </div>
          </div>
          ${budget > 0 ? `
            <div class="category-budget-item__progress">
              <div class="category-budget-item__progress-bar" style="width: ${percentage}%"></div>
            </div>
            <div class="category-budget-item__status">
              <span class="category-budget-item__percentage">${percentage.toFixed(0)}%</span>
              ${isOverBudget ? '<span class="category-budget-item__warning">Over Budget!</span>' : ''}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Add event listeners to category budget inputs
    categoryBudgetsContainer.querySelectorAll('.category-budget-item__input').forEach(input => {
      input.addEventListener('input', () => {
        this.updateCategoryBudgetVisual(input);
      });
    });
  },

  // Get category spending
  getCategorySpending(categoryId) {
    const expenses = App.getAllExpenses ? App.getAllExpenses() : (App.expenses || []);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expense.category === categoryId &&
               expenseDate.getMonth() === currentMonth &&
               expenseDate.getFullYear() === currentYear;
      })
      .reduce((total, expense) => total + expense.amount, 0);
  },

  // Update category budget visual
  updateCategoryBudgetVisual(input) {
    const categoryId = input.getAttribute('data-category');
    const budget = parseFloat(input.value) || 0;
    const spent = this.getCategorySpending(categoryId);
    const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const isOverBudget = spent > budget && budget > 0;

    const categoryItem = input.closest('.category-budget-item');
    if (!categoryItem) return;

    // Update progress bar
    const progressBar = categoryItem.querySelector('.category-budget-item__progress-bar');
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }

    // Update percentage and warning
    const percentageSpan = categoryItem.querySelector('.category-budget-item__percentage');
    const warningSpan = categoryItem.querySelector('.category-budget-item__warning');
    
    if (budget > 0) {
      if (percentageSpan) percentageSpan.textContent = `${percentage.toFixed(0)}%`;
      
      if (isOverBudget) {
        categoryItem.classList.add('category-budget-item--over');
        if (!warningSpan) {
          const statusDiv = categoryItem.querySelector('.category-budget-item__status');
          if (statusDiv) {
            statusDiv.innerHTML = `<span class="category-budget-item__percentage">${percentage.toFixed(0)}%</span><span class="category-budget-item__warning">Over Budget!</span>`;
          }
        }
      } else {
        categoryItem.classList.remove('category-budget-item--over');
        if (warningSpan) warningSpan.remove();
      }
    }
  },

  // Update budget visual
  updateBudgetVisual() {
    const monthlyBudgetInput = document.getElementById('monthlyBudget');
    if (!monthlyBudgetInput) return;

    const budget = parseFloat(monthlyBudgetInput.value) || 0;
    const expenses = App.getAllExpenses ? App.getAllExpenses() : (App.expenses || []);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlySpending = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth &&
               expenseDate.getFullYear() === currentYear;
      })
      .reduce((total, expense) => total + expense.amount, 0);

    const percentage = budget > 0 ? Math.min((monthlySpending / budget) * 100, 100) : 0;
    const remaining = Math.max(budget - monthlySpending, 0);

    const progressBar = document.getElementById('budgetProgress');
    const spentSpan = document.querySelector('.budget-visual__spent');
    const remainingSpan = document.querySelector('.budget-visual__remaining');
    const currencySymbol = this.getCurrencySymbol();

    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
      if (percentage >= 100) {
        progressBar.classList.add('budget-visual__progress--over');
      } else {
        progressBar.classList.remove('budget-visual__progress--over');
      }
    }

    if (spentSpan) spentSpan.textContent = `${currencySymbol}${monthlySpending.toFixed(2)} spent`;
    if (remainingSpan) remainingSpan.textContent = `${currencySymbol}${remaining.toFixed(2)} remaining`;
  },

  // Get currency symbol
  getCurrencySymbol() {
    const settings = App.getFromStorage(App.STORAGE_KEYS.SETTINGS) || {};
    const currency = settings.currency || 'USD';
    
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$'
    };
    
    return symbols[currency] || '$';
  },

  // Setup event listeners
  setupEventListeners() {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleProfileSubmit(e.target);
      });
    }

    // Budget form
    const budgetForm = document.getElementById('budgetForm');
    if (budgetForm) {
      budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleBudgetSubmit(e.target);
      });

      const monthlyBudgetInput = document.getElementById('monthlyBudget');
      if (monthlyBudgetInput) {
        monthlyBudgetInput.addEventListener('input', () => {
          this.updateBudgetVisual();
        });
      }
    }

    // Preferences form
    const preferencesForm = document.getElementById('preferencesForm');
    if (preferencesForm) {
      preferencesForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handlePreferencesSubmit(e.target);
      });
    }

    // Profile picture upload
    const changeProfilePictureBtn = document.getElementById('changeProfilePictureBtn');
    const profilePictureInput = document.getElementById('profilePictureInput');
    if (changeProfilePictureBtn && profilePictureInput) {
      changeProfilePictureBtn.addEventListener('click', () => {
        profilePictureInput.click();
      });
      profilePictureInput.addEventListener('change', (e) => {
        this.handleProfilePictureChange(e.target.files[0]);
      });
    }

    // Data management buttons
    const clearDataBtn = document.getElementById('clearDataBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');

    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => {
        this.showDeleteConfirmation('Clear All Data', 'Are you sure you want to clear all expense data? This action cannot be undone.', () => {
          App.clearAllData();
          App.showSuccessMessage('All data has been cleared successfully.');
          // Reload page to refresh dashboard
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        });
      });
    }

    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', () => {
        this.showDeleteConfirmation('Delete Account', 'Are you sure you want to delete your account? All your data will be permanently deleted. This action cannot be undone.', () => {
          this.handleDeleteAccount();
        });
      });
    }

    // Cancel buttons
    const cancelButtons = document.querySelectorAll('[id$="Btn"][id^="cancel"]');
    cancelButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.loadUserSettings(); // Reload to reset form
      });
    });
  },

  // Handle profile form submission
  handleProfileSubmit(form) {
    const formData = new FormData(form);
    const displayName = formData.get('displayName').trim();

    if (!displayName || displayName.length < 2) {
      App.showError('Display name must be at least 2 characters long');
      return;
    }

    // Update user
    const currentUser = Auth.getCurrentUser() || App.currentUser;
    if (currentUser) {
      currentUser.name = displayName;

      // Save to storage
      const users = App.getFromStorage(App.STORAGE_KEYS.USERS) || [];
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      if (userIndex !== -1) {
        users[userIndex].name = displayName;
        App.setToStorage(App.STORAGE_KEYS.USERS, users);
      }

      // Update current user
      App.setToStorage(App.STORAGE_KEYS.CURRENT_USER, currentUser);
      if (Auth.login) {
        Auth.login(currentUser);
      }

      App.showSuccessMessage('Profile updated successfully!');
    }
  },

  // Handle budget form submission
  handleBudgetSubmit(form) {
    const formData = new FormData(form);
    const monthlyBudget = parseFloat(formData.get('monthlyBudget')) || 0;
    const budgetPeriod = formData.get('budgetPeriod');

    // Get category budgets
    const categoryBudgetInputs = document.querySelectorAll('.category-budget-item__input');
    const categoryBudgets = {};
    categoryBudgetInputs.forEach(input => {
      const categoryId = input.getAttribute('data-category');
      const budget = parseFloat(input.value) || 0;
      if (budget > 0) {
        categoryBudgets[categoryId] = budget;
      }
    });

    const budgetSettings = {
      monthlyBudget,
      period: budgetPeriod,
      categoryBudgets
    };

    if (this.saveBudgetSettings(budgetSettings)) {
      App.showSuccessMessage('Budget settings saved successfully!');
      this.updateBudgetVisual();
      
      // Update dashboard if on dashboard page
      if (typeof Dashboard !== 'undefined' && Dashboard.updateBudgetProgress) {
        Dashboard.updateBudgetProgress();
        Dashboard.updateMetrics();
      }
    } else {
      App.showError('Failed to save budget settings');
    }
  },

  // Handle preferences form submission
  handlePreferencesSubmit(form) {
    const formData = new FormData(form);
    const settings = {
      theme: formData.get('theme'),
      currency: formData.get('currency')
    };

    // Merge with existing settings
    const existingSettings = App.getFromStorage(App.STORAGE_KEYS.SETTINGS) || App.getDefaultSettings();
    const updatedSettings = { ...existingSettings, ...settings };

    if (App.setToStorage(App.STORAGE_KEYS.SETTINGS, updatedSettings)) {
      App.showSuccessMessage('Preferences saved successfully!');
      
      // Apply theme if changed
      if (settings.theme) {
        this.applyTheme(settings.theme);
      }
      
      // Update currency symbol across pages
      this.updateCurrencySymbol();
      
      // Reload dashboard if on dashboard page
      if (typeof Dashboard !== 'undefined' && Dashboard.updateCurrencySymbol) {
        Dashboard.updateCurrencySymbol();
        Dashboard.updateMetrics();
        Dashboard.updateBudgetProgress();
      }
    } else {
      App.showError('Failed to save preferences');
    }
  },

  // Update currency symbol
  updateCurrencySymbol() {
    const currencySymbol = this.getCurrencySymbol();
    const budgetCurrencySymbol = document.getElementById('budgetCurrencySymbol');
    if (budgetCurrencySymbol) {
      budgetCurrencySymbol.textContent = currencySymbol;
    }
  },

  // Handle profile picture change
  handleProfilePictureChange(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      App.showError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      App.showError('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('profilePicturePreview');
      if (preview) {
        preview.src = e.target.result;
      }
      App.showSuccessMessage('Profile picture updated! (Note: This is a preview only)');
    };
    reader.readAsDataURL(file);
  },

  // Show delete confirmation modal
  showDeleteConfirmation(title, message, onConfirm) {
    const modal = document.getElementById('deleteConfirmModal');
    const modalTitle = document.getElementById('deleteModalTitle');
    const modalSubtitle = document.getElementById('deleteModalSubtitle');
    const modalBody = document.getElementById('deleteModalBody');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');

    if (!modal) return;

    if (modalTitle) modalTitle.textContent = title;
    if (modalSubtitle) modalSubtitle.textContent = message;
    if (modalBody) modalBody.innerHTML = `<p>${message}</p>`;

    modal.classList.add('modal--open');
    document.body.classList.add('body--modal-open');

    // Remove existing listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // Add new listeners
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
      modal.classList.remove('modal--open');
      document.body.classList.remove('body--modal-open');
      if (onConfirm) onConfirm();
    });

    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
      modal.classList.remove('modal--open');
      document.body.classList.remove('body--modal-open');
    });
  },

  // Handle delete account
  handleDeleteAccount() {
    // Clear all data
    App.clearAllData();
    
    // Clear user data
    const currentUser = Auth.getCurrentUser() || App.currentUser;
    if (currentUser) {
      const users = App.getFromStorage(App.STORAGE_KEYS.USERS) || [];
      const updatedUsers = users.filter(u => u.id !== currentUser.id);
      App.setToStorage(App.STORAGE_KEYS.USERS, updatedUsers);
    }

    // Logout
    if (Auth.logout) {
      Auth.logout();
    }

    App.showSuccessMessage('Account deleted successfully. Redirecting...');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  }
};

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait for App to initialize first
  if (typeof App !== 'undefined' && App.init) {
    // App.init() is called separately, so wait a bit for data to load
    setTimeout(() => {
      Settings.init();
    }, 200);
  } else {
    Settings.init();
  }
});
