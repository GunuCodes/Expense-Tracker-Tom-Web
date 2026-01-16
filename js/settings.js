/**
 * Settings JavaScript
 * Handles all settings page functionality
 */

const Settings = {
  // Initialize settings page
  init() {
    console.log('Settings page initialized');
    
    // Setup event listeners immediately
    this.setupEventListeners();
    
    // Wait for App to load data
    if (App.expenses && App.expenses.length > 0) {
      this.loadUserSettings();
      this.updateBudgetVisual();
    } else {
      // Wait a bit for data to load
      setTimeout(() => {
        this.loadUserSettings();
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
    const profilePicturePreview = document.getElementById('profilePicturePreview');
    
    if (displayNameInput) {
      displayNameInput.value = user.name || '';
    }
    
    // Load profile picture if saved
    if (profilePicturePreview && user.profilePicture) {
      profilePicturePreview.src = user.profilePicture;
    } else if (profilePicturePreview) {
      profilePicturePreview.src = 'assets/images/avatars/default-avatar.svg';
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
    document.body.setAttribute('data-theme', theme || 'light');
  },

  // Load budget settings
  loadBudgetSettings(budgetSettings) {
    const monthlyBudgetInput = document.getElementById('monthlyBudget');

    if (monthlyBudgetInput) {
      monthlyBudgetInput.value = budgetSettings.monthlyBudget || 3000;
    }

    this.updateBudgetVisual();
  },

  // Get budget settings
  getBudgetSettings() {
    try {
      const budgetData = localStorage.getItem('expenseTrackerBudgetSettings');
      return budgetData ? JSON.parse(budgetData) : {
        monthlyBudget: 3000
      };
    } catch {
      return {
        monthlyBudget: 3000
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
    // Use event delegation for form submissions to ensure they work
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (!form || !form.classList.contains('settings-form')) return;
      
      e.preventDefault();
      
      if (form.id === 'profileForm') {
        this.handleProfileSubmit(form);
      } else if (form.id === 'budgetForm') {
        this.handleBudgetSubmit(form);
      } else if (form.id === 'preferencesForm') {
        this.handlePreferencesSubmit(form);
      }
    });

    // Profile form (backup direct listener)
    const profileForm = document.getElementById('profileForm');
    if (profileForm && !profileForm.hasAttribute('data-listener-attached')) {
      profileForm.setAttribute('data-listener-attached', 'true');
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleProfileSubmit(e.target);
      });
    }

    // Budget form (backup direct listener)
    const budgetForm = document.getElementById('budgetForm');
    if (budgetForm && !budgetForm.hasAttribute('data-listener-attached')) {
      budgetForm.setAttribute('data-listener-attached', 'true');
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

    // Preferences form (backup direct listener)
    const preferencesForm = document.getElementById('preferencesForm');
    if (preferencesForm && !preferencesForm.hasAttribute('data-listener-attached')) {
      preferencesForm.setAttribute('data-listener-attached', 'true');
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
      
      // Get profile picture if it was uploaded
      const profilePicturePreview = document.getElementById('profilePicturePreview');
      if (profilePicturePreview && profilePicturePreview.src && 
          !profilePicturePreview.src.includes('default-avatar.svg')) {
        currentUser.profilePicture = profilePicturePreview.src;
      }

      // Save to storage
      const users = App.getFromStorage(App.STORAGE_KEYS.USERS) || [];
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      if (userIndex !== -1) {
        users[userIndex].name = displayName;
        if (currentUser.profilePicture) {
          users[userIndex].profilePicture = currentUser.profilePicture;
        }
        App.setToStorage(App.STORAGE_KEYS.USERS, users);
      }

      // Update current user
      App.setToStorage(App.STORAGE_KEYS.CURRENT_USER, currentUser);
      if (Auth.login) {
        Auth.login(currentUser);
      }
      
      // Update navigation to show new profile picture
      this.updateNavigationProfilePicture(currentUser.profilePicture);

      App.showSuccessMessage('Profile updated successfully!');
    }
  },

  // Handle budget form submission
  handleBudgetSubmit(form) {
    const formData = new FormData(form);
    const monthlyBudget = parseFloat(formData.get('monthlyBudget')) || 0;

    if (monthlyBudget < 0) {
      App.showError('Monthly budget must be a positive number');
      return;
    }

    const budgetSettings = {
      monthlyBudget
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
        
        // Update charts if on reports page
        if (typeof Charts !== 'undefined' && Charts.updateCharts) {
          const expenses = App.getAllExpenses ? App.getAllExpenses() : (App.expenses || []);
          Charts.updateCharts(expenses);
        }
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
      // Profile picture will be saved when form is submitted
    };
    reader.readAsDataURL(file);
  },
  
  // Update navigation profile picture
  updateNavigationProfilePicture(profilePictureUrl) {
    if (!profilePictureUrl) return;
    
    // Update avatar in navigation
    const navAvatars = document.querySelectorAll('.avatar');
    navAvatars.forEach(avatar => {
      if (avatar.src && avatar.src.includes('default-avatar.svg')) {
        avatar.src = profilePictureUrl;
      }
    });
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
