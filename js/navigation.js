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
    } else if (filename === 'settings.html') {
      return 'settings';
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
    // Use Auth manager if available
    if (typeof Auth !== 'undefined' && Auth.isUserAuthenticated) {
      const isAuth = Auth.isUserAuthenticated();
      this.updateAuthUI(isAuth);
    } else if (typeof App !== 'undefined' && App.currentUser) {
      // Fallback to App.currentUser
      this.updateAuthUI(true);
    } else {
      this.updateAuthUI(false);
    }
  },

  // Update authentication UI based on login state
  updateAuthUI(isLoggedIn) {
    // Auth manager handles UI updates, so we don't need to do anything here
    // This is kept for backward compatibility
    const authSection = document.getElementById('authSection');
    if (!authSection) return;

    // Get current user from Auth manager or App
    let currentUser = null;
    if (typeof Auth !== 'undefined' && Auth.getCurrentUser) {
      currentUser = Auth.getCurrentUser();
    } else if (typeof App !== 'undefined' && App.currentUser) {
      currentUser = App.currentUser;
    }

    if (isLoggedIn && currentUser) {
      authSection.innerHTML = `
        <div class="header__user-info">
          <img src="assets/images/avatars/default-avatar.svg" alt="User Avatar" class="avatar avatar--small">
          <span class="user__name">${currentUser.name}</span>
        </div>
        <button class="btn-auth btn-auth--logout" id="logoutBtn">
          <i class="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      `;

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          if (typeof Auth !== 'undefined' && Auth.handleLogout) {
            Auth.handleLogout();
          } else if (typeof App !== 'undefined' && App.handleLogout) {
            App.handleLogout();
          }
        });
      }
    } else {
      authSection.innerHTML = `
        <a href="login.html" class="btn-auth btn-auth--login">
          <i class="fas fa-sign-in-alt"></i>
          <span>Login</span>
        </a>
        <a href="signup.html" class="btn-auth btn-auth--signup">
          <i class="fas fa-user-plus"></i>
          <span>Sign Up</span>
        </a>
      `;
    }
  }
};

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  Navigation.init();
});

