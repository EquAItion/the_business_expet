import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import './auth.css';

function decodeJWT(token: string) {
  try {
    // Split the token and get the payload part (second part)
    const base64Url = token.split('.')[1];
    // Replace characters that are not valid in URLs but are valid in base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Decode base64 and parse JSON
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

const SeekerProfileForm: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    
    const [profileData, setProfileData] = useState({
        company: '',
        position: '',
        experience: '',
        location: '',
        bio: '',
        interests: '',
        linkedin: '',
        website: ''
    });

    useEffect(() => {
        // Get user data from localStorage
        const seekerData = localStorage.getItem('seekerSignupData');
        if (!seekerData) {
            toast.error('No signup data found. Please sign up first.');
            navigate('/auth/seeker');
            return;
        }
        
        setUserData(JSON.parse(seekerData));
    }, [navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!userData) {
            toast.error('User data not found');
            return;
        }
        
        // Debug log to check userData
        console.log('User data from localStorage:', userData);
        
        // Extract userId from token
        const decodedToken = decodeJWT(userData.token);
        console.log('Decoded token:', decodedToken);
        
        if (!decodedToken || !decodedToken.id) {
            toast.error('Invalid token - user ID not found');
            return;
        }
        
        setIsLoading(true);
        
        try {
            // Log the exact data being sent
            const requestData = {
                userId: decodedToken.id, // Use ID from decoded token
                email: userData.email,
                name: userData.name,
                industry: userData.industry,
                ...profileData
            };
            
            console.log('Sending data to server:', requestData);

            const API_BASE_URL = import.meta.env.VITE_API_URL;
            
            const response = await fetch(`${API_BASE_URL}/api/profiles/seeker`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userData.token}`
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            console.log('Server response:', result);

            if (!response.ok) {
                throw new Error(result.message || 'Failed to save profile data');
            }

            // Update user data in localStorage with complete profile
            localStorage.setItem('user', JSON.stringify({
                ...userData,
                profileComplete: true
            }));
            
            // Remove temporary signup data
            localStorage.removeItem('seekerSignupData');

            toast.success('Profile completed successfully!');
            navigate('/seekerdashboard');
        } catch (error) {
            console.error('Profile save error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to save profile data');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="pt-20 min-h-screen flex items-center justify-center bg-gray-100">
                <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-center mb-6">Complete Your Profile</h1>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company/Organization</label>
                                <input
                                    type="text"
                                    name="company"
                                    className="auth-input"
                                    value={profileData.company}
                                    onChange={handleInputChange}
                                    required
                                    title="Company or Organization Name"
                                    placeholder="Enter your company or organization name"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                <input
                                    type="text"
                                    name="position"
                                    className="auth-input"
                                    value={profileData.position}
                                    onChange={handleInputChange}
                                    required
                                    title="Your current job position"
                                    placeholder="Enter your current position"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                                <input
                                    type="text"
                                    name="experience"
                                    className="auth-input"
                                    value={profileData.experience}
                                    onChange={handleInputChange}
                                    required
                                    title="Years of professional experience"
                                    placeholder="Enter your years of experience"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    className="auth-input"
                                    value={profileData.location}
                                    onChange={handleInputChange}
                                    required
                                    title="Your current location"
                                    placeholder="Enter your city and country"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                                <input
                                    type="url"
                                    name="linkedin"
                                    className="auth-input"
                                    value={profileData.linkedin}
                                    onChange={handleInputChange}
                                    placeholder="https://linkedin.com/in/yourusername"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                <input
                                    type="url"
                                    name="website"
                                    className="auth-input"
                                    value={profileData.website}
                                    onChange={handleInputChange}
                                    placeholder="https://yourwebsite.com"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Areas of Interest</label>
                            <input
                                type="text"
                                name="interests"
                                className="auth-input"
                                value={profileData.interests}
                                onChange={handleInputChange}
                                placeholder="e.g. AI, Machine Learning, Data Science"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Professional Bio</label>
                            <textarea
                                name="bio"
                                rows={4}
                                className="auth-input min-h-[120px]"
                                value={profileData.bio}
                                onChange={handleInputChange}
                                placeholder="Tell us about yourself and what you're looking for"
                                required
                            />
                        </div>
                        
                        <div className="flex justify-end">
                            <button 
                                type="submit"
                                className="auth-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Saving...' : 'Complete Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default SeekerProfileForm;