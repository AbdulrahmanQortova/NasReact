// src/services/courseService.js
import { api } from './api';

class CourseService {
  // ========== Courses Services ==========
  
  async getAll(params = {}) {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      topicId = '',
      sortBy = '',
      ascending = true,
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('pageSize', pageSize);
    if (search) queryParams.append('search', search);
    if (topicId) queryParams.append('topicId', topicId);
    if (sortBy) queryParams.append('sortBy', sortBy);
    queryParams.append('ascending', ascending);

    return await api.get(`/Courses?${queryParams.toString()}`);
  }

  async getById(id) {
    return await api.get(`/Courses/${id}`);
  }

async create(courseData) {
  console.log('Creating course with data:', courseData);
  return await api.post('/Courses', courseData);
}
  async update(id, courseData) {
    return await api.put(`/Courses/${id}`, courseData);
  }

  async delete(id) {
    return await api.delete(`/Courses/${id}`);
  }

  async rateCourse(id, ratingData) {
    return await api.post(`/Courses/${id}/ratings`, ratingData);
  }

  async uploadThumbnail(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    return await api.post(`/Courses/${id}/thumbnail`, formData, true);
  }

  async getRatings(id, page = 1, pageSize = 20) {
    return await api.get(`/Courses/${id}/ratings?page=${page}&pageSize=${pageSize}`);
  }

  // ========== Topics Services ==========
  
  async getAllTopics() {
    return await api.get('/Topics');
  }

  async getTopicById(id) {
    return await api.get(`/Topics/${id}`);
  }

  async createTopic(topicData) {
    return await api.post('/Topics', topicData);
  }

  async updateTopic(id, topicData) {
    return await api.put(`/Topics/${id}`, topicData);
  }

  async deleteTopic(id) {
    return await api.delete(`/Topics/${id}`);
  }

  async uploadTopicIcon(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    return await api.post(`/Topics/${id}/icon`, formData, true);
  }
}

export const courseService = new CourseService();