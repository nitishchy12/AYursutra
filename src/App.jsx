import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Remedies from './pages/Remedies';
import DoshaTest from './pages/DoshaTest';
import Chat from './pages/Chat';
import Community from './pages/Community';
import DietPlan from './pages/DietPlan';
import Therapy from './pages/Therapy';
import Appointments from './pages/Appointments';
import SessionCenters from './pages/SessionCenters';
import Notifications from './pages/Notifications';
import Feedback from './pages/Feedback';
import PatientDetails from './pages/PatientDetails';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main>
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Routes */}
            <Route path="/remedies" element={
              <ProtectedRoute>
                <Remedies />
              </ProtectedRoute>
            } />
            <Route path="/dosha-test" element={
              <ProtectedRoute>
                <DoshaTest />
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            } />
            <Route path="/therapy" element={
              <ProtectedRoute>
                <Therapy />
              </ProtectedRoute>
            } />
            <Route path="/centers" element={
              <ProtectedRoute>
                <SessionCenters />
              </ProtectedRoute>
            } />
            <Route path="/appointments" element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/diet-plan" element={
              <ProtectedRoute>
                <DietPlan />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/patients/:id" element={
              <ProtectedRoute role="practitioner">
                <PatientDetails />
              </ProtectedRoute>
            } />
            <Route path="/feedback" element={
              <ProtectedRoute role="patient">
                <Feedback />
              </ProtectedRoute>
            } />
          </Routes>
          </ErrorBoundary>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
