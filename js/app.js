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
    this.setupEventListeners();
    this.loadData();
    this.initializeCharts();
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
    // Remove active class from all nav links
    document.querySelectorAll('.nav__link').forEach(link => {
      link.classList.remove('nav__link--active');
    });

    // Add active class to clicked link
    const activeLink = document.querySelector(`[href="${target}"]`);
    if (activeLink) {
      activeLink.classList.add('nav__link--active');
    }

    // Show/hide sections based on navigation
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
      section.style.display = 'none';
    });

    const targetSection = document.querySelector(target);
    if (targetSection) {
      targetSection.style.display = 'block';
      this.currentView = target.replace('#', '');
      
      // Update charts if navigating to reports
      if (this.currentView === 'reports') {
        this.updateCharts();
      }
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

  // Load data from localStorage
  loadData() {
    const savedExpenses = localStorage.getItem('expenseTrackerExpenses');
    if (savedExpenses) {
      this.expenses = JSON.parse(savedExpenses);
    } else {
      // Demo data
      this.expenses = [
        {
          id: 1,
          amount: 12.50,
          description: 'Lunch at Cafe',
          category: 'food',
          date: '2024-12-15'
        },
        {
          id: 2,
          amount: 45.00,
          description: 'Gas Station',
          category: 'transport',
          date: '2024-12-14'
        },
        {
          id: 3,
          amount: 24.00,
          description: 'Movie Tickets',
          category: 'entertainment',
          date: '2024-12-13'
        },
        {
          id: 4,
          amount: 89.50,
          description: 'Electric Bill',
          category: 'utilities',
          date: '2024-12-12'
        }
      ];
    }
    
    this.updateExpenseList();
  },

  // Save data to localStorage
  saveData() {
    localStorage.setItem('expenseTrackerExpenses', JSON.stringify(this.expenses));
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
