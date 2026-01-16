/**
 * Settings JavaScript
 * Handles all settings page functionality
 */

const Settings = {
  // Initialize settings page
  async init() {
    console.log('Settings page initialized');
    
    // Setup event listeners immediately
    this.setupEventListeners();
    
    // Load settings from API
    await this.loadUserSettings();
    
    // Wait for App to load data for budget visual
    if (App.expenses && App.expenses.length > 0) {
      this.updateBudgetVisual();
    } else {
      // Wait a bit for data to load
      setTimeout(() => {
        this.updateBudgetVisual();
      }, 300);
    }
  },

  // Load user settings from API
  async loadUserSettings() {
    try {
      // Get current user from API
      if (typeof API !== 'undefined' && API.getCurrentUser) {
        try {
          const response = await API.getCurrentUser();
          if (response && response.user) {
            this.loadProfileSettings(response.user);
          }
        } catch (error) {
          console.error('Error loading user from API:', error);
          // Fallback to local storage
          const currentUser = Auth.getCurrentUser() || App.currentUser;
          if (currentUser) {
            this.loadProfileSettings(currentUser);
          }
        }
      } else {
        // Fallback to local storage
      const currentUser = Auth.getCurrentUser() || App.currentUser;
      if (currentUser) {
        this.loadProfileSettings(currentUser);
      }
      }

      // Load preferences from API
      if (typeof API !== 'undefined' && API.getSettings) {
        try {
          const settingsData = await API.getSettings();
          const settings = {
            theme: settingsData.theme || 'light',
            currency: settingsData.currency || 'USD',
            dateFormat: settingsData.dateFormat || 'MM/DD/YYYY',
            notifications: settingsData.notifications !== undefined ? settingsData.notifications : true
          };
          this.loadPreferences(settings);
        } catch (error) {
          console.error('Error loading settings from API:', error);
          // Fallback to localStorage
          const settings = App.getFromStorage(App.STORAGE_KEYS.SETTINGS) || App.getDefaultSettings();
          this.loadPreferences(settings);
        }
      } else {
        // Fallback to localStorage
      const settings = App.getFromStorage(App.STORAGE_KEYS.SETTINGS) || App.getDefaultSettings();
      this.loadPreferences(settings);
      }

      // Load budget settings from API
      if (typeof API !== 'undefined' && API.getBudget) {
        try {
          const budgetData = await API.getBudget();
          const budgetSettings = {
            monthlyBudget: budgetData.monthlyBudget || 3000
          };
          this.loadBudgetSettings(budgetSettings);
        } catch (error) {
          console.error('Error loading budget from API:', error);
          // Fallback to localStorage
          const budgetSettings = this.getBudgetSettings();
          this.loadBudgetSettings(budgetSettings);
        }
      } else {
        // Fallback to localStorage
      const budgetSettings = this.getBudgetSettings();
      this.loadBudgetSettings(budgetSettings);
      }
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
    if (profilePicturePreview) {
      if (user.profilePicture) {
        profilePicturePreview.src = user.profilePicture;
        profilePicturePreview.setAttribute('data-profile-picture', user.profilePicture);
      } else {
        profilePicturePreview.src = 'assets/images/avatars/default-avatar.svg';
        profilePicturePreview.removeAttribute('data-profile-picture');
      }
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

  // Get budget settings (fallback to localStorage)
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

  // Save budget settings (fallback to localStorage)
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
    // Profile form - single listener only
    const profileForm = document.getElementById('profileForm');
    if (profileForm && !profileForm.hasAttribute('data-listener-attached')) {
      profileForm.setAttribute('data-listener-attached', 'true');
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleProfileSubmit(e.target);
      });
    }

    // Budget form - single listener only, input only updates visual
    const budgetForm = document.getElementById('budgetForm');
    if (budgetForm && !budgetForm.hasAttribute('data-listener-attached')) {
      budgetForm.setAttribute('data-listener-attached', 'true');
      budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleBudgetSubmit(e.target);
      });

      // Input event only updates visual, does NOT save
      const monthlyBudgetInput = document.getElementById('monthlyBudget');
      if (monthlyBudgetInput && !monthlyBudgetInput.hasAttribute('data-listener-attached')) {
        monthlyBudgetInput.setAttribute('data-listener-attached', 'true');
        monthlyBudgetInput.addEventListener('input', () => {
          this.updateBudgetVisual(); // Only visual update, no save
        });
      }
    }

    // Preferences form - single listener only
    const preferencesForm = document.getElementById('preferencesForm');
    if (preferencesForm && !preferencesForm.hasAttribute('data-listener-attached')) {
      preferencesForm.setAttribute('data-listener-attached', 'true');
      preferencesForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
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

  // Handle profile form submission (using API)
  async handleProfileSubmit(form) {
    const formData = new FormData(form);
    const displayName = formData.get('displayName').trim();

    if (!displayName || displayName.length < 2) {
      App.showError('Display name must be at least 2 characters long');
      return;
    }

    // Get profile picture if it was uploaded
    const profilePicturePreview = document.getElementById('profilePicturePreview');
    let profilePicture = null;
    
    if (profilePicturePreview) {
      // Get from data attribute first, then fall back to src
      const pictureSrc = profilePicturePreview.getAttribute('data-profile-picture') || profilePicturePreview.src;
      
      // Only save if it's not the default avatar and is a valid image data URL
      if (pictureSrc && 
          !pictureSrc.includes('default-avatar.svg') && 
          (pictureSrc.startsWith('data:image/') || pictureSrc.startsWith('blob:'))) {
        profilePicture = pictureSrc;
      } else if (pictureSrc && pictureSrc.includes('default-avatar.svg')) {
        // If user wants to reset to default, clear the profile picture
        profilePicture = null;
      }
    }

    // Update profile using API
    try {
      if (typeof API !== 'undefined' && API.updateProfile) {
        const profileData = {
          name: displayName
        };
        if (profilePicture !== undefined) {
          profileData.profilePicture = profilePicture;
        }
        
        const updatedUser = await API.updateProfile(profileData);
        
        // Update local user data
        if (typeof Auth !== 'undefined' && Auth.login) {
          Auth.login(updatedUser);
        }
        if (typeof App !== 'undefined') {
          App.currentUser = updatedUser;
        }
        
        // Update navigation to show new profile picture
        this.updateNavigationProfilePicture(updatedUser.profilePicture);
        
        // Reload navigation UI to show updated profile picture
        if (typeof Navigation !== 'undefined' && Navigation.updateAuthUI) {
          Navigation.updateAuthUI(true);
        }
        if (typeof Auth !== 'undefined' && Auth.updateNavigationVisibility) {
          Auth.updateNavigationVisibility(Auth.getCurrentPage(), true);
        }

        App.showSuccessMessage('Profile updated successfully!');
      } else {
        // Fallback to localStorage
    const currentUser = Auth.getCurrentUser() || App.currentUser;
    if (currentUser) {
      currentUser.name = displayName;
          if (profilePicture !== undefined) {
            currentUser.profilePicture = profilePicture;
      }

      App.setToStorage(App.STORAGE_KEYS.CURRENT_USER, currentUser);
      if (Auth.login) {
        Auth.login(currentUser);
      }

          this.updateNavigationProfilePicture(currentUser.profilePicture);
      App.showSuccessMessage('Profile updated successfully!');
        } else {
          App.showError('You must be logged in to update your profile');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      App.showError(error.message || 'Failed to update profile. Please try again.');
    }
  },

  // Handle budget form submission (using API)
  async handleBudgetSubmit(form) {
    const formData = new FormData(form);
    const monthlyBudget = parseFloat(formData.get('monthlyBudget')) || 0;

    if (monthlyBudget < 0) {
      App.showError('Monthly budget must be a positive number');
      return;
    }

    try {
      if (typeof API !== 'undefined' && API.updateBudget) {
        await API.updateBudget({ monthlyBudget });
        App.showSuccessMessage('Budget settings saved successfully!');
        this.updateBudgetVisual();
        
        // Update dashboard if on dashboard page
        if (typeof Dashboard !== 'undefined' && Dashboard.updateBudgetProgress) {
          Dashboard.updateBudgetProgress();
          Dashboard.updateMetrics();
      }
      } else {
        // Fallback to localStorage
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
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      App.showError(error.message || 'Failed to save budget settings');
    }
  },

  // Handle preferences form submission (using API)
  async handlePreferencesSubmit(form) {
    const formData = new FormData(form);
    const settings = {
      theme: formData.get('theme'),
      currency: formData.get('currency')
    };

    try {
      if (typeof API !== 'undefined' && API.updateSettings) {
        await API.updateSettings(settings);
        App.showSuccessMessage('Preferences saved successfully!');
        
        // Apply theme if changed
        if (settings.theme) {
          this.applyTheme(settings.theme);
          
          // Also update App settings for persistence
          if (typeof App !== 'undefined' && App.applySettings) {
            App.applySettings();
          }
          
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
        // Fallback to localStorage
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
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      App.showError(error.message || 'Failed to save preferences');
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
        // Store the data URL directly - this will be saved when form is submitted
        preview.src = e.target.result;
        // Store in a data attribute for easy retrieval
        preview.setAttribute('data-profile-picture', e.target.result);
      }
    };
    reader.onerror = () => {
      App.showError('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  },
  
  // Update navigation profile picture
  updateNavigationProfilePicture(profilePictureUrl) {
    // Update avatar in navigation - update all avatars
    const navAvatars = document.querySelectorAll('.avatar');
    navAvatars.forEach(avatar => {
      if (profilePictureUrl) {
        avatar.src = profilePictureUrl;
      } else {
        avatar.src = 'assets/images/avatars/default-avatar.svg';
      }
    });
    
    // Also update via Navigation and Auth if available
    const currentUser = Auth.getCurrentUser() || App.currentUser;
    if (currentUser && typeof Navigation !== 'undefined' && Navigation.updateAuthUI) {
      Navigation.updateAuthUI(true);
    }
    if (currentUser && typeof Auth !== 'undefined' && Auth.updateNavigationVisibility) {
      const currentPage = Auth.getCurrentPage ? Auth.getCurrentPage() : 'settings';
      Auth.updateNavigationVisibility(currentPage, true);
    }
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
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for App to initialize first
  if (typeof App !== 'undefined' && App.init) {
    // App.init() is called separately, so wait a bit for data to load
    setTimeout(async () => {
      await Settings.init();
    }, 200);
  } else {
    await Settings.init();
  }
});
