// src/services/authService.js
import { api } from './api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const TOKEN_EXPIRY_KEY = 'token_expiry';

class AuthService {
  async login(email, password) {
    try {
      const result = await api.post('/Auth/login', { email, password });
      
      console.log('Login API response:', result);
      
      if (result.token) {
        this.setToken(result.token);
      if (result.refreshToken) {
        localStorage.setItem('refresh_token', result.refreshToken);
}

      }
      
    
      const roleValue = result.role ?? result.userRole ?? (email === 'admin@localhost.com' ? 1 : 0);
      

      let roleName = 'Student';
      if (roleValue === 1 || roleValue === '1' || roleValue === 'Admin') {
        roleName = 'Admin';
      }
      
      const userData = {
        id: result.userId,
        firstName: result.firstName || (roleName === 'Admin' ? 'Admin' : 'User'),
        lastName: result.lastName || '',
        email: result.email || email,
        role: roleName,      
        roleValue: roleValue, 
        profilePictureUrl: result.profilePictureUrl,
      };
      
      console.log('Saving user data:', userData);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      window.dispatchEvent(new Event('auth:login'));
      return result;
    } catch (error) {
      console.error('Login service error:', error);
      throw error;
    }
  }

  async register(userData) {
    const formData = new FormData();
    formData.append('FirstName', userData.firstName.trim());
    formData.append('LastName', userData.lastName.trim());
    formData.append('Email', userData.email.trim().toLowerCase());
    formData.append('Password', userData.password);
    formData.append('ConfirmPassword', userData.confirmPassword);
    formData.append('Bio', userData.bio || '');
    
    if (userData.profileImage) {
      formData.append('ProfileImage', userData.profileImage);
    }

    const result = await api.post('/Auth/register', formData, true);
    
    if (result.token) {
      this.setToken(result.token);
    }
    
    const roleValue = result.role ?? result.userRole ?? 0;
    let roleName = roleValue === 1 ? 'Admin' : 'Student';
    
    localStorage.setItem(USER_KEY, JSON.stringify({
      id: result.userId,
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email,
      role: roleName,
      roleValue: roleValue,
    }));
    
    return result;
  }

  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
    const expiry = new Date().getTime() + (24 * 60 * 60 * 1000);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
  }

logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem('refresh_token');
  window.dispatchEvent(new Event('auth:logout'));
}

  isAuthenticated() {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token) return false;
    if (expiry && new Date().getTime() > parseInt(expiry)) {
      this.logout();
      return false;
    }
    return true;
  }

  getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      console.log('Current user from storage:', user);
      return user;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

 
  isAdmin() {
    const user = this.getCurrentUser();
    if (!user) return false;
    

    const isAdmin = 
      user.role === 'Admin' ||           
      user.role === 1 ||                
      user.roleValue === 1 ||            
      user.roleValue === '1' ||         
      user.userRole === 1 ||            
      user.userRole === 'Admin';      
    
    console.log('Is admin check - User role:', user.role, 'Role value:', user.roleValue, 'Result:', isAdmin);
    return isAdmin;
  }

  isStudent() {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const isStudent = 
      user.role === 'Student' ||
      user.role === 0 ||
      user.roleValue === 0 ||
      user.roleValue === '0' ||
      user.userRole === 0 ||
      user.userRole === 'Student';
    
    return isStudent;
  }

  hasRole(role) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    if (role === 'Admin') {
      return this.isAdmin();
    }
    if (role === 'Student') {
      return this.isStudent();
    }
    
    return false;
  }
}

export const authService = new AuthService();