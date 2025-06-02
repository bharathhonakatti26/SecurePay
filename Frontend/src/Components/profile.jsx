import React, { useEffect, useState } from 'react';
import './profile.css';

function Profile() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingDOB, setEditingDOB] = useState(false); // State to toggle DOB editing
    const [dob, setDOB] = useState(''); // State to store the new DOB

    useEffect(() => {
        const fetchUserData = async () => {
            const mobile = localStorage.getItem('mobile');
            if (!mobile) {
                setError('Mobile number not found. Please log in again.');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`http://localhost:5000/api/profile?mobile=${mobile}`);
                if (!response.ok) throw new Error('Failed to fetch user data');
                const data = await response.json();
                setUserData(data);
                setDOB(data.dob ? new Date(data.dob).toISOString().split('T')[0] : ''); // Format DOB for input
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleSaveDOB = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/update-dob`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile: userData.mobile, dob }),
            });

            if (!response.ok) throw new Error('Failed to update DOB');
            const updatedUser = await response.json();
            setUserData(updatedUser);
            setEditingDOB(false);
        } catch (err) {
            console.error(err.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('mobile');
        window.location.href = '/login'; // Redirect to login page
    };

    if (loading) return <div className="profile-container">Loading...</div>;
    if (error) return <div className="profile-container">Error: {error}</div>;

    return (
        <div className="profile-container">
            {/* Profile Header */}
            <div className="profile-header">
                <img
                    src={`https://ui-avatars.com/api/?name=${userData.name}&background=1e90ff&color=ffffff&size=128`}
                    alt="User Avatar"
                    className="profile-avatar"
                />
                <div className="profile-header-info">
                    <h1 className="profile-name">{userData.name}</h1>
                    <p className="profile-email">{userData.email}</p>
                </div>
            </div>

            {/* Profile Details */}
            <div className="profile-card">
                <h2 className="profile-card-title">Profile Details</h2>
                <div className="profile-grid">
                    <p><strong>Mobile : </strong> {userData.mobile}</p>
                    <p><strong>Customer ID : </strong> {userData.customerId}</p>
                    <p><strong>City : </strong> {userData.city}</p>
                    <p><strong>Date of Birth : </strong>
                        {editingDOB ? (
                            <input
                                type="date"
                                value={dob}
                                onChange={(e) => setDOB(e.target.value)}
                            />
                        ) : (
                            userData.dob ? new Date(userData.dob).toLocaleDateString() : 'Not Set'
                        )}
                    </p>
                    <p><strong>Pincode : </strong> {userData.pincode}</p>
                </div>
                <div className="profile-actions">
                    {/* Show Save DOB button only when editing */}
                    {editingDOB && (
                        <button
                            className="profile-btn profile-btn-blue"
                            onClick={handleSaveDOB}
                        >
                            Save DOB
                        </button>
                    )}

                    {/* Show Edit DOB button only if DOB is not set */}
                    {!userData.dob && !editingDOB && (
                        <button
                            className="profile-btn profile-btn-blue"
                            onClick={() => setEditingDOB(true)}
                        >
                            Edit DOB
                        </button>
                    )}

                    <button
                        className="profile-btn profile-btn-red"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Profile;