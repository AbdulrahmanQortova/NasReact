// src/services/examService.js
import { api } from './api';

class ExamService {
  // ========== Exams Services ==========

  async getAllExams() {
    return await api.get('/exams');
  }

  async getExamById(id) {
    return await api.get(`/exams/${id}`);
  }

  async getExamByCourse(courseId) {
    return await api.get(`/courses/${courseId}/exam`);
  }

  async createExam(examData) {
    return await api.post('/exams', examData);
  }

  async updateExam(id, examData) {
    return await api.put(`/exams/${id}`, examData);
  }

  async deleteExam(id) {
    return await api.delete(`/exams/${id}`);
  }
async getStandaloneExams() {
  const data = await api.get('/exams/standalone');
  return Array.isArray(data) ? data : data?.data || [];
}

async getAttemptStatus(examId) {
  return await api.get(`/exams/${examId}/attempt-status`);
}

async submitExam(examId, payload) {
  return await api.post(`/exams/${examId}/submit`, payload);
}
  // ========== Questions Services ==========

  async getQuestionsByExam(examId) {
    return await api.get(`/exams/${examId}/questions`);
  }

  async getQuestionById(examId, questionId) {
    return await api.get(`/exams/${examId}/questions/${questionId}`);
  }

  async createQuestion(questionData) {
    return await api.post(`/exams/${questionData.examId}/questions`, questionData);
  }

  async updateQuestion(examId, questionId, questionData) {
    return await api.put(`/exams/${examId}/questions/${questionId}`, questionData);
  }

  async deleteQuestion(examId, questionId) {
    console.log('🔴 Deleting question - Exam:', examId, 'Question:', questionId);
    try {
      const result = await api.delete(`/exams/${examId}/questions/${questionId}`);
      console.log('✅ Delete question result:', result);
      return result;
    } catch (error) {
      console.error('❌ Delete question error:', error);
      throw error;
    }
  }

  // ========== Answers Services ==========

  async getAnswersByQuestion(questionId) {
    return await api.get(`/questions/${questionId}/answers`);
  }

  async getAnswerById(questionId, answerId) {
    return await api.get(`/questions/${questionId}/answers/${answerId}`);
  }

  async createAnswer(questionId, answerData) {
    const payload = {
      text: answerData.text,
      isCorrect: answerData.isCorrect,
      questionId: answerData.questionId || questionId,
    };
    console.log('📤 Creating answer with payload:', payload);
    return await api.post(`/questions/${questionId}/answers`, payload);
  }

  async updateAnswer(questionId, answerId, answerData) {
    return await api.put(`/questions/${questionId}/answers/${answerId}`, answerData);
  }

  async deleteAnswer(questionId, answerId) {
    console.log('🔴 Deleting answer - Question:', questionId, 'Answer:', answerId);
    try {
      const result = await api.delete(`/questions/${questionId}/answers/${answerId}`);
      console.log('✅ Delete answer result:', result);
      return result;
    } catch (error) {
      console.error('❌ Delete answer error:', error);
      throw error;
    }
  }

  async setCorrectAnswer(questionId, answerId) {
    console.log('🔵 Setting correct answer - Question:', questionId, 'Answer:', answerId);
    try {
      const result = await api.post(`/questions/${questionId}/answers/set-correct/${answerId}`);
      console.log('✅ Set correct answer result:', result);
      return result;
    } catch (error) {
      console.error('❌ Set correct answer error:', error);
      throw error;
    }
  }
}

export const examService = new ExamService();