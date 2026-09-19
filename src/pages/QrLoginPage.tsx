import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Legacy QR Login route. Redirects to /login where QrLoginPanel is integrated.
 * All duplicated Supabase client code removed per Task 4.
 */
export const QrLoginPage: React.FC = () => {
  return <Navigate to="/login" replace />;
};

export default QrLoginPage;
