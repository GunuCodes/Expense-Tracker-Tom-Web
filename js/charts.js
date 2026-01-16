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
              }
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
              color: '#e2e8f0'
            },
            ticks: {
              callback: function(value) {
                return '$' + value.toFixed(0);
              }
            }
          },
          x: {
            grid: {
              display: false
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
    this.createCategoryChart(expenses);
    this.createMonthlyChart(expenses);
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
