// src/services/learningPathService.js
import { api } from './api';

class LearningPathService {
  // ========== Learning Paths Services ==========
  
  async getAll(params = {}) {
    // ✅ تصحيح المسار: learning-paths (بشرطة) وليس LearningPaths
    return await api.get('/learning-paths');
  }

  async getById(id) {
    return await api.get(`/learning-paths/${id}`);
  }

  async create(data) {
    return await api.post('/learning-paths', data);
  }

  async update(id, data) {
    return await api.put(`/learning-paths/${id}`, data);
  }

  async delete(id) {
    return await api.delete(`/learning-paths/${id}`);
  }

  // ========== Steps Services ==========
  
  async getSteps(pathId) {
    return await api.get(`/learning-paths/${pathId}/steps`);
  }

  async addStep(pathId, stepData) {
    return await api.post(`/learning-paths/${pathId}/steps`, stepData);
  }

  async updateStep(pathId, stepId, stepData) {
    return await api.put(`/learning-paths/${pathId}/steps/${stepId}`, stepData);
  }

  async removeStep(pathId, stepId) {
    return await api.delete(`/learning-paths/${pathId}/steps/${stepId}`);
  }
}

export const learningPathService = new LearningPathService();