import AuthModel from '../models/auth-model';

class RegisterPresenter {
  constructor({ view }) {
    this._view = view;
    this._authModel = AuthModel;
  }
  
  async register(name, email, password) {
    this._view.showLoading();
    
    try {
      const response = await this._authModel.register(name, email, password);
      
      if (response.error) {
        // Ubah: Delegasikan tampilan toast ke view
        this._view.showToast(`Registration failed: ${response.message}`);
        return false;
      } else {
        // Ubah: Delegasikan tampilan toast ke view
        this._view.showToast('Registration successful! Please login.');
        return true;
      }
    } catch (error) {
      // Ubah: Delegasikan tampilan toast ke view
      this._view.showToast(`Error: ${error.message}`);
      console.error('Error registering:', error);
      return false;
    } finally {
      this._view.hideLoading();
    }
  }
}

export default RegisterPresenter;