/**
 * Google Authentication Handler
 * Handles Google OAuth Sign-In integration
 */

const GoogleAuth = {
  isInitialized: false,

  // Initialize Google Sign-In
  async init() {
    if (this.isInitialized) return;

    try {
      // Check if we're on login/signup page
      const isAuthPage = window.location.pathname.includes('login.html') || 
                        window.location.pathname.includes('signup.html');
      
      if (!isAuthPage) return;

      // Get Google OAuth URL from backend
      if (typeof API !== 'undefined') {
        try {
          const apiBaseUrl = API.baseURL || window.location.origin;
          const response = await fetch(`${apiBaseUrl}/api/auth/google`);
          const data = await response.json();
          
          if (data.authUrl) {
            this.setupGoogleButton(data.authUrl);
            this.isInitialized = true;
          }
        } catch (error) {
          console.error('Error initializing Google Auth:', error);
        }
      }
    } catch (error) {
      console.error('Error in Google Auth init:', error);
    }
  },

  // Setup Google Sign-In button
  setupGoogleButton(authUrl) {
    const loginContainer = document.getElementById('googleLoginContainer');
    const signupContainer = document.getElementById('googleSignupContainer');

    const buttonHTML = `
      <button type="button" class="btn btn--google" id="googleSignInBtn">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/>
          <path d="M9 18C11.43 18 13.467 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65454 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
          <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40681 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
          <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65454 3.57955 9 3.57955Z" fill="#EA4335"/>
        </svg>
        <span>Continue with Google</span>
      </button>
    `;

    if (loginContainer) {
      loginContainer.innerHTML = buttonHTML;
      const btn = document.getElementById('googleSignInBtn');
      if (btn) {
        btn.addEventListener('click', () => this.handleGoogleSignIn(authUrl));
      }
    }

    if (signupContainer) {
      signupContainer.innerHTML = buttonHTML;
      const btn = signupContainer.querySelector('#googleSignInBtn');
      if (btn) {
        btn.addEventListener('click', () => this.handleGoogleSignIn(authUrl));
      }
    }
  },

  // Handle Google Sign-In
  handleGoogleSignIn(authUrl) {
    // Redirect to Google OAuth
    window.location.href = authUrl;
  },

  // Handle OAuth callback (when redirected back from Google)
  async handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    const googleAuth = urlParams.get('googleAuth');

    console.log('Google OAuth callback triggered');
    console.log('URL params:', { token: token ? 'present' : 'missing', error, googleAuth });

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

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (token && googleAuth === 'true') {
      console.log('Processing OAuth token...');
      
      // Store token
      if (typeof API !== 'undefined' && API.setToken) {
        API.setToken(token);
      }
      
      // Store in localStorage
      localStorage.setItem('sessionToken', token);

      // Get user info
      try {
        if (typeof API !== 'undefined' && API.verifyToken) {
          console.log('Verifying token with API...');
          const response = await API.verifyToken();
          console.log('Token verification response:', response);
          
          if (response && response.user) {
            console.log('User verified, logging in...');
            // Login user
            if (typeof Auth !== 'undefined' && Auth.login) {
              Auth.login(response.user, token);
              
              // Show success message
              if (typeof App !== 'undefined' && App.showSuccessMessage) {
                App.showSuccessMessage(`Welcome, ${response.user.name || 'User'}!`);
              }

              // Redirect to dashboard
              console.log('Redirecting to dashboard...');
              setTimeout(() => {
                window.location.href = 'dashboard.html';
              }, 1000);
            }
          } else {
            console.error('Token verification failed - no user in response');
          }
        } else {
          console.error('API.verifyToken not available');
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        if (typeof App !== 'undefined' && App.showError) {
          App.showError('Failed to complete authentication. Please try again.');
        }
      }

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
};

// Initialize on page load - wait for API to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit for API to initialize
    await new Promise(resolve => setTimeout(resolve, 200));
    await GoogleAuth.init();
    GoogleAuth.handleCallback();
  });
} else {
  // Wait a bit for API to initialize
  setTimeout(async () => {
    await GoogleAuth.init();
    GoogleAuth.handleCallback();
  }, 200);
}
