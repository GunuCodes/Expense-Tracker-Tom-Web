/**
 * Main Application JavaScript
 * Personal Expense Tracker
 */

// Application state
const App = {
  currentView: 'expenses',
  expenses: [],
  
  // Initialize the application
  init() {
    console.log('Expense Tracker App initialized');
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
      <div class="expense-item">
        <div class="expense-item__icon">${categoryIcons[expense.category] || '📋'}</div>
        <div class="expense-item__content">
          <h4 class="expense-item__title">${expense.description}</h4>
          <p class="expense-item__category">${categoryNames[expense.category] || 'Other'}</p>
        </div>
        <div class="expense-item__amount">$${expense.amount.toFixed(2)}</div>
        <div class="expense-item__date">${formattedDate}</div>
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
    SETTINGS: 'expenseTrackerSettings'
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
  }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
