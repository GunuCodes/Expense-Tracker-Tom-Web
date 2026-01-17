/**
 * Authentication Manager
 * Handles authentication state, route protection, and session management
 */

const Auth = {
  // Storage keys
  STORAGE_KEYS: {
    CURRENT_USER: 'expenseTrackerCurrentUser',
    SESSION_TOKEN: 'expenseTrackerToken'
  },

  // Current user state
  currentUser: null,
  isAuthenticated: false,

  // Initialize authentication
  async init() {
    await this.checkAuthState();
    await this.handleOAuthCallback(); // Check for OAuth tokens in URL
    await this.setupRouteProtection();
  },

  // Handle OAuth callback (check for tokens in URL parameters)
  async handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const googleAuth = urlParams.get('googleAuth');
    const error = urlParams.get('error');

    console.log('Checking for OAuth callback params:', { token: !!token, googleAuth, error });

    if (error) {
      let errorMessage = 'Google authentication failed.';
      if (error === 'no_code') {
        errorMessage = 'No authorization code received from Google.';
      } else if (error === 'no_email') {
        errorMessage = 'No email address found in Google account.';
      } else if (error === 'oauth_failed') {
        errorMessage = 'OAuth authentication failed. Please try again.';
      }

      if (typeof App !== 'undefined' && App.showError) {
        App.showError(errorMessage);
      } else {
        alert(errorMessage);
      }

      // Clean URL and redirect to login
      this.cleanUrlAndRedirect('login.html');
      return;
    }

    if (token && googleAuth === 'true') {
      console.log('Processing OAuth token...');

      // Store token
      if (typeof API !== 'undefined' && API.setToken) {
        API.setToken(token);
      }

      // Store in localStorage
      localStorage.setItem('expenseTrackerToken', token);

      // Get user info
      try {
        if (typeof API !== 'undefined' && API.verifyToken) {
          console.log('Verifying OAuth token with API...');
          const response = await API.verifyToken();
          console.log('OAuth token verification response:', response);

          if (response && response.user) {
            console.log('OAuth user verified, logging in...');
            // Login user
            this.login(response.user, token);

            // Show success message
            if (typeof App !== 'undefined' && App.showSuccessMessage) {
              App.showSuccessMessage(`Welcome, ${response.user.name || 'User'}!`);
            }

            // Clean URL and redirect to dashboard
            this.cleanUrlAndRedirect('dashboard.html');
            return;
          } else {
            console.error('OAuth token verification failed - no user in response');
          }
        } else {
          console.error('API.verifyToken not available');
        }
      } catch (error) {
        console.error('Error verifying OAuth token:', error);
      }

      // If we get here, there was an error - redirect to login
      this.cleanUrlAndRedirect('login.html');
    }
  },

  // Clean URL parameters and optionally redirect
  cleanUrlAndRedirect(redirectTo = null) {
    // Remove token and oauth params from URL
    const url = new URL(window.location);
    url.searchParams.delete('token');
    url.searchParams.delete('googleAuth');
    url.searchParams.delete('error');

    if (redirectTo) {
      // Redirect to specific page
      window.location.href = redirectTo;
    } else {
      // Replace current URL without params
      window.history.replaceState({}, document.title, url.pathname + url.hash);
    }
  },

  // Check authentication state from storage and API
  async checkAuthState() {
    try {
      const savedUser = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
      const sessionToken = localStorage.getItem(this.STORAGE_KEYS.SESSION_TOKEN);

      if (savedUser && sessionToken && typeof API !== 'undefined') {
        // Verify token with API
        try {
          // Make sure API has the token
          if (sessionToken && !API.token) {
            API.setToken(sessionToken);
          }
          const response = await API.verifyToken();
          if (response && response.user) {
            this.currentUser = response.user;
        this.isAuthenticated = true;
            // Update stored user data (ensure isAdmin field is included)
            localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(response.user));
            console.log('User verified from API:', {
              email: response.user.email,
              isAdmin: response.user.isAdmin,
              isAdminType: typeof response.user.isAdmin,
              fullUser: response.user
            });
          return true;
          }
        } catch (error) {
          console.log('Token verification failed, clearing auth:', error);
          // Clear invalid tokens
          this.currentUser = null;
          this.isAuthenticated = false;
          localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
          localStorage.removeItem(this.STORAGE_KEYS.SESSION_TOKEN);
          if (typeof API !== 'undefined') {
            API.setToken(null);
          }
        }
      }

      // No valid session
        this.currentUser = null;
        this.isAuthenticated = false;
      // Force light mode for logged out users
      if (typeof App !== 'undefined' && App.applySettings) {
        App.applySettings();
      }
      return false;
    } catch (error) {
      console.error('Error checking auth state:', error);
      this.logout();
      return false;
    }
  },

  // Validate session token
  validateSession(token) {
    // Simple validation - check if token exists and is not expired
    // In production, this would validate with a server
    if (!token) return false;
    
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1] || '{}'));
      if (tokenData.exp && tokenData.exp < Date.now()) {
        return false; // Token expired
      }
      return true;
    } catch {
      // If token is not JWT format, just check if it exists
      return token.length > 0;
    }
  },

  // Setup route protection based on current page
  async setupRouteProtection() {
    const currentPage = this.getCurrentPage();
    const requiresAuth = this.requiresAuthentication(currentPage);
    const requiresGuest = this.requiresGuest(currentPage);

    // Check if user is authenticated (await the async call)
    const isAuth = await this.checkAuthState();

    // Handle route protection - CRITICAL: Must redirect before any content loads
    if (requiresAuth && !isAuth) {
      // Protected page but user not logged in - redirect to landing immediately
      console.log('Unauthorized access attempt to protected page, redirecting...');
      // Hide page content immediately
      if (document.body) {
        document.body.style.display = 'none';
      }
      // Redirect immediately (no delay)
      window.location.href = 'index.html';
      return false; // Stop execution
    }

    // Check admin access
    if (this.requiresAdmin(currentPage)) {
      console.log('Admin page detected, checking admin access...');
      console.log('isAuth:', isAuth);
      console.log('currentUser:', this.currentUser);
      console.log('isAdmin():', this.isAdmin());
      
      if (!isAuth || !this.isAdmin()) {
      // Admin page but user is not admin - redirect to dashboard
        console.log('Admin access denied - redirecting to dashboard');
        if (typeof App !== 'undefined' && App.showError) {
      App.showError('Access denied. Admin privileges required.');
        }
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
      return;
      }
      console.log('Admin access granted');
    }

    if (requiresGuest && isAuth) {
      // Landing page but user is logged in - redirect to dashboard
      this.redirectToDashboard();
      return;
    }

    // Login/Signup pages: if already logged in, redirect to dashboard
    if ((currentPage === 'login' || currentPage === 'signup') && isAuth) {
      this.redirectToDashboard();
      return;
    }

    // Update navigation visibility based on page type
    this.updateNavigationVisibility(currentPage, isAuth);
    
    // Show body if auth check passed (for protected pages)
    if (requiresAuth && isAuth) {
      if (document.body) {
        document.body.style.display = '';
      }
    } else if (!requiresAuth) {
      // For non-protected pages, show body
      if (document.body) {
        document.body.style.display = '';
      }
    }
    
    return true; // Auth check passed
  },

  // Get current page name
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
    } else if (filename === 'admin.html') {
      return 'admin';
    } else if (filename === 'login.html') {
      return 'login';
    } else if (filename === 'signup.html') {
      return 'signup';
    }
    
    return 'index';
  },

  // Check if page requires authentication
  requiresAuthentication(page) {
    const protectedPages = ['dashboard', 'reports', 'settings', 'admin'];
    return protectedPages.includes(page);
  },

  // Check if page requires admin access
  requiresAdmin(page) {
    return page === 'admin';
  },

  // Check if current user is admin
  isAdmin() {
    if (!this.currentUser) {
      console.log('isAdmin check: No currentUser');
      return false;
    }
    
    console.log('isAdmin check - currentUser:', {
      email: this.currentUser.email,
      isAdmin: this.currentUser.isAdmin,
      isAdminType: typeof this.currentUser.isAdmin,
      isAdminStrict: this.currentUser.isAdmin === true
    });
    
    // Check isAdmin field from MongoDB (primary check)
    // Handle both boolean true and string "true" cases
    if (this.currentUser.isAdmin === true || this.currentUser.isAdmin === 'true') {
      console.log('isAdmin check: User is admin (isAdmin field)');
      return true;
    }
    
    // Fallback to email check for backwards compatibility
    const isAdminByEmail = this.currentUser.email === 'admintrust@email.com';
    if (isAdminByEmail) {
      console.log('isAdmin check: User is admin (email check)');
    }
    return isAdminByEmail;
  },

  // Check if page requires guest (not logged in)
  requiresGuest(page) {
    // Only index page requires guest (login/signup can be accessed by anyone)
    return page === 'index';
  },

  // Redirect to landing page
  redirectToLanding() {
    // Prevent redirect loop
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname.endsWith('/')) {
      return;
    }
    
    // Show loading state
    this.showRedirectMessage('Redirecting to login...');
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);
  },

  // Redirect to dashboard
  redirectToDashboard() {
    // Prevent redirect loop
    if (window.location.pathname.includes('dashboard.html')) {
      return;
    }
    
    // Show loading state
    this.showRedirectMessage('Redirecting to dashboard...');
    
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 500);
  },

  // Show redirect message
  showRedirectMessage(message) {
    // Create a simple overlay message
    const overlay = document.createElement('div');
    overlay.className = 'auth-redirect-overlay';
    overlay.innerHTML = `
      <div class="auth-redirect-message">
        <div class="auth-redirect-spinner"></div>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  // Update navigation visibility
  updateNavigationVisibility(page, isAuthenticated) {
    const header = document.querySelector('.header');
    const nav = document.querySelector('.header__nav');
    const authSection = document.querySelector('.header__auth');
    
    if (!header) return;

    const guestPages = ['index', 'login', 'signup'];
    const appPages = ['dashboard', 'reports', 'settings', 'admin'];
    
    if (guestPages.includes(page)) {
      // Guest pages - hide navigation, show minimal header
      if (nav) nav.style.display = 'none';
      header.classList.add('header--minimal');
      
      // Update auth buttons for guest pages
      if (authSection && !isAuthenticated) {
        if (page === 'login') {
          authSection.innerHTML = `
            <a href="login.html" class="btn-auth btn-auth--login btn-auth--active">
              <i class="fas fa-sign-in-alt"></i>
              <span>Login</span>
            </a>
            <a href="signup.html" class="btn-auth btn-auth--signup">
              <i class="fas fa-user-plus"></i>
              <span>Sign Up</span>
            </a>
          `;
        } else if (page === 'signup') {
          authSection.innerHTML = `
            <a href="login.html" class="btn-auth btn-auth--login">
              <i class="fas fa-sign-in-alt"></i>
              <span>Login</span>
            </a>
            <a href="signup.html" class="btn-auth btn-auth--signup btn-auth--active">
              <i class="fas fa-user-plus"></i>
              <span>Sign Up</span>
            </a>
          `;
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
     } else if (appPages.includes(page)) {
       // App pages - show full navigation
       if (nav) {
         nav.style.display = 'flex';
         // Ensure nav is visible on desktop
         if (window.innerWidth >= 768) {
           nav.style.display = 'flex';
         }
       }
       header.classList.remove('header--minimal');
       
       // Update auth section based on auth state
       if (authSection) {
         if (isAuthenticated && this.currentUser) {
           // Use profile picture if available, otherwise use placeholder
           const profilePicture = this.currentUser.profilePicture || 'assets/images/avatars/default-avatar.svg';
           authSection.innerHTML = `
             <div class="header__user-info">
               <img src="${profilePicture}" alt="User Avatar" class="avatar avatar--small" onerror="this.src='assets/images/avatars/default-avatar.svg'">
               <span class="user__name">${this.currentUser.name}</span>
             </div>
             <button class="btn-auth btn-auth--logout" id="logoutBtn">
               <i class="fas fa-sign-out-alt"></i>
               <span>Logout</span>
             </button>
           `;
           
           // Add logout event listener
           const logoutBtn = document.getElementById('logoutBtn');
           if (logoutBtn) {
             logoutBtn.addEventListener('click', () => this.handleLogout());
           }
           
           // Update admin nav link visibility
           this.updateAdminNavLink(this.isAdmin());
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
           
           // Hide admin nav link for non-authenticated users
           this.updateAdminNavLink(false);
         }
       }
     }
  },

  // Login user (with API token)
  login(user, token = null) {
    try {
      // Store user and token (ensure isAdmin field is included)
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      if (token) {
        // Store in both places for compatibility
        localStorage.setItem(this.STORAGE_KEYS.SESSION_TOKEN, token);
        if (typeof API !== 'undefined') {
          API.setToken(token);
        }
      }

      this.currentUser = user;
      this.isAuthenticated = true;
      console.log('User logged in, isAdmin:', user.isAdmin);

      // Update UI
      if (typeof App !== 'undefined') {
        App.currentUser = user;
      }

      return true;
    } catch (error) {
      console.error('Error logging in:', error);
      return false;
    }
  },

  // Logout user
  logout() {
    try {
      // Clear storage
      localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(this.STORAGE_KEYS.SESSION_TOKEN);

      this.currentUser = null;
      this.isAuthenticated = false;

      // Update UI
      if (typeof App !== 'undefined') {
        App.currentUser = null;
        // Force light mode when logged out
        App.applySettings();
      }

      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  },

  // Handle logout action
  handleLogout() {
    if (this.logout()) {
      // Show success message
      if (typeof App !== 'undefined' && App.showSuccessMessage) {
        App.showSuccessMessage('You have been logged out successfully.');
      }
      
      // Redirect to landing page
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    }
  },

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  },

  // Check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated;
  },

  // Update admin nav link visibility
  updateAdminNavLink(show) {
    const adminNavItem = document.getElementById('adminNavItem') || 
                         document.querySelector('.nav__item a[data-page="admin"]')?.closest('.nav__item');
    if (adminNavItem) {
      adminNavItem.style.display = show ? 'list-item' : 'none';
    }
  }
};

// Initialize auth when DOM is loaded - RUN FIRST
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize auth and route protection immediately
  await Auth.init();
});

