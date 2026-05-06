import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleMap = { Patient: 'patient', Practitioner: 'practitioner', Admin: 'admin' };

const ProtectedRoute = ({ children, role }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  const expected = roleMap[role] || role;
  if (expected && currentUser.role !== expected) return <Navigate to="/dashboard" replace />;
  return children;
};

export default ProtectedRoute;
export const PrivateRoute = ProtectedRoute;
