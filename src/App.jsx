import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterFace from './pages/RegisterFace';
import AttendanceCamera from './pages/AttendanceCamera';
import StudentLayout from './components/StudentLayout';
import StudentProfile from './pages/StudentProfile';
import StudentLeave from './pages/StudentLeave';
import StudentHistory from './pages/StudentHistory';
import StudentIncharge from './pages/StudentIncharge';
import StudentComplaint from './pages/StudentComplaint';
import StudentRoomies from './pages/StudentRoomies';
import LastRequest from './pages/LastRequest';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Protected Routes with Navigation Layout */}
        <Route element={<StudentLayout />}>
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
    </BrowserRouter>
  )
}

export default App
