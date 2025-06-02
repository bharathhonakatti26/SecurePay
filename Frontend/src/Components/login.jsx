import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

function Login() {
  const [mobile, setMobile] = useState('');
  const [mpin, setMpin] = useState(Array(6).fill('')); // Initialize MPIN as an array of 6 empty strings
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate Mobile: 10 digits, numbers only
    if (!/^\d{10}$/.test(mobile)) {
      alert('Mobile number must be exactly 10 digits.');
      return;
    }

    // Validate MPIN: Ensure all 6 boxes are filled
    if (mpin.some((digit) => digit === '')) {
      alert('MPIN must be exactly 6 digits.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, mpin: mpin.join('') }), // Combine MPIN array into a single string
      });

      const data = await res.json();

      if (res.ok) {
        alert('Login successful!');
        localStorage.setItem('isLoggedIn', 'true'); // Set login flag
        localStorage.setItem('mobile', mobile); // Store mobile number
        navigate('/dashboard'); // Redirect to dashboard
      } else {
        if (data.message === 'Mobile number not registered') {
          alert('Mobile number not registered. Redirecting to create account page.');
          navigate('/create-account');
        } else {
          alert(data.message);
        }
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  const handleMpinBoxChange = (value, index) => {
    // Allow only numeric input
    if (!/^\d?$/.test(value)) return;

    const updatedMpin = [...mpin];
    updatedMpin[index] = value; // Update the value of the current box
    setMpin(updatedMpin); // Update the MPIN state

    // Automatically move to the next box if a digit is entered
    if (value && index < 5) {
      const nextBox = document.querySelectorAll('.mpin-box-small')[index + 1];
      if (nextBox) nextBox.focus();
    }
  };

  const handleMpinKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !mpin[index] && index > 0) {
      // Move to the previous box if Backspace is pressed and the current box is empty
      const prevBox = document.querySelectorAll('.mpin-box-small')[index - 1];
      if (prevBox) prevBox.focus();
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Login to SecurePay</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="mobile" className="login-label">Mobile Number</label>
        <input
          id="mobile"
          type="text"
          required
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/, ''))}
          maxLength={10}
          minLength={10}
          className="login-input"
          inputMode="numeric"
          pattern="\d{10}"
          placeholder="Enter 10-digit Mobile Number"
        />
        <label htmlFor="mpin" className="login-label">MPIN</label>
        <div className="mpin-input-container-small">
          {Array.from({ length: 6 }).map((_, index) => (
            <input
              key={index}
              type="password"
              inputMode="numeric" // Numeric keypad for mobile
              maxLength="1" // Limit each box to 1 digit
              value={mpin[index] || ''} // Display the current value or an empty string
              onChange={(e) => handleMpinBoxChange(e.target.value, index)} // Handle input change
              onKeyDown={(e) => handleMpinKeyDown(e, index)} // Handle navigation with arrow keys
              className="mpin-box-small" // Use the new smaller class
            />
          ))}
        </div>
        <button className="login-btn" type="submit">
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;