/**
 * Dashboard JavaScript
 * Personal Expense Tracker
 */

const Dashboard = {
  // Initialize dashboard
  init() {
    console.log('Dashboard initialized');
    this.updateSummaryCards();
    this.setupDashboardEvents();
  },

  // Update summary cards with data
  updateSummaryCards() {
    const summaryCards = document.querySelectorAll('.summary-card__amount');
    
    // Mock data - replace with real data later
    const mockData = {
      totalExpenses: '$2,450.75',
      thisMonth: '$485.30',
      budget: '$3,000.00'
    };

    if (summaryCards.length >= 3) {
      summaryCards[0].textContent = mockData.totalExpenses;
      summaryCards[1].textContent = mockData.thisMonth;
      summaryCards[2].textContent = mockData.budget;
    }
  },

  // Setup dashboard-specific event listeners
  setupDashboardEvents() {
    // Add any dashboard-specific event listeners here
    console.log('Dashboard events setup complete');
  },

  // Calculate budget progress
  calculateBudgetProgress() {
    // Budget calculation logic will be implemented here
    console.log('Calculating budget progress...');
  },

  // Update dashboard data
  updateDashboard() {
    this.updateSummaryCards();
    this.calculateBudgetProgress();
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dashboard;
}
