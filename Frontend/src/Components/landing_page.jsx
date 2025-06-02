import React from 'react';
import './landing_page.css';
import { Link } from 'react-router-dom';

function Landing_page() {
  return (
    <div className="landing-container">
      <h1 className="landing-title">SecurePay</h1>
      <p className="landing-subtitle">
        Next-gen payment security using AI, and Multi-App Interoperability.
      </p>
      <div>
        <Link to="/login">
          <button className="landing-btn" style={{ marginRight: '1em' }}>
            Login
          </button>
        </Link>
        <Link to="/create-account">
          <button className="landing-btn">
            Create Account
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Landing_page;