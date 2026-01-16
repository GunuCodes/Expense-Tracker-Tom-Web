/**
 * Navigation JavaScript
 * Handles multi-page navigation, active states, and mobile menu
 */

const Navigation = {
  // Initialize navigation
  init() {
    this.setActiveNavLink();
    this.setupMobileMenu();
    this.setupAuthUI();
  },

  // Set active navigation link based on current page
  setActiveNavLink() {
    const currentPage = this.getCurrentPage();
    const navLinks = document.querySelectorAll('.nav__link[data-page]');
    
    navLinks.forEach(link => {
      link.classList.remove('nav__link--active');
      if (link.getAttribute('data-page') === currentPage) {
        link.classList.add('nav__link--active');
      }
    });
  },

  // Get current page name from URL
  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    if (filename === 'index.html' || filename === '' || filename.endsWith('/')) {
      return 'index';
    } else if (filename === 'dashboard.html') {
      return 'dashboard';
    } else if (filename === 'reports.html') {
      return 'reports';
    } else if (filename === 'login.html') {
      return 'login';
    } else if (filename === 'signup.html') {
      return 'signup';
    }
    
    return 'index';
  },

  // Setup mobile menu toggle
  setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.querySelector('.header__nav');
    
    if (menuToggle && nav) {
      menuToggle.addEventListener('click', () => {
        nav.classList.toggle('nav--open');
        menuToggle.classList.toggle('menu-toggle--active');
      });

      // Close menu when clicking on a link
      const navLinks = nav.querySelectorAll('.nav__link');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          nav.classList.remove('nav--open');
          menuToggle.classList.remove('menu-toggle--active');
        });
      });

      // Close menu when clicking outside (only if menu is open)
      document.addEventListener('click', (e) => {
        if (nav.classList.contains('nav--open') && 
            !nav.contains(e.target) && 
            !menuToggle.contains(e.target)) {
          nav.classList.remove('nav--open');
          menuToggle.classList.remove('menu-toggle--active');
        }
      });
    }
  },

  // Setup authentication UI
  setupAuthUI() {
    // Check if user is logged in
    if (typeof App !== 'undefined' && App.currentUser) {
      this.updateAuthUI(true);
    } else {
      this.updateAuthUI(false);
    }
  },

  // Update authentication UI based on login state
  updateAuthUI(isLoggedIn) {
    const authSection = document.getElementById('authSection');
    if (!authSection) return;

    if (isLoggedIn && typeof App !== 'undefined' && App.currentUser) {
      authSection.innerHTML = `
        <div class="header__user-info">
          <span class="user__name">${App.currentUser.name}</span>
        </div>
        <button class="btn-auth btn-auth--logout" id="logoutBtn">Logout</button>
      `;

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          if (typeof App !== 'undefined' && App.handleLogout) {
            App.handleLogout();
            window.location.href = 'index.html';
          }
        });
      }
    } else {
      authSection.innerHTML = `
        <a href="login.html" class="btn-auth btn-auth--login">Login</a>
        <a href="signup.html" class="btn-auth btn-auth--signup">Sign Up</a>
      `;
    }
  }
};

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  Navigation.init();
});

