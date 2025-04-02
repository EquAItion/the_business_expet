import React from 'react';

const SeekerDashboard: React.FC = () => {
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Seeker Dashboard</h1>
            <p>Welcome to your dashboard! Here you can manage your profile, view job opportunities, and track your applications.</p>
            
            <div style={{ marginTop: '20px' }}>
                <h2>Quick Links</h2>
                <ul>
                    <li><a href="/profile">Edit Profile</a></li>
                    <li><a href="/jobs">View Job Listings</a></li>
                    <li><a href="/applications">Track Applications</a></li>
                </ul>
            </div>
        </div>
    );
};

export default SeekerDashboard;