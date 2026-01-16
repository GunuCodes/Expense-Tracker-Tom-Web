/**
 * Dashboard JavaScript
 * Handles all dashboard page functionality
 */

const Dashboard = {
  // Initialize dashboard
  init() {
    console.log('Dashboard initialized');
    
    // Wait for App data to load
    if (App.expenses && App.expenses.length > 0) {
      this.initializeDashboard();
    } else {
      setTimeout(() => {
        this.initializeDashboard();
      }, 300);
    }
  },

  // Initialize all dashboard features
  initializeDashboard() {
    this.setupEventListeners();
    this.updateMetrics();
    this.updateCategoryBreakdown();
    this.updateRecentTransactions();
    this.updateBudgetProgress();
    this.updateExpenseList();
    this.updateCurrencySymbol();
  },

  // Setup event listeners
  setupEventListeners() {
    // Expense form submission (inline form)
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
      // Set today's date as default
      const dateInput = document.getElementById('expenseDate');
      if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }
      
      expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleExpenseSubmit(e.target);
      });
    }

    // Filters
    const categoryFilter = document.getElementById('categoryFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
        this.updateExpenseList();
      });
    }
    
    if (dateFilter) {
      dateFilter.addEventListener('change', () => {
        this.updateExpenseList();
      });
    }
  },

  // Handle expense form submission
  async handleExpenseSubmit(form) {
    const formData = new FormData(form);
    const expense = {
      amount: parseFloat(formData.get('amount')),
      description: formData.get('description'),
      category: formData.get('category'),
      date: formData.get('date')
    };

    if (App.validateExpense && App.validateExpense(expense)) {
      await App.addExpense(expense);
      
      // Reset form and set today's date
      form.reset();
      const dateInput = document.getElementById('expenseDate');
      if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }
      
      // Update all dashboard components
      this.updateMetrics();
      this.updateCategoryBreakdown();
      this.updateRecentTransactions();
      this.updateBudgetProgress();
      this.updateExpenseList();
    } else if (!App.validateExpense) {
      // Fallback if validateExpense doesn't exist
      await App.addExpense(expense);
      form.reset();
      const dateInput = document.getElementById('expenseDate');
      if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }
      this.updateMetrics();
      this.updateCategoryBreakdown();
      this.updateRecentTransactions();
      this.updateBudgetProgress();
      this.updateExpenseList();
    }
  },

  // Update metrics cards
  updateMetrics() {
    const metricsGrid = document.getElementById('metricsGrid');
    if (!metricsGrid) return;

    const expenses = App.getAllExpenses ? App.getAllExpenses() : (App.expenses || []);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentDate = new Date();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = currentDate.getDate();

    // Calculate totals
    const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
    const monthlySpending = expenses
      .filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);
    
    const averageDaily = currentDay > 0 ? monthlySpending / currentDay : 0;
    
    // Get budget from settings
    let budgetSettings = { monthlyBudget: 3000 };
    if (typeof Settings !== 'undefined' && Settings.getBudgetSettings) {
      budgetSettings = Settings.getBudgetSettings();
    } else {
      try {
        const budgetData = localStorage.getItem('expenseTrackerBudgetSettings');
        if (budgetData) budgetSettings = JSON.parse(budgetData);
      } catch (e) {}
    }
    const monthlyBudget = budgetSettings.monthlyBudget || 3000;
    const budgetRemaining = Math.max(monthlyBudget - monthlySpending, 0);

    const currency = this.getCurrencySymbol();

    metricsGrid.innerHTML = `
      <div class="metric-card metric-card--primary">
        <div class="metric-card__icon">
          <i class="fas fa-dollar-sign"></i>
        </div>
        <div class="metric-card__content">
          <h3 class="metric-card__label">Total Spending</h3>
          <p class="metric-card__value">${currency}${totalSpending.toFixed(2)}</p>
        </div>
      </div>
      
      <div class="metric-card metric-card--success">
        <div class="metric-card__icon">
          <i class="fas fa-calendar-alt"></i>
        </div>
        <div class="metric-card__content">
          <h3 class="metric-card__label">This Month</h3>
          <p class="metric-card__value">${currency}${monthlySpending.toFixed(2)}</p>
        </div>
      </div>
      
      <div class="metric-card metric-card--info">
        <div class="metric-card__icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="metric-card__content">
          <h3 class="metric-card__label">Avg Daily</h3>
          <p class="metric-card__value">${currency}${averageDaily.toFixed(2)}</p>
        </div>
      </div>
      
      <div class="metric-card metric-card--warning">
        <div class="metric-card__icon">
          <i class="fas fa-wallet"></i>
        </div>
        <div class="metric-card__content">
          <h3 class="metric-card__label">Budget Remaining</h3>
          <p class="metric-card__value">${currency}${budgetRemaining.toFixed(2)}</p>
        </div>
      </div>
    `;
  },

  // Update spending insights (removed - not in new design)
  updateSpendingInsights() {
    // This method is kept for compatibility but not used in new design
    return;

    const expenses = App.getAllExpenses ? App.getAllExpenses() : (App.expenses || []);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    if (monthlyExpenses.length === 0) {
      insightsContainer.innerHTML = `
        <div class="insight-item">
          <p class="insight-text">No expenses recorded this month. Start tracking to see insights!</p>
        </div>
      `;
      return;
    }

    // Calculate insights
    const totalMonthly = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const avgExpense = totalMonthly / monthlyExpenses.length;
    const largestExpense = monthlyExpenses.reduce((max, e) => e.amount > max.amount ? e : max, monthlyExpenses[0]);
    const categoryCounts = {};
    monthlyExpenses.forEach(e => {
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    });
    const topCategory = Object.keys(categoryCounts).reduce((a, b) => 
      categoryCounts[a] > categoryCounts[b] ? a : b
    );

    const currency = this.getCurrencySymbol();
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

    insightsContainer.innerHTML = `
      <div class="insight-item">
        <div class="insight-icon">
          <i class="fas fa-calculator"></i>
        </div>
        <div class="insight-content">
          <h4 class="insight-title">Average Expense</h4>
          <p class="insight-value">${currency}${avgExpense.toFixed(2)}</p>
        </div>
      </div>
      
      <div class="insight-item">
        <div class="insight-icon">
          <i class="fas fa-arrow-up"></i>
        </div>
        <div class="insight-content">
          <h4 class="insight-title">Largest Expense</h4>
          <p class="insight-value">${currency}${largestExpense.amount.toFixed(2)}</p>
          <p class="insight-detail">${largestExpense.description}</p>
        </div>
      </div>
      
      <div class="insight-item">
        <div class="insight-icon">
          <i class="fas fa-tag"></i>
        </div>
        <div class="insight-content">
          <h4 class="insight-title">Top Category</h4>
          <p class="insight-value">${categoryNames[topCategory] || topCategory}</p>
          <p class="insight-detail">${categoryCounts[topCategory]} transactions</p>
        </div>
      </div>
    `;
  },

  // Update category breakdown
  updateCategoryBreakdown() {
    const breakdownContainer = document.getElementById('categoryBreakdown');
    if (!breakdownContainer) return;

    const expenses = App.getAllExpenses ? App.getAllExpenses() : (App.expenses || []);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    const categoryTotals = {};
    monthlyExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    const currency = this.getCurrencySymbol();

    const categoryInfo = {
      food: { name: 'Food & Dining', icon: '🍔', color: '#FF6B6B' },
      transport: { name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
      entertainment: { name: 'Entertainment', icon: '🎬', color: '#45B7D1' },
      utilities: { name: 'Utilities', icon: '⚡', color: '#FFA07A' },
      shopping: { name: 'Shopping', icon: '🛍️', color: '#98D8C8' },
      healthcare: { name: 'Healthcare', icon: '🏥', color: '#F7DC6F' },
      education: { name: 'Education', icon: '📚', color: '#BB8FCE' },
      other: { name: 'Other', icon: '📋', color: '#85C1E2' }
    };

    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (sortedCategories.length === 0) {
      breakdownContainer.innerHTML = `
        <div class="empty-state">
          <p>No category data available for this month.</p>
        </div>
      `;
      return;
    }

    breakdownContainer.innerHTML = sortedCategories.map(([category, amount]) => {
      const info = categoryInfo[category] || { name: category, icon: '📋', color: '#85C1E2' };
      const percentage = total > 0 ? (amount / total * 100).toFixed(1) : 0;
      
      return `
        <div class="category-breakdown-item">
          <div class="category-breakdown-item__header">
            <div class="category-breakdown-item__info">
              <span class="category-breakdown-item__icon">${info.icon}</span>
              <span class="category-breakdown-item__name">${info.name}</span>
            </div>
            <span class="category-breakdown-item__amount">${currency}${amount.toFixed(2)}</span>
          </div>
          <div class="category-breakdown-item__progress">
            <div class="category-breakdown-item__progress-bar" style="width: ${percentage}%; background-color: ${info.color}"></div>
          </div>
          <div class="category-breakdown-item__percentage">${percentage}%</div>
        </div>
      `;
    }).join('');
  },

  // Update recent transactions
  updateRecentTransactions() {
    const transactionsContainer = document.getElementById('recentTransactions');
    if (!transactionsContainer) return;

    const expenses = App.getAllExpenses ? App.getAllExpenses() : (App.expenses || []);
    const recent = expenses
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (recent.length === 0) {
      transactionsContainer.innerHTML = `
        <div class="empty-state">
          <p>No recent transactions. Add your first expense to get started!</p>
        </div>
      `;
      return;
    }

    const currency = this.getCurrencySymbol();
    const categoryInfo = {
      food: { icon: '🍔', name: 'Food' },
      transport: { icon: '🚗', name: 'Transport' },
      entertainment: { icon: '🎬', name: 'Entertainment' },
      utilities: { icon: '⚡', name: 'Utilities' },
      shopping: { icon: '🛍️', name: 'Shopping' },
      healthcare: { icon: '🏥', name: 'Healthcare' },
      education: { icon: '📚', name: 'Education' },
      other: { icon: '📋', name: 'Other' }
    };

    transactionsContainer.innerHTML = recent.map(expense => {
      const info = categoryInfo[expense.category] || { icon: '📋', name: 'Other' };
      const date = new Date(expense.date);
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      return `
        <div class="transaction-item">
          <div class="transaction-item__icon">${info.icon}</div>
          <div class="transaction-item__content">
            <h4 class="transaction-item__description">${expense.description}</h4>
            <p class="transaction-item__meta">${info.name} • ${formattedDate}</p>
          </div>
          <div class="transaction-item__amount">${currency}${expense.amount.toFixed(2)}</div>
        </div>
      `;
    }).join('');
  },

  // Update budget progress
  updateBudgetProgress() {
    const budgetContainer = document.getElementById('budgetProgressCard');
    if (!budgetContainer) return;

    const expenses = App.getAllExpenses ? App.getAllExpenses() : (App.expenses || []);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlySpending = expenses
      .filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    let budgetSettings = { monthlyBudget: 3000 };
    if (typeof Settings !== 'undefined' && Settings.getBudgetSettings) {
      budgetSettings = Settings.getBudgetSettings();
    } else {
      try {
        const budgetData = localStorage.getItem('expenseTrackerBudgetSettings');
        if (budgetData) budgetSettings = JSON.parse(budgetData);
      } catch (e) {}
    }
    const monthlyBudget = budgetSettings.monthlyBudget || 3000;
    const percentage = monthlyBudget > 0 ? Math.min((monthlySpending / monthlyBudget) * 100, 100) : 0;
    const remaining = Math.max(monthlyBudget - monthlySpending, 0);
    const isOverBudget = monthlySpending > monthlyBudget;

    const currency = this.getCurrencySymbol();

    budgetContainer.innerHTML = `
      <div class="budget-progress-card">
        <div class="budget-progress-card__header">
          <div class="budget-progress-card__info">
            <span class="budget-progress-card__spent">${currency}${monthlySpending.toFixed(2)}</span>
            <span class="budget-progress-card__separator">/</span>
            <span class="budget-progress-card__total">${currency}${monthlyBudget.toFixed(2)}</span>
          </div>
          <span class="budget-progress-card__percentage">${percentage.toFixed(0)}%</span>
        </div>
        <div class="budget-progress-card__bar">
          <div class="budget-progress-card__progress ${isOverBudget ? 'budget-progress-card__progress--over' : ''}" 
               style="width: ${percentage}%"></div>
        </div>
        <div class="budget-progress-card__footer">
          <span class="budget-progress-card__remaining ${isOverBudget ? 'budget-progress-card__remaining--over' : ''}">
            ${isOverBudget ? 'Over budget by' : 'Remaining'}: ${currency}${Math.abs(remaining).toFixed(2)}
          </span>
        </div>
      </div>
    `;
  },

  // Update expense list
  updateExpenseList() {
    const expenseItems = document.getElementById('expenseItems');
    if (!expenseItems) return;

    const expenses = App.getAllExpenses ? App.getAllExpenses() : (App.expenses || []);
    
    // Apply filters
    const categoryFilter = document.getElementById('categoryFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    let filtered = expenses;
    
    if (categoryFilter && categoryFilter.value) {
      filtered = filtered.filter(e => e.category === categoryFilter.value);
    }
    
    if (dateFilter && dateFilter.value) {
      filtered = filtered.filter(e => e.date === dateFilter.value);
    }

    if (filtered.length === 0) {
      expenseItems.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📊</div>
          <h4 class="empty-state__title">No expenses found</h4>
          <p class="empty-state__message">Try adjusting your filters or add a new expense.</p>
        </div>
      `;
      return;
    }

    const currency = this.getCurrencySymbol();
    const categoryInfo = {
      food: { icon: '🍔', name: 'Food & Dining' },
      transport: { icon: '🚗', name: 'Transportation' },
      entertainment: { icon: '🎬', name: 'Entertainment' },
      utilities: { icon: '⚡', name: 'Utilities' },
      shopping: { icon: '🛍️', name: 'Shopping' },
      healthcare: { icon: '🏥', name: 'Healthcare' },
      education: { icon: '📚', name: 'Education' },
      other: { icon: '📋', name: 'Other' }
    };

    expenseItems.innerHTML = filtered
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(expense => {
        const info = categoryInfo[expense.category] || { icon: '📋', name: 'Other' };
        const date = new Date(expense.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
        
        return `
          <div class="expense-item" data-id="${expense.id}">
            <div class="expense-item__icon">${info.icon}</div>
            <div class="expense-item__content">
              <h4 class="expense-item__description">${expense.description}</h4>
              <p class="expense-item__meta">${info.name} • ${formattedDate}</p>
            </div>
            <div class="expense-item__amount">${currency}${expense.amount.toFixed(2)}</div>
            <div class="expense-item__actions">
              <button class="expense-item__action expense-item__action--edit" data-id="${expense.id}" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="expense-item__action expense-item__action--delete" data-id="${expense.id}" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');

    // Setup event listeners for edit/delete
    this.setupExpenseItemListeners();
  },

  // Setup expense item listeners
  setupExpenseItemListeners() {
    const deleteButtons = document.querySelectorAll('.expense-item__action--delete');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.getAttribute('data-id'));
        this.handleDeleteExpense(id);
      });
    });

    const editButtons = document.querySelectorAll('.expense-item__action--edit');
    editButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.getAttribute('data-id'));
        this.handleEditExpense(id);
      });
    });
  },

  // Handle delete expense
  handleDeleteExpense(id) {
    const expense = App.expenses.find(e => e.id === id);
    if (!expense) return;

    const modal = document.getElementById('deleteModal');
    const modalBody = document.getElementById('deleteModalBody');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');

    if (modal && modalBody) {
      modalBody.innerHTML = `
        <p><strong>${expense.description}</strong></p>
        <p>Amount: ${this.getCurrencySymbol()}${expense.amount.toFixed(2)}</p>
        <p>Category: ${expense.category}</p>
        <p>Date: ${new Date(expense.date).toLocaleDateString()}</p>
      `;

      modal.classList.add('modal--open');
      document.body.classList.add('body--modal-open');

      // Remove existing listeners
      const newConfirmBtn = confirmBtn.cloneNode(true);
      confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
      const newCancelBtn = cancelBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

      // Add new listeners
      document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        App.deleteExpense(id);
        modal.classList.remove('modal--open');
        document.body.classList.remove('body--modal-open');
        
        // Update all components
        this.updateMetrics();
        this.updateSpendingInsights();
        this.updateCategoryBreakdown();
        this.updateRecentTransactions();
        this.updateBudgetProgress();
        this.updateExpenseList();
        
        App.showSuccessMessage('Expense deleted successfully!');
      });

      document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        modal.classList.remove('modal--open');
        document.body.classList.remove('body--modal-open');
      });
    }
  },

  // Handle edit expense
  handleEditExpense(id) {
    const expense = App.expenses.find(e => e.id === id);
    if (!expense) return;

    // Open modal and populate form
    const modal = document.getElementById('addExpenseModal');
    const form = document.getElementById('expenseForm');
    
    if (modal && form) {
      document.getElementById('expenseAmount').value = expense.amount;
      document.getElementById('expenseDescription').value = expense.description;
      document.getElementById('expenseCategory').value = expense.category;
      document.getElementById('expenseDate').value = expense.date;
      
      modal.classList.add('modal--open');
      document.body.classList.add('body--modal-open');

      // Update form submission to handle edit
      const originalHandler = form.onsubmit;
      form.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        expense.amount = parseFloat(formData.get('amount'));
        expense.description = formData.get('description');
        expense.category = formData.get('category');
        expense.date = formData.get('date');
        
        App.updateExpense(expense);
        form.reset();
        modal.classList.remove('modal--open');
        document.body.classList.remove('body--modal-open');
        
        // Update all components
        this.updateMetrics();
        this.updateSpendingInsights();
        this.updateCategoryBreakdown();
        this.updateRecentTransactions();
        this.updateBudgetProgress();
        this.updateExpenseList();
        
        App.showSuccessMessage('Expense updated successfully!');
        form.onsubmit = originalHandler;
      };
    }
  },

  // Get currency symbol from settings
  getCurrencySymbol() {
    const settings = App.getFromStorage ? App.getFromStorage(App.STORAGE_KEYS.SETTINGS) : null;
    const currency = settings?.currency || 'USD';
    
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$'
    };
    
    return symbols[currency] || '$';
  },

  // Update currency symbol in form
  updateCurrencySymbol() {
    const currencySymbol = document.getElementById('currencySymbol');
    if (currencySymbol) {
      currencySymbol.textContent = this.getCurrencySymbol();
    }
  }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (Dashboard.init && typeof App !== 'undefined') {
    // Wait for App to initialize
    setTimeout(() => {
      Dashboard.init();
    }, 200);
  }
});
