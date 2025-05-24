import RegisterPresenter from '../../presenters/register-presenter';
import LoadingInitiator from '../../utils/loading-initiator';
import NotificationHelper from '../../utils/notification-helper';

const RegisterPage = {
  async render() {
    return `
      <div class="form-container">
        <h2 class="form-title">Register</h2>
        
        <form id="registerForm">
          <div class="form-group">
            <label for="name" class="form-label">Full Name</label>
            <input type="text" id="name" class="form-input" placeholder="Your full name" required>
          </div>
          
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input type="email" id="email" class="form-input" placeholder="your.email@example.com" required>
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input type="password" id="password" class="form-input" placeholder="Minimum 8 characters" required minlength="8">
          </div>
          
          <div class="form-group">
            <label for="confirmPassword" class="form-label">Confirm Password</label>
            <input type="password" id="confirmPassword" class="form-input" placeholder="Repeat your password" required minlength="8">
          </div>
          
          <div class="form-group">
            <button type="submit" class="form-button">Register</button>
          </div>
        </form>
        
        <p class="form-footer">
          Already have an account? <a href="#/login">Login</a>
        </p>
      </div>
    `;
  },

  async afterRender() {
    // Inisialisasi presenter
    this._presenter = new RegisterPresenter({
      view: this,
    });
    
    const form = document.querySelector('#registerForm');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const password = document.querySelector('#password').value;
      const confirmPassword = document.querySelector('#confirmPassword').value;
      
      if (password !== confirmPassword) {
        NotificationHelper.showToast('Passwords do not match');
        return;
      }
      
      const name = document.querySelector('#name').value;
      const email = document.querySelector('#email').value;
      
      const success = await this._presenter.register(name, email, password);
      
      if (success) {
        window.location.href = '#/login';
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

export default RegisterPage;