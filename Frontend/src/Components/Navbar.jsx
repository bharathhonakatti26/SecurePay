import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaTachometerAlt,
  FaCreditCard,
  FaExchangeAlt,
  FaChartBar,
  FaHeadset,
  FaUser,
  FaSignOutAlt,
} from 'react-icons/fa'; // Import icons
import './dashboard.css'; // Reuse the same CSS for styling

function Navbar() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar is closed by default

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn'); // Clear login flag
    localStorage.removeItem('mobile'); // Clear mobile number
    navigate('/login'); // Redirect to login
  };

  const menuItems = [
    { name: 'Dashboard', icon: <FaTachometerAlt />, onClick: () => navigate('/dashboard') },
    { name: 'Cards', icon: <FaCreditCard />, onClick: () => navigate('/cards') },
    { name: 'Transaction History', icon: <FaExchangeAlt />, onClick: () => navigate('/transaction-history') }, // Add Transaction History
    { name: 'fraud-report', icon: <FaChartBar />, onClick: () => navigate('/fraud-report') },
  ];

  const bottomMenuItems = [
    { name: 'Support', icon: <FaHeadset />, onClick: () => navigate('/support') },
    {
      name: 'Profile',
      icon: <FaUser />,
      onClick: () => navigate('/profile'),
      logoutIcon: <FaSignOutAlt onClick={handleLogout} className="logout-icon" />, // Add logout icon
    },
  ];

  return (
    <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
      <button
        className="toggle-btn"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <FaBars />
      </button>
      <div className="sidebar-menu">
        {menuItems.map((item, index) => (
          <div key={index} className="sidebar-item" onClick={item.onClick}>
            <span className="sidebar-icon">{item.icon}</span>
            {isSidebarOpen && <span className="sidebar-text">{item.name}</span>}
          </div>
        ))}
      </div>
      <div className="sidebar-bottom">
        {bottomMenuItems.map((item, index) => (
          <div key={index} className="sidebar-item" onClick={item.onClick}>
            <span className="sidebar-icon">{item.icon}</span>
            {isSidebarOpen && (
              <div className="sidebar-text-with-icon">
                <span className="sidebar-text">{item.name}</span>
                {item.logoutIcon && <span>{item.logoutIcon}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Navbar;