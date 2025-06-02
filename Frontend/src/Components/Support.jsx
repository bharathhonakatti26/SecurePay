import React, { useState } from 'react';
import './Support.css'; // Import CSS for styling

function Support() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    formData.append('access_key', '0e8b4669-8068-4959-8fed-4b529d09cc3d');

    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: json,
      }).then((res) => res.json());

      if (res.success) {
        setFormData({
          name: '',
          email: '',
          message: '',
        });
        alert('Feedback submitted successfully!'); // Alert message on successful submission
      } else {
        console.error('Form submission failed:', res);
        alert('Failed to submit feedback. Please try again.'); // Alert message on failure
      }
    } catch (error) {
      console.error('Error during form submission:', error);
      alert('An error occurred while submitting feedback. Please try again later.'); // Alert message on error
    }
  };

  return (
    <div className="support-container">
      <h1 className="support-title">Support</h1>
      <p className="support-description">
        Need help? We're here to assist you with any issues or questions you may have.
      </p>
      <div className="support-info">
        <h2>Contact Us</h2>
        <p><strong>Email:</strong> securepay50@gmail.com</p>
        <p><strong>Working Hours:</strong> 24 Bar 7</p>
      </div>
      <div className="support-feedback">
        <h2>Feedback</h2>
        <p>We value your feedback. Please let us know how we can improve our services.</p>
        <div className="feedback-form-container">
          <form className="contact-form" onSubmit={onSubmit}>
            <div className="form-group-input">
              <div>
                <label htmlFor="name">Name</label>
                <input
                  name="name"
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="email">Email</label>
                <input
                  name="email"
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="message">Message</label>
              <textarea
                name="message"
                id="message"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="submit-button">
              Submit Feedback
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Support;