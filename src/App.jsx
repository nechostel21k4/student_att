import { useState, useEffect, Suspense, lazy } from 'react'
import { Toaster, toast } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StudentProvider } from './context/StudentContext';
import { Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import PullToRefresh from './components/Shared/PullToRefresh';
import PageLoader from './components/Shared/PageLoader';

// Lazy Load Pages to reduce initial bundle size
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const StudentForgotPassword = lazy(() => import('./pages/StudentForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RegisterFace = lazy(() => import('./pages/RegisterFace'));
const AttendanceCamera = lazy(() => import('./pages/AttendanceCamera'));
const StudentLayout = lazy(() => import('./components/StudentLayout'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const StudentLeave = lazy(() => import('./pages/StudentLeave'));
const StudentHistory = lazy(() => import('./pages/StudentHistory'));
const StudentIncharge = lazy(() => import('./pages/StudentIncharge'));
const StudentComplaint = lazy(() => import('./pages/StudentComplaint'));
const StudentAnnouncements = lazy(() => import('./pages/StudentAnnouncements'));
const StudentRoomies = lazy(() => import('./pages/StudentRoomies'));
const LastRequest = lazy(() => import('./pages/LastRequest'));

const FeesCost = lazy(() => import('./pages/FeesCost'));
const VerifyRequest = lazy(() => import('./pages/VerifyRequest'));
const FoodScanner = lazy(() => import('./pages/FoodScanner'));


const PermissionGuard = lazy(() => import('./components/PermissionGuard'));

// Loading Fallback Component

function App() {
  useEffect(() => {
    const handleOnline = () => {
      toast.success('Back Online', {
        icon: <Wifi size={20} color="#22c55e" />,
      });
    };

    const handleOffline = () => {
      toast.error('You are Offline', {
        icon: <WifiOff size={20} color="#ef4444" />,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <BrowserRouter>
      <StudentProvider>
        <Toaster 
          position="top-center" 
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(15, 23, 42, 0.9)',
              color: '#fff',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            },
            success: {
              style: {
                border: '1px solid rgba(34, 197, 94, 0.3)',
                background: 'rgba(15, 23, 42, 0.95)',
              },
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              style: {
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(15, 23, 42, 0.95)',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <PullToRefresh>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<StudentForgotPassword />} />

              <Route path="/verify-request/:requestId" element={<VerifyRequest />} />

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
                <Route path="/announcement" element={<StudentAnnouncements />} />
                <Route path="/last-request" element={<LastRequest />} />
                <Route path="/roomies" element={<StudentRoomies />} />
                <Route path="/fees-cost" element={<FeesCost />} />
                <Route path="/food" element={<FoodScanner />} />
                <Route path="/food/:view" element={<FoodScanner />} />
                <Route path="/food-scanner" element={<Navigate to="/food" replace />} />

              </Route>
            </Routes>
          </Suspense>
        </PullToRefresh>
      </StudentProvider>
    </BrowserRouter>
  )
}

export default App
