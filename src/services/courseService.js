// src/services/courseService.js
import { api } from './api';

const API_BASE_URL = 'https://localhost:7021/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      if (errorData.errors) {
        const validationErrors = Object.values(errorData.errors).flat();
        errorMessage = validationErrors.join(', ');
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.title) {
        errorMessage = errorData.title;
      }
    } catch (e) {
      // Keep default message
    }
    throw new Error(errorMessage);
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
};

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

// src/services/courseService.js

async rateCourse(id, ratingData) {
  const payload = {
    value: Number(ratingData.value ?? ratingData.rating ?? 0),
    review: ratingData.review ?? ratingData.comment ?? ''
  };
  
  console.log('Sending rating payload:', payload); 
  
  return await api.post(`/Courses/${id}/ratings`, payload);
}
  async uploadThumbnail(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE_URL}/Courses/${id}/thumbnail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    return handleResponse(response);
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

  // src/services/courseService.js

// ========== Sections Services ==========

async getCourseSections(courseId) {
  return await api.get(`/Courses/${courseId}/sections`);
}

async getSectionById(courseId, sectionId) {
  return await api.get(`/Courses/${courseId}/sections/${sectionId}`);
}

async createCourseSection(courseId, sectionData) {
  return await api.post(`/Courses/${courseId}/sections`, sectionData);
}

async updateCourseSection(courseId, sectionId, sectionData) {
  const cleanData = {};
  if (sectionData.title) cleanData.title = sectionData.title;
  if (sectionData.order && sectionData.order > 0) cleanData.order = sectionData.order;
  
  return await api.put(`/Courses/${courseId}/sections/${sectionId}`, cleanData);
}

async deleteCourseSection(courseId, sectionId) {
  const response = await api.delete(`/Courses/${courseId}/sections/${sectionId}`);
  return response;
}


// ========== Lessons Services ==========

async getLessons(sectionId) {
  return await api.get(`/sections/${sectionId}/lessons`);
}

async getLessonById(sectionId, lessonId) {
  return await api.get(`/sections/${sectionId}/lessons/${lessonId}`);
}

async createLesson(sectionId, lessonData) {
  return await api.post(`/sections/${sectionId}/lessons`, lessonData);
}

async updateLesson(sectionId, lessonId, lessonData) {
  return await api.put(`/sections/${sectionId}/lessons/${lessonId}`, lessonData);
}

async deleteLesson(sectionId, lessonId) {
  return await api.delete(`/sections/${sectionId}/lessons/${lessonId}`);
}
async reorderLessons(sectionId, orders) {
  return await api.post(`/sections/${sectionId}/lessons/reorder`, orders);
}
// ========== Enrollment Services ==========

async enrollInCourse(courseId) {
  return await api.post(`/Enrollments/enroll/${courseId}`);
}

async unenrollFromCourse(courseId) {
  return await api.delete(`/Enrollments/unenroll/${courseId}`);
}

async getMyEnrollments() {
  return await api.get('/Enrollments/my-enrollments');
}

async getMyEnrollment(courseId) {
  return await api.get(`/Enrollments/my-enrollments/${courseId}`);
}
}


export const courseService = new CourseService();