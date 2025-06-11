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

// Update interfaces to match backend schema
interface UserData {
    id: string;
    name: string;
    email: string;
    mobile_number: string;
    token: string;
    role: 'solution_seeker';
}

interface ProfileRequestData {
    user_id: string;
    name: string;
    email: string;
    company: string;
    position: string;
    experience: string;
    location: string;
    bio: string;
    interests: string;
    linkedin_url: string | null;  // Changed from linkedin
    website_url: string | null;   // Changed from website
}

// Update the LinkedIn URL validation
const validateLinkedInUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
        // Less restrictive pattern that still ensures valid LinkedIn URLs
        const linkedInRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i;
        return linkedInRegex.test(url.trim());
    } catch (error) {
        return false;
    }
};

// New function to validate experience
const validateExperience = (experience: string): boolean => {
    const numExp = parseFloat(experience);
    return !isNaN(numExp) && numExp >= 0 && numExp <= 50;
};

// New function to validate website URL
const validateWebsiteUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
        const websiteRegex = /^https?:\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;
        return websiteRegex.test(url.trim());
    } catch (error) {
        return false;
    }
};

// Update the validateProfileData function
const validateProfileData = (data: typeof profileData, userData: UserData | null): string[] => {
    const errors: string[] = [];
    
    // Validate user data first
    if (!userData?.name) errors.push('User name is required');
    if (!userData?.email) errors.push('User email is required');
    // Remove mobile_number validation since it's not required
    
    // Validate profile data
    if (!data.company.trim()) errors.push('Company is required');
    if (!data.position.trim()) errors.push('Position is required');
    if (!data.experience.trim()) errors.push('Experience is required');
    if (!data.location.trim()) errors.push('Location is required');
    if (!data.bio.trim()) errors.push('Professional Bio is required');
    if (!data.interests.trim()) errors.push('Areas of Interest is required');

    // URL validations remain the same
    if (data.linkedin && !validateLinkedInUrl(data.linkedin)) {
        errors.push('LinkedIn URL must be a valid profile URL (e.g., https://linkedin.com/in/username)');
    }
    
    if (data.website && !validateWebsiteUrl(data.website)) {
        errors.push('Please enter a valid website URL');
    }

    // Experience validation
    if (!validateExperience(data.experience.trim())) {
        errors.push('Experience must be a valid number between 0 and 50 years');
    }

    return errors;
};

const SeekerProfileForm: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    
    interface ProfileFormData {
        company: string;
        position: string;
        experience: string;
        location: string;
        bio: string;
        interests: string;
        linkedin: string;
        website: string;
    }

    const [profileData, setProfileData] = useState<ProfileFormData>({
        company: '',
        position: '',
        experience: '',
        location: '',
        bio: '',
        interests: '',
        linkedin: '',
        website: ''
    });

    // Update the useEffect hook to get user data
    useEffect(() => {
        // Get user data from localStorage
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            toast.error('Please login first');
            navigate('/auth/seeker');
            return;
        }
        
        try {
            const userData = JSON.parse(storedUser);
            if (!userData.token) {
                throw new Error('Invalid user data');
            }
            setUserData(userData);
            
            // Log for debugging
            console.log('Retrieved user data:', userData);
        } catch (error) {
            console.error('Error parsing user data:', error);
            toast.error('Invalid user data. Please login again');
            navigate('/auth/seeker');
        }
    }, [navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Update the handleSubmit function
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            if (!userData?.id) {
                throw new Error('User ID not found');
            }

            // Validate form data
            const validationErrors = validateProfileData(profileData, userData);
            if (validationErrors.length > 0) {
                validationErrors.forEach(error => toast.error(error));
                return;
            }

            setIsLoading(true);

            const requestData: ProfileRequestData = {
                user_id: userData.id,
                name: userData.name,
                email: userData.email,
                // Remove mobile_number from request data since it's not required
                company: profileData.company.trim(),
                position: profileData.position.trim(),
                experience: profileData.experience.trim(),
                location: profileData.location.trim(),
                bio: profileData.bio.trim(),
                interests: profileData.interests.trim(),
                linkedin_url: profileData.linkedin ? profileData.linkedin.trim() : null,
                website_url: profileData.website ? profileData.website.trim() : null
            };

            const API_BASE_URL = import.meta.env.VITE_API_URL;
            if (!API_BASE_URL) {
                throw new Error('API URL not configured');
            }

            const response = await fetch(`${API_BASE_URL}/api/profiles/seeker`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userData.token}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save profile');
            }

            const updatedUserData = {
                ...userData,
                profile_completed: true
            };
            
            localStorage.setItem('user', JSON.stringify(updatedUserData));
            toast.success('Profile completed successfully!');
            navigate('/seekerdashboard');

        } catch (error) {
            console.error('Profile save error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to save profile');
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    LinkedIn Profile URL
                                </label>
                                <input
                                    type="url"
                                    name="linkedin"  // Keep this for form state
                                    className={`auth-input ${
                                        profileData.linkedin && !validateLinkedInUrl(profileData.linkedin) 
                                        ? 'border-red-500' 
                                        : ''
                                    }`}
                                    value={profileData.linkedin}
                                    onChange={handleInputChange}
                                    placeholder="https://linkedin.com/in/username"
                                    title="Please enter a valid LinkedIn profile URL"
                                />
                                {profileData.linkedin && !validateLinkedInUrl(profileData.linkedin) && (
                                    <p className="text-red-500 text-sm mt-1">
                                        Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)
                                    </p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                <input
                                    type="url"
                                    name="website"  // Keep this for form state
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