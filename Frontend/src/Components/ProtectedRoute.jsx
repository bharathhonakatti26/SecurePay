import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const isLoggedIn = localStorage.getItem('isLoggedIn'); // Check if the user is logged in

  if (!isLoggedIn) {
    // If not logged in, redirect to the login page
    return <Navigate to="/login" />;
  }

  // If logged in, render the children (protected content)
  return children;
}

export default ProtectedRoute;