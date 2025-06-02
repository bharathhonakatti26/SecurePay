import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import './create_account.css';

function CreateAccount() {
  const EMAILJS_SERVICE_ID = 'service_wcg8ljl';
  const EMAILJS_TEMPLATE_ID = 'template_ctqiemz';
  const EMAILJS_PUBLIC_KEY = '917TQ2LV3HJwCNipL';

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [mpin, setMpin] = useState(['', '', '', '', '', '']); // Initialize MPIN as an array
  const [agree, setAgree] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const navigate = useNavigate();

  const handlePincodeChange = (e) => {
    const value = e.target.value;
    setPincode(value);
    if (value.length === 6) {
      setCity('AutoCity'); // Dummy city
    } else {
      setCity('');
    }
  };

  // Send OTP using EmailJS
  const handleSendOtp = async () => {
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      alert('Enter a valid email address.');
      return;
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp); // Update the generated OTP
    setOtpSent(true); // Mark OTP as sent
    setOtpInputs(['', '', '', '', '', '']); // Clear previous OTP inputs
    setOtpError(''); // Clear any previous OTP errors

    emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: email,
        otp: newOtp,
        time: new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString(),
      },
      EMAILJS_PUBLIC_KEY
    ).then(
      () => {
        alert('OTP sent to your email.');
      },
      () => {
        alert('Failed to send OTP.');
      }
    );
  };

  // Handle OTP input change
  const handleOtpInputChange = (e, idx) => {
    const value = e.target.value.replace(/\D/, ''); // Only digits
    if (value.length > 1) return;
    const newInputs = [...otpInputs];
    newInputs[idx] = value;
    setOtpInputs(newInputs);
    setOtpError('');
    // Move to next box if filled
    if (value && idx < 5) {
      document.getElementById(`otp-input-${idx + 1}`).focus();
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = () => {
    const enteredOtp = otpInputs.join('');
    if (enteredOtp.length < 6) {
      setOtpError('Please enter all 6 digits.');
      return;
    }
    if (enteredOtp === generatedOtp) {
      setEmailVerified(true); // Mark email as verified
      setOtpError('');
      alert('OTP verified successfully!');
      setOtpInputs(['', '', '', '', '', '']); // Clear OTP inputs
    } else {
      setOtpError('Incorrect OTP entered.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agree) {
      alert('You must agree to Terms & Conditions by SecurePay to create an account.');
      return;
    }

    if (!emailVerified) {
      alert('Please verify your email with OTP before creating an account.');
      return;
    }

    if (mpin.some((digit) => digit === '')) {
      alert('MPIN must be exactly 6 digits.');
      return;
    }

    const customerId = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const res = await fetch('http://localhost:5000/api/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mobile, email, pincode, city, customerId, mpin: mpin.join('') }), // Join MPIN array into a string
    });

    const data = await res.json();
    if (res.ok) {
      alert('Account created! Your Customer ID: ' + customerId);
      navigate('/login');
    } else {
      if (data.message === 'Mobile number already registered') {
        alert('Account already exists. Redirecting to login page.');
        navigate('/login');
      } else {
        alert(data.message);
      }
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
    <div className="create-account-container">
      <h1 className="create-account-title">Create Account</h1>
      <form className="create-account-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className="create-account-label">Name *</label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="create-account-input"
          />
        </div>
        <div>
          <label htmlFor="mobile" className="create-account-label">Mobile Number *</label>
          <input
            id="mobile"
            type="tel"
            pattern="[0-9]{10}"
            required
            value={mobile}
            onChange={e => setMobile(e.target.value.replace(/\D/, ''))}
            maxLength={10}
            className="create-account-input"
          />
        </div>
        <div className="email-input-group">
          <label htmlFor="email" className="create-account-label">Email *</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              setEmailVerified(false);
              setOtpSent(false);
              setOtp('');
              setOtpInputs(['', '', '', '', '', '']);
              setOtpError('');
            }}
            className="create-account-input"
            disabled={emailVerified}
          />
          {!emailVerified && (
            <button
              type="button"
              className="send-otp-btn"
              onClick={handleSendOtp}
            >
              Send OTP
            </button>
          )}
        </div>
        {otpSent && !emailVerified && (
          <div style={{ margin: '1em 0' }}>
            <div style={{ display: 'flex', gap: '0.3em' }}>
              {otpInputs.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpInputChange(e, idx)}
                  className="otp-input-box"
                  disabled={emailVerified}
                />
              ))}
              <button
                type="button"
                className="Verify-otp-btn"
                style={{ marginLeft: '1em', height: '2.2em', padding: '0 12px' }}
                onClick={() => {
                  handleVerifyOtp();
                  setOtpInputs(['', '', '', '', '', '']); // Clear boxes after verify
                }}
              >
                Verify OTP
              </button>
            </div>
            {otpError && (
              <div style={{ color: 'red', marginTop: '0.5em' }}>{otpError}</div>
            )}
          </div>
        )}
        {emailVerified && <span style={{ color: 'white', marginLeft: '2em', marginTop: '2em', marginBottom: '2em' }}>Email Verified</span>}
        <div>
          <label htmlFor="pincode" className="create-account-label">Enter Pincode *</label>
          <input
            id="pincode"
            type="text"
            pattern="[0-9]{6}"
            required
            value={pincode}
            onChange={handlePincodeChange}
            maxLength={6}
            className="create-account-input"
          />
        </div>
        <div>
          <label htmlFor="city" className="create-account-label">City (Auto fetch)</label>
          <input
            id="city"
            type="text"
            value={city}
            readOnly
            className="create-account-input"
          />
        </div>
        <div>
          <label htmlFor="mpin" className="create-account-label">Set MPIN (6 digits) *</label>
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
        </div>
        <div style={{ textAlign: 'left', margin: '1em 0' }}>
          <input
            id="agree"
            type="checkbox"
            checked={agree}
            onChange={e => setAgree(e.target.checked)}
            style={{ marginRight: '0.5em' }}
          />
          <label htmlFor="agree" style={{ color: '#b0c4de', fontSize: '1rem', cursor: 'pointer' }}>
            I agree to Terms & Conditions by SecurePay
          </label>
        </div>
        <button className="create-account-btn" type="submit">
          Create Account
        </button>
      </form>
    </div>
  );
}

export default CreateAccount;