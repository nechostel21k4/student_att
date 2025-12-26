import { useState, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// Lazy Load Pages to reduce initial bundle size
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RegisterFace = lazy(() => import('./pages/RegisterFace'));
const AttendanceCamera = lazy(() => import('./pages/AttendanceCamera'));
const StudentLayout = lazy(() => import('./components/StudentLayout'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const StudentLeave = lazy(() => import('./pages/StudentLeave'));
const StudentHistory = lazy(() => import('./pages/StudentHistory'));
const StudentIncharge = lazy(() => import('./pages/StudentIncharge'));
const StudentComplaint = lazy(() => import('./pages/StudentComplaint'));
const StudentRoomies = lazy(() => import('./pages/StudentRoomies'));
const LastRequest = lazy(() => import('./pages/LastRequest'));

const PermissionGuard = lazy(() => import('./components/PermissionGuard'));

// Loading Fallback Component
const PageLoader = () => (
  <div style={{
    height: '100vh', width: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white'
  }}>
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes with Navigation Layout */}
          <Route element={
            <PermissionGuard>
              <StudentLayout />
            </PermissionGuard>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register-face" element={<RegisterFace />} />
            <Route path="/attendance" element={<AttendanceCamera />} />
            <Route path="/profile" element={<StudentProfile />} />
            <Route path="/leave" element={<StudentLeave />} />
            <Route path="/history" element={<StudentHistory />} />
            <Route path="/incharge" element={<StudentIncharge />} />
            <Route path="/complaint" element={<StudentComplaint />} />
            <Route path="/last-request" element={<LastRequest />} />
            <Route path="/roomies" element={<StudentRoomies />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
