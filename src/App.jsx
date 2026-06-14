// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Courses from './pages/Courses/Courses';
import AdminDashboard from './pages/Admin/AdminDashboard';
import CourseDetails from './pages/Admin/CourseDetails';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('auth_token');
  const expiry = localStorage.getItem('token_expiry');
  
  if (!isAuthenticated || (expiry && new Date().getTime() > parseInt(expiry))) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('auth_token');
  const expiry = localStorage.getItem('token_expiry');
  
  if (!isAuthenticated || (expiry && new Date().getTime() > parseInt(expiry))) {
    return <Navigate to="/login" replace />;
  }
  
  // استخدام authService للتحقق من صلاحيات الأدمن
  const userStr = localStorage.getItem('user_data');
  const user = userStr ? JSON.parse(userStr) : null;
  
  // التحقق من الأدمن (يدعم الرقم 1 والنص 'Admin')
  const isAdmin = user?.role === 'Admin' || 
                  user?.role === 1 || 
                  user?.roleValue === 1 ||
                  user?.userRole === 1;
  
  if (!isAdmin) {
    return <Navigate to="/courses" replace />;
  }
  
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main id="main" tabIndex={-1}>
        <Routes>
          {/* Redirect root to courses */}
          <Route path="/" element={<Navigate to="/courses" replace />} />
          
          {/* Public routes */}
          <Route path="/courses" element={<Courses />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes - User */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div style={{ padding: '40px' }}>Dashboard Page</div>
            </ProtectedRoute>
          } />
          
          <Route path="/live" element={
            <ProtectedRoute>
              <div style={{ padding: '40px' }}>Live Page</div>
            </ProtectedRoute>
          } />
          
          <Route path="/community" element={
            <ProtectedRoute>
              <div style={{ padding: '40px' }}>Community Page</div>
            </ProtectedRoute>
          } />
          
          <Route path="/exams" element={
            <ProtectedRoute>
              <div style={{ padding: '40px' }}>Exams Page</div>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <div style={{ padding: '40px' }}>Profile Page</div>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <div style={{ padding: '40px' }}>Settings Page</div>
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          
          {/* 👈 Course Details Route - View and Manage Sections */}
          <Route path="/admin/courses/:id" element={
            <AdminRoute>
              <CourseDetails />
            </AdminRoute>
          } />
          
          <Route path="/admin/courses/:id/edit" element={
            <AdminRoute>
              <div style={{ padding: '40px' }}>Edit Course Page</div>
            </AdminRoute>
          } />
          
          <Route path="/admin/topics" element={
            <AdminRoute>
              <div style={{ padding: '40px' }}>Topics Management Page</div>
            </AdminRoute>
          } />
          
          <Route path="/admin/users" element={
            <AdminRoute>
              <div style={{ padding: '40px' }}>Manage Users Page</div>
            </AdminRoute>
          } />
        </Routes>
      </main>
    </BrowserRouter>
  );
}