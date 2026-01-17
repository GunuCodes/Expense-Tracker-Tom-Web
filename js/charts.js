/**
 * Charts JavaScript
 * Personal Expense Tracker
 */

const Charts = {
  chartInstances: {},
  
  // Initialize charts with expense data
  init(expenses = []) {
    console.log('Charts initialized with data:', expenses);
    this.createCategoryChart(expenses);
    this.createMonthlyChart(expenses);
    this.updateCategoryComparison(expenses);
    this.updateSpendingTrends(expenses);
  },

  // Create category breakdown pie chart
  createCategoryChart(expenses) {
    const ctx = document.getElementById('categoryDistributionChart');
    if (!ctx) return;

    // Process expense data by category
    const categoryData = this.processCategoryData(expenses);
    
    const data = {
      labels: categoryData.labels,
      datasets: [{
        data: categoryData.values,
        backgroundColor: this.getCategoryColors(categoryData.labels),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    // Get theme for chart colors
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#e5e7eb' : '#374151';
    
    const config = {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: {
                size: 12
              },
              color: textColor
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: $${context.parsed.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    // Destroy existing chart if it exists
    if (this.chartInstances.categoryChart) {
      this.chartInstances.categoryChart.destroy();
    }

    this.chartInstances.categoryChart = new Chart(ctx, config);
  },

  // Create monthly spending bar chart
  createMonthlyChart(expenses) {
    const ctx = document.getElementById('monthlySpendingChart');
    if (!ctx) return;

    // Process expense data by month
    const monthlyData = this.processMonthlyData(expenses);
    
    // Get theme for chart colors
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#374151' : '#e2e8f0';
    const textColor = isDark ? '#e5e7eb' : '#374151';
    
    const data = {
      labels: monthlyData.labels,
      datasets: [{
        label: 'Monthly Spending',
        data: monthlyData.values,
        backgroundColor: '#2563eb',
        borderColor: '#1d4ed8',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      }]
    };

    const config = {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Spending: $${context.parsed.y.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              callback: function(value) {
                return '$' + value.toFixed(0);
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: textColor
            }
          }
        }
      }
    };

    // Destroy existing chart if it exists
    if (this.chartInstances.monthlyChart) {
      this.chartInstances.monthlyChart.destroy();
    }

    this.chartInstances.monthlyChart = new Chart(ctx, config);
  },

  // Process expense data by category
  processCategoryData(expenses) {
    const categoryTotals = {};
    
    expenses.forEach(expense => {
      if (categoryTotals[expense.category]) {
        categoryTotals[expense.category] += expense.amount;
      } else {
        categoryTotals[expense.category] = expense.amount;
      }
    });

    // Convert to arrays and sort by amount
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a);

    return {
      labels: sortedCategories.map(([category]) => this.getCategoryName(category)),
      values: sortedCategories.map(([,amount]) => amount)
    };
  },

  // Process expense data by month
  processMonthlyData(expenses) {
    const monthlyTotals = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] += expense.amount;
      } else {
        monthlyTotals[monthKey] = expense.amount;
      }
    });

    // Get last 6 months
    const last6Months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      last6Months.push(monthKey);
    }

    return {
      labels: last6Months,
      values: last6Months.map(month => monthlyTotals[month] || 0)
    };
  },

  // Get category display name
  getCategoryName(category) {
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
    return categoryNames[category] || 'Other';
  },

  // Get colors for categories (matching CSS variables)
  getCategoryColors(labels) {
    const colorMap = {
      'Food & Dining': '#fbbf24',
      'Transportation': '#3b82f6',
      'Entertainment': '#8b5cf6',
      'Utilities': '#10b981',
      'Shopping': '#ec4899',
      'Healthcare': '#ef4444',
      'Education': '#06b6d4',
      'Other': '#6b7280'
    };

    return labels.map(label => colorMap[label] || '#6b7280');
  },

  // Update charts with new data
  updateCharts(expenses) {
    console.log('Updating charts with new data:', expenses);
    // Destroy existing charts first to apply new theme
    this.destroyCharts();
    // Recreate charts with updated theme
    this.createCategoryChart(expenses);
    this.createMonthlyChart(expenses);
    this.updateCategoryComparison(expenses);
    this.updateSpendingTrends(expenses);
  },

  // Update category comparison section
  updateCategoryComparison(expenses) {
    const container = document.getElementById('categoryComparison');
    if (!container) return;

    const categoryData = this.processCategoryData(expenses);
    const currency = this.getCurrencySymbol();

    if (categoryData.labels.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No category data available.</p>
        </div>
      `;
      return;
    }

    const total = categoryData.values.reduce((sum, val) => sum + val, 0);
    const maxValue = Math.max(...categoryData.values);

    container.innerHTML = categoryData.labels.map((label, index) => {
      const value = categoryData.values[index];
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
      const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;
      const categoryId = this.getCategoryId(label);
      const icon = this.getCategoryIcon(categoryId);

      return `
        <div class="category-comparison-item">
          <div class="category-comparison-item__header">
            <div class="category-comparison-item__info">
              <span class="category-comparison-item__icon">${icon}</span>
              <span class="category-comparison-item__name">${label}</span>
            </div>
            <div class="category-comparison-item__amount">
              <span class="category-comparison-item__value">${currency}${value.toFixed(2)}</span>
              <span class="category-comparison-item__percentage">${percentage}%</span>
            </div>
          </div>
          <div class="category-comparison-item__bar">
            <div class="category-comparison-item__bar-fill" style="width: ${barWidth}%"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  // Update spending trends section
  updateSpendingTrends(expenses) {
    const container = document.getElementById('spendingTrends');
    if (!container) return;

    const monthlyData = this.processMonthlyData(expenses);
    const currency = this.getCurrencySymbol();
    const maxValue = Math.max(...monthlyData.values, 1);

    if (monthlyData.labels.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No spending trends data available.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = monthlyData.labels.map((label, index) => {
      const value = monthlyData.values[index];
      const barHeight = maxValue > 0 ? (value / maxValue) * 100 : 0;
      const trend = index > 0 ? (value - monthlyData.values[index - 1]) : 0;
      const trendIcon = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
      const trendClass = trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-neutral';

      return `
        <div class="spending-trend-item">
          <div class="spending-trend-item__header">
            <span class="spending-trend-item__month">${label}</span>
            <div class="spending-trend-item__info">
              <span class="spending-trend-item__amount">${currency}${value.toFixed(2)}</span>
              ${index > 0 ? `
                <span class="spending-trend-item__trend ${trendClass}">
                  ${trendIcon} ${trend > 0 ? '+' : ''}${currency}${Math.abs(trend).toFixed(2)}
                </span>
              ` : ''}
            </div>
          </div>
          <div class="spending-trend-item__bar">
            <div class="spending-trend-item__bar-fill" style="height: ${barHeight}%"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  // Get category ID from name
  getCategoryId(name) {
    const categoryMap = {
      'Food & Dining': 'food',
      'Transportation': 'transport',
      'Entertainment': 'entertainment',
      'Utilities': 'utilities',
      'Shopping': 'shopping',
      'Healthcare': 'healthcare',
      'Education': 'education',
      'Other': 'other'
    };
    return categoryMap[name] || 'other';
  },

  // Get category icon
  getCategoryIcon(categoryId) {
    const icons = {
      food: '🍔',
      transport: '🚗',
      entertainment: '🎬',
      utilities: '⚡',
      shopping: '🛍️',
      healthcare: '🏥',
      education: '📚',
      other: '📋'
    };
    return icons[categoryId] || '📋';
  },

  // Get currency symbol
  getCurrencySymbol() {
    if (typeof App !== 'undefined' && App.getFromStorage) {
      const settings = App.getFromStorage(App.STORAGE_KEYS.SETTINGS) || {};
      const currency = settings.currency || 'USD';
      
      const symbols = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CAD: 'C$',
        PHP: '₱'
      };
      
      return symbols[currency] || '$';
    }
    return '$';
  },

  // Destroy all charts
  destroyCharts() {
    Object.values(this.chartInstances).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    this.chartInstances = {};
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Charts;
}
