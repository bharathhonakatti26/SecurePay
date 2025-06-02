import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar'; // Import the Navbar component
import './dashboard.css'; // Reuse the same CSS for styling

function Layout() {
  return (
    <div className="dashboard-layout">
      <Navbar /> {/* Common Navbar */}
      <div className="dashboard-content">
        <Outlet /> {/* Render the current page's content dynamically */}
      </div>
    </div>
  );
}

export default Layout;