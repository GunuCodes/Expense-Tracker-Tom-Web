/**
 * Charts JavaScript
 * Personal Expense Tracker
 */

const Charts = {
  // Initialize charts
  init() {
    console.log('Charts initialized');
    this.createExpenseChart();
    this.createTrendChart();
  },

  // Create expense categories pie chart
  createExpenseChart() {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;

    // Mock data - replace with real data later
    const data = {
      labels: ['Food', 'Transport', 'Entertainment', 'Utilities', 'Shopping'],
      datasets: [{
        data: [35, 25, 15, 15, 10],
        backgroundColor: [
          '#3b82f6', // Blue
          '#10b981', // Green
          '#f59e0b', // Yellow
          '#ef4444', // Red
          '#8b5cf6'  // Purple
        ],
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
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    };

    new Chart(ctx, config);
  },

  // Create monthly trend line chart
  createTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    // Mock data - replace with real data later
    const data = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Monthly Expenses',
        data: [1200, 1900, 1500, 2100, 1800, 2200],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }]
    };

    const config = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#e5e7eb'
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

    new Chart(ctx, config);
  },

  // Update charts with new data
  updateCharts(expenseData) {
    console.log('Updating charts with new data:', expenseData);
    // Chart update logic will be implemented here
  },

  // Destroy all charts
  destroyCharts() {
    Chart.helpers.each(Chart.instances, (chart) => {
      chart.destroy();
    });
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Charts;
}
