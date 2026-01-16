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

      // Load notification settings
      const notificationSettings = this.getNotificationSettings();
      this.loadNotificationSettings(notificationSettings);
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

    // Load email preferences
    const newsletterCheckbox = document.getElementById('newsletterCheckbox');
    const notificationsCheckbox = document.getElementById('notificationsCheckbox');
    
    if (newsletterCheckbox) {
      newsletterCheckbox.checked = user.newsletter !== false;
    }
    if (notificationsCheckbox) {
      notificationsCheckbox.checked = user.emailNotifications !== false;
    }
  },

  // Load preferences
  loadPreferences(settings) {
    const themeSelect = document.getElementById('theme');
    const currencySelect = document.getElementById('currency');
    const dateFormatSelect = document.getElementById('dateFormat');
    const defaultCategorySelect = document.getElementById('defaultCategory');

    if (themeSelect) themeSelect.value = settings.theme || 'light';
    if (currencySelect) currencySelect.value = settings.currency || 'USD';
    if (dateFormatSelect) dateFormatSelect.value = settings.dateFormat || 'MM/DD/YYYY';
    if (defaultCategorySelect) defaultCategorySelect.value = settings.defaultCategory || '';
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

  // Load notification settings
  loadNotificationSettings(notificationSettings) {
    const emailExpenseAlerts = document.getElementById('emailExpenseAlerts');
    const emailBudgetAlerts = document.getElementById('emailBudgetAlerts');
    const emailWeeklySummary = document.getElementById('emailWeeklySummary');
    const browserNotifications = document.getElementById('browserNotifications');
    const budgetAlertThreshold = document.getElementById('budgetAlertThreshold');

    if (emailExpenseAlerts) emailExpenseAlerts.checked = notificationSettings.emailExpenseAlerts !== false;
    if (emailBudgetAlerts) emailBudgetAlerts.checked = notificationSettings.emailBudgetAlerts !== false;
    if (emailWeeklySummary) emailWeeklySummary.checked = notificationSettings.emailWeeklySummary === true;
    if (browserNotifications) browserNotifications.checked = notificationSettings.browserNotifications === true;
    if (budgetAlertThreshold) budgetAlertThreshold.value = notificationSettings.budgetAlertThreshold || 80;
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

  // Get notification settings
  getNotificationSettings() {
    try {
      const notificationData = localStorage.getItem('expenseTrackerNotificationSettings');
      return notificationData ? JSON.parse(notificationData) : {
        emailExpenseAlerts: true,
        emailBudgetAlerts: true,
        emailWeeklySummary: false,
        browserNotifications: false,
        budgetAlertThreshold: 80
      };
    } catch {
      return {
        emailExpenseAlerts: true,
        emailBudgetAlerts: true,
        emailWeeklySummary: false,
        browserNotifications: false,
        budgetAlertThreshold: 80
      };
    }
  },

  // Save notification settings
  saveNotificationSettings(notificationSettings) {
    try {
      localStorage.setItem('expenseTrackerNotificationSettings', JSON.stringify(notificationSettings));
      return true;
    } catch (error) {
      console.error('Error saving notification settings:', error);
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

    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
      if (percentage >= 100) {
        progressBar.classList.add('budget-visual__progress--over');
      } else {
        progressBar.classList.remove('budget-visual__progress--over');
      }
    }

    if (spentSpan) spentSpan.textContent = `$${monthlySpending.toFixed(2)} spent`;
    if (remainingSpan) remainingSpan.textContent = `$${remaining.toFixed(2)} remaining`;
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

    // Password form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
      passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handlePasswordSubmit(e.target);
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

    // Notifications form
    const notificationsForm = document.getElementById('notificationsForm');
    if (notificationsForm) {
      notificationsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleNotificationsSubmit(e.target);
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
    const exportJSONBtn = document.getElementById('exportJSONBtn');
    const exportCSVBtn = document.getElementById('exportCSVBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');

    if (exportJSONBtn) {
      exportJSONBtn.addEventListener('click', () => this.exportData('json'));
    }
    if (exportCSVBtn) {
      exportCSVBtn.addEventListener('click', () => this.exportData('csv'));
    }
    if (importDataBtn) {
      importDataBtn.addEventListener('click', () => {
        const importInput = document.getElementById('importFileInput');
        if (importInput) importInput.click();
      });
    }

    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
      importFileInput.addEventListener('change', (e) => {
        this.handleImportData(e.target.files[0]);
      });
    }

    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => {
        this.showDeleteConfirmation('Clear All Data', 'Are you sure you want to clear all expense data? This action cannot be undone.', () => {
          App.clearAllData();
          App.showSuccessMessage('All data has been cleared successfully.');
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

    // Request notification permission
    const requestNotificationPermissionBtn = document.getElementById('requestNotificationPermission');
    if (requestNotificationPermissionBtn) {
      requestNotificationPermissionBtn.addEventListener('click', () => {
        this.requestNotificationPermission();
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
    const newsletter = formData.get('newsletter') === 'on';
    const notifications = formData.get('notifications') === 'on';

    if (!displayName || displayName.length < 2) {
      App.showError('Display name must be at least 2 characters long');
      return;
    }

    // Update user
    const currentUser = Auth.getCurrentUser() || App.currentUser;
    if (currentUser) {
      currentUser.name = displayName;
      currentUser.newsletter = newsletter;
      currentUser.emailNotifications = notifications;

      // Save to storage
      const users = App.getFromStorage(App.STORAGE_KEYS.USERS) || [];
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      if (userIndex !== -1) {
        users[userIndex].name = displayName;
        users[userIndex].newsletter = newsletter;
        users[userIndex].emailNotifications = notifications;
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

  // Handle password form submission
  handlePasswordSubmit(form) {
    const formData = new FormData(form);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmNewPassword = formData.get('confirmNewPassword');

    // Validation
    if (!currentPassword) {
      App.showError('Please enter your current password');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      App.showError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      App.showError('New passwords do not match');
      return;
    }

    // Get current user
    const currentUser = Auth.getCurrentUser() || App.currentUser;
    if (!currentUser) {
      App.showError('User not found');
      return;
    }

    // Check current password (frontend only - in production, verify with server)
    const users = App.getFromStorage(App.STORAGE_KEYS.USERS) || [];
    const user = users.find(u => u.id === currentUser.id);
    
    if (!user || user.password !== currentPassword) {
      App.showError('Current password is incorrect');
      return;
    }

    // Update password
    user.password = newPassword;
    App.setToStorage(App.STORAGE_KEYS.USERS, users);

    App.showSuccessMessage('Password changed successfully!');
    form.reset();
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
    } else {
      App.showError('Failed to save budget settings');
    }
  },

  // Handle preferences form submission
  handlePreferencesSubmit(form) {
    const formData = new FormData(form);
    const settings = {
      theme: formData.get('theme'),
      currency: formData.get('currency'),
      dateFormat: formData.get('dateFormat'),
      defaultCategory: formData.get('defaultCategory'),
      language: formData.get('language')
    };

    // Merge with existing settings
    const existingSettings = App.getFromStorage(App.STORAGE_KEYS.SETTINGS) || App.getDefaultSettings();
    const updatedSettings = { ...existingSettings, ...settings };

    if (App.setToStorage(App.STORAGE_KEYS.SETTINGS, updatedSettings)) {
      App.showSuccessMessage('Preferences saved successfully!');
      
      // Apply theme if changed
      if (settings.theme) {
        document.body.setAttribute('data-theme', settings.theme);
      }
    } else {
      App.showError('Failed to save preferences');
    }
  },

  // Handle notifications form submission
  handleNotificationsSubmit(form) {
    const formData = new FormData(form);
    const notificationSettings = {
      emailExpenseAlerts: formData.get('emailExpenseAlerts') === 'on',
      emailBudgetAlerts: formData.get('emailBudgetAlerts') === 'on',
      emailWeeklySummary: formData.get('emailWeeklySummary') === 'on',
      browserNotifications: formData.get('browserNotifications') === 'on',
      budgetAlertThreshold: parseInt(formData.get('budgetAlertThreshold')) || 80
    };

    if (this.saveNotificationSettings(notificationSettings)) {
      App.showSuccessMessage('Notification settings saved successfully!');
    } else {
      App.showError('Failed to save notification settings');
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

  // Export data
  exportData(format) {
    if (format === 'json') {
      if (App.exportData) {
        App.exportData();
      } else {
        this.exportToJSON();
      }
    } else if (format === 'csv') {
      this.exportToCSV();
    }
  },

  // Export to JSON (fallback)
  exportToJSON() {
    const expenses = App.getAllExpenses ? App.getAllExpenses() : (App.expenses || []);
    const exportData = {
      expenses: expenses,
      settings: App.getFromStorage(App.STORAGE_KEYS.SETTINGS) || {},
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
    App.showSuccessMessage('Data exported successfully!');
  },

  // Export to CSV
  exportToCSV() {
    const expenses = App.getAllExpenses ? App.getAllExpenses() : (App.expenses || []);
    if (expenses.length === 0) {
      App.showError('No expenses to export');
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Amount'];
    const rows = expenses.map(expense => [
      expense.date,
      expense.description,
      expense.category,
      expense.amount.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-tracker-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    App.showSuccessMessage('Data exported to CSV successfully!');
  },

  // Handle import data
  handleImportData(file) {
    if (!file) return;

    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      App.importData(file);
    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      this.importFromCSV(file);
    } else {
      App.showError('Please select a JSON or CSV file');
    }
  },

  // Import from CSV
  importFromCSV(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].replace(/"/g, '').split(',');
        const expenses = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
          const cleanValues = values.map(v => v.replace(/^"|"$/g, ''));

          if (cleanValues.length >= 4) {
            expenses.push({
              id: Date.now() + i,
              date: cleanValues[0],
              description: cleanValues[1],
              category: cleanValues[2],
              amount: parseFloat(cleanValues[3]) || 0,
              createdAt: new Date().toISOString()
            });
          }
        }

        if (expenses.length > 0) {
          expenses.forEach(expense => {
            if (App.addExpense) {
              App.addExpense(expense);
            } else {
              // Fallback: add directly to expenses array
              App.expenses.push(expense);
            }
          });
          if (App.saveExpenses) {
            App.saveExpenses();
          }
          if (App.updateExpenseList) {
            App.updateExpenseList();
          }
          App.showSuccessMessage(`Imported ${expenses.length} expenses from CSV!`);
        } else {
          App.showError('No valid expenses found in CSV file');
        }
      } catch (error) {
        console.error('Error importing CSV:', error);
        App.showError('Failed to import CSV file');
      }
    };
    reader.readAsText(file);
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
  },

  // Request notification permission
  requestNotificationPermission() {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          App.showSuccessMessage('Browser notifications enabled!');
          const browserNotifications = document.getElementById('browserNotifications');
          if (browserNotifications) browserNotifications.checked = true;
        } else {
          App.showError('Browser notifications permission denied');
        }
      });
    } else {
      App.showError('Browser notifications are not supported in this browser');
    }
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

