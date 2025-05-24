import LoginPresenter from '../../presenters/login-presenter';
import LoadingInitiator from '../../utils/loading-initiator';
import NotificationHelper from '../../utils/notification-helper';

const LoginPage = {
  async render() {
    return `
      <div class="form-container">
        <h2 class="form-title">Login</h2>
        
        <form id="loginForm">
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input type="email" id="email" class="form-input" placeholder="your.email@example.com" required>
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input type="password" id="password" class="form-input" placeholder="Your password" required>
          </div>
          
          <div class="form-group">
            <button type="submit" class="form-button">Login</button>
          </div>
        </form>
        
        <p class="form-footer">
          Don't have an account? <a href="#/register">Register</a>
        </p>
      </div>
    `;
  },

  async afterRender() {
    // Inisialisasi presenter
    this._presenter = new LoginPresenter({
      view: this,
    });
    
    const form = document.querySelector('#loginForm');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.querySelector('#email').value;
      const password = document.querySelector('#password').value;
      
      const success = await this._presenter.login(email, password);
      
      if (success) {
        window.location.href = '#/home';
      }
    });
  },
  
  // View methods
  showLoading() {
    LoadingInitiator.showLoading();
  },
  
  hideLoading() {
    LoadingInitiator.hideLoading();
  },

   showToast(message) {
    NotificationHelper.showToast(message);
  }
};

export default LoginPage;