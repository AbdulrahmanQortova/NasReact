// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Courses from './pages/Courses/Courses';
import CourseDetailsPage from './pages/Courses/CourseDetailsPage';
import PaymentPage from './pages/Payment/PaymentPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import CourseDetails from './pages/Admin/CourseDetails';
import Community from './pages/Community/Community';
import SinglePost from './pages/Community/SinglePost';
import ProfilePage from './pages/Profile/ProfilePage';
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
  
  const userStr = localStorage.getItem('user_data');
  const user = userStr ? JSON.parse(userStr) : null;
  
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
          {/* Home page */}
          <Route path="/" element={<Home />} />
          
          {/* Public routes */}
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetailsPage />} />
          <Route path="/payment/:id" element={<PaymentPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes - User */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div style={{ padding: '40px' }}>Dashboard Page</div>
            </ProtectedRoute>
          } />
          
          {/* ✅ Community Page - Protected */}
          <Route path="/community" element={
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          } />
          <Route path="/community/post/:postId" element={
  <ProtectedRoute>
    <SinglePost />
  </ProtectedRoute>
} />
          <Route path="/exams" element={
            <ProtectedRoute>
              <div style={{ padding: '40px' }}>Exams Page</div>
            </ProtectedRoute>
          } />
          
<Route path="/profile" element={
  <ProtectedRoute>
    <ProfilePage />
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