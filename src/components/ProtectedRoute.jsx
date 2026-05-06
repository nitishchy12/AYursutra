import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleMap = { Patient: 'patient', Practitioner: 'practitioner', Admin: 'admin' };

const ProtectedRoute = ({ children, role }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  if (!currentUser) return <Navigate to="/login" replace state={{ from: location }} />;
  const expected = roleMap[role] || role;
  if (expected && currentUser.role !== expected) return <Navigate to="/dashboard" replace />;
  return children;
};

export default ProtectedRoute;
export const PrivateRoute = ProtectedRoute;
