/**
 * Google Authentication Handler
 * Handles Google Sign-In integration with the application
 */

const GoogleAuth = {
  // Google API Configuration
  CLIENT_ID: 'AIzaSyDUuWBnoVr-_to79SFyo0tAPmJwEUFgr_o',
  isInitialized: false,

  // Initialize Google Sign-In
  init() {
    // Check if Google API is available
    if (!window.google || !window.google.accounts) {
      console.warn('Google API not yet loaded, retrying...');
      setTimeout(() => this.init(), 500);
      return;
    }

    // Only initialize once
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize Google Accounts with callback
      google.accounts.id.initialize({
        client_id: this.CLIENT_ID,
        callback: (response) => this.handleCredentialResponse(response),
        ux_mode: 'popup',
        auto_select: false
      });

      this.isInitialized = true;

      // Render buttons on appropriate pages
      if (document.getElementById('googleLoginContainer')) {
        this.renderLoginButton();
      }

      if (document.getElementById('googleSignupContainer')) {
        this.renderSignupButton();
      }
    } catch (error) {
      console.error('Error initializing Google Auth:', error);
    }
  },

  // Render Google Login button
  renderLoginButton() {
    const loginContainer = document.getElementById('googleLoginContainer');
    if (!loginContainer) return;

    try {
      google.accounts.id.renderButton(
        loginContainer,
        {
          type: 'standard',
          size: 'large',
          width: '100%',
          theme: 'outline',
          text: 'signin',
          locale: 'en'
        }
      );
    } catch (error) {
      console.error('Error rendering Google Login button:', error);
    }
  },

  // Render Google Signup button
  renderSignupButton() {
    const signupContainer = document.getElementById('googleSignupContainer');
    if (!signupContainer) return;

    try {
      google.accounts.id.renderButton(
        signupContainer,
        {
          type: 'standard',
          size: 'large',
          width: '100%',
          theme: 'outline',
          text: 'signup',
          locale: 'en'
        }
      );
    } catch (error) {
      console.error('Error rendering Google Signup button:', error);
    }
  },

  // Handle Google credential response
  handleCredentialResponse(response) {
    try {
      if (!response || !response.credential) {
        throw new Error('No credential received from Google');
      }

      // Decode JWT token from Google
      const credential = response.credential;
      const parts = credential.split('.');

      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }

      // Decode payload
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      // Handle padding
      const padLength = 4 - (base64.length % 4);
      const padded = padLength !== 4 ? base64 + '='.repeat(padLength) : base64;

      let jsonPayload;
      try {
        const decoded = atob(padded);
        jsonPayload = JSON.parse(decoded);
      } catch (e) {
        throw new Error('Failed to decode JWT: ' + e.message);
      }

      // Create user object from Google data
      const user = {
        id: jsonPayload.sub,
        email: jsonPayload.email,
        name: jsonPayload.name || 'User',
        picture: jsonPayload.picture || null,
        authProvider: 'google',
        verified: jsonPayload.email_verified || false,
        createdAt: new Date().toISOString()
      };

      // Show loading state
      this.showLoadingState('Processing Google authentication...');

      // Authenticate the user
      if (Auth && typeof Auth.login === 'function') {
        const loginSuccess = Auth.login(user);

        if (loginSuccess) {
          // Show success message
          if (typeof App !== 'undefined' && typeof App.showSuccessMessage === 'function') {
            App.showSuccessMessage(`Welcome back, ${user.name}!`);
          }

          // Redirect to dashboard after brief delay
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1500);
        } else {
          throw new Error('Failed to login user');
        }
      } else {
        throw new Error('Auth module not available');
      }
    } catch (error) {
      console.error('Error handling Google credential:', error);

      // Clear loading state
      this.clearLoadingState();

      // Show error message
      const errorMsg = 'Google authentication failed. Please try again. Error: ' + error.message;
      if (typeof App !== 'undefined' && typeof App.showError === 'function') {
        App.showError(errorMsg);
      } else {
        alert(errorMsg);
      }
    }
  },

  // Show loading state
  showLoadingState(message) {
    const overlay = document.createElement('div');
    overlay.id = 'googleAuthLoading';
    overlay.className = 'google-auth-loading';
    overlay.innerHTML = `
      <div class="google-auth-loading-content">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  // Clear loading state
  clearLoadingState() {
    const overlay = document.getElementById('googleAuthLoading');
    if (overlay) {
      overlay.remove();
    }
  }
};

// Initialize Google Auth when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    GoogleAuth.init();
  });
} else {
  // DOM already loaded
  GoogleAuth.init();
}
