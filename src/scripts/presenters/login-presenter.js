import AuthModel from '../models/auth-model';
import Auth from '../utils/auth';

class LoginPresenter {
  constructor({ view }) {
    this._view = view;
    this._authModel = AuthModel;
  }
  
  async login(email, password) {
    this._view.showLoading();
    
    try {
      const response = await this._authModel.login(email, password);
      
      if (response.error) {
        // Ubah: Delegasikan tampilan toast ke view
        this._view.showToast(`Login failed: ${response.message}`);
        return false;
      } else {
        // Simpan token dan info user
        Auth.setToken(response.loginResult.token);
        Auth.setUser({
          id: response.loginResult.userId,
          name: response.loginResult.name,
        });
        
        // Ubah: Delegasikan tampilan toast ke view
        this._view.showToast(`Welcome, ${response.loginResult.name}!`);
        return true;
      }
    } catch (error) {
      // Ubah: Delegasikan tampilan toast ke view
      this._view.showToast(`Error: ${error.message}`);
      console.error('Error logging in:', error);
      return false;
    } finally {
      this._view.hideLoading();
    }
  }
}

export default LoginPresenter;