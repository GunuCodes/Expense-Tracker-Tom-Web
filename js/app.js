/**
 * Main Application JavaScript
 * Personal Expense Tracker
 */

// Application state
const App = {
  // Initialize the application
  init() {
    console.log('Expense Tracker App initialized');
    this.setupEventListeners();
    this.loadData();
  },

  // Setup event listeners
  setupEventListeners() {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.header__menu-toggle');
    const nav = document.querySelector('.header__nav');
    
    if (menuToggle && nav) {
      menuToggle.addEventListener('click', () => {
        nav.classList.toggle('nav--open');
        menuToggle.classList.toggle('menu-toggle--active');
      });
    }

    // Navigation links
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleNavigation(link.getAttribute('href'));
      });
    });

    // Add expense button
    const addExpenseBtn = document.querySelector('.btn--primary');
    if (addExpenseBtn) {
      addExpenseBtn.addEventListener('click', () => {
        this.showAddExpenseModal();
      });
    }

    // Filter controls
    const categoryFilter = document.getElementById('categoryFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
        this.filterExpenses();
      });
    }
    
    if (dateFilter) {
      dateFilter.addEventListener('change', () => {
        this.filterExpenses();
      });
    }
  },

  // Handle navigation
  handleNavigation(target) {
    const targetElement = document.querySelector(target);
    if (targetElement) {
      targetElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  },

  // Show add expense modal (placeholder)
  showAddExpenseModal() {
    alert('Add Expense functionality will be implemented here');
  },

  // Filter expenses
  filterExpenses() {
    console.log('Filtering expenses...');
    // Filter logic will be implemented here
  },

  // Load data from localStorage or API
  loadData() {
    console.log('Loading data...');
    // Data loading logic will be implemented here
  }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
