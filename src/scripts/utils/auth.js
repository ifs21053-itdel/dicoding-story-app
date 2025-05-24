const Auth = {
  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    }
  },

  getToken() {
    try {
      const token = localStorage.getItem('token');
      
      // PERBAIKAN: Validasi token sebelum mengembalikannya
      if (!token || token === 'undefined' || token === 'null') {
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  getUser() {
    try {
      const userString = localStorage.getItem('user');
      if (!userString || userString === 'undefined' || userString === 'null') {
        return null;
      }
      
      return JSON.parse(userString);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  isLoggedIn() {
    return Boolean(this.getToken());
  },

  logout() {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },
};

export default Auth;