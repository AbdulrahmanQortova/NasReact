
import { api } from './api';
import { authService } from './authService';

class UserService {

  async getProfile() {
    return await api.get('/Users/profile');
  }

  
  async getById(id) {
    return await api.get(`/Users/${id}`);
  }


  async updateProfile(profileData, isFormData = false) {
    const result = await api.post('/Users/profile', profileData, isFormData);
    

    if (result.user) {
      authService.updateCurrentUser(result.user);
    }
    
    return result;
  }


  async changePassword(passwordData) {
    return await api.post('/Auth/change-password', passwordData);
  }


  async deleteAccount(password) {
    return await api.post('/Auth/delete-account', { password });
  }


  async getAllUsers(page = 1, pageSize = 10, search = '') {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('pageSize', pageSize);
    if (search) queryParams.append('search', search);
    
    return await api.get(`/Admin/users?${queryParams.toString()}`);
  }


  async changeUserRole(userId, role) {
    return await api.put(`/Admin/users/${userId}/role`, { role });
  }

  async banUser(userId, reason) {
    return await api.post(`/Admin/users/${userId}/ban`, { reason });
  }
}

export const userService = new UserService();