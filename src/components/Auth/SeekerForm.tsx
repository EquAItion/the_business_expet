import React, { useState } from 'react';
import { FaGoogle, FaLinkedinIn } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import './auth.css'
import { toast } from 'sonner';
import Footer from '../layout/Footer';
import { API_BASE_URL } from '@/config/api';

const SocialIcons = () => (
    <div className="social-container">
        <a href="/auth/google" className="social">
            <FaGoogle size={20} />
        </a>
        <a href="/auth/linkedin" className="social">
            <FaLinkedinIn size={20} />
        </a>
    </div>
);

const SeekerForm: React.FC = () => {
    const navigate = useNavigate();
    const [isRightPanelActive, setRightPanelActive] = useState<boolean>(false);
    const [formStep, setFormStep] = useState(1);
    
    // Update the state management with proper types
    interface FormData {
        name: string;
        email: string;
        mobileNumber: string;
        password: string;
        confirmPassword: string;
    }

    interface FormErrors {
        email: string;
        mobileNumber: string;
        passwordMatch: string;
    }

    interface SignInData {
        email: string;
        password: string;
    }

    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        mobileNumber: '',
        password: '',
        confirmPassword: ''
    });
    
    const [formErrors, setFormErrors] = useState<FormErrors>({
        email: '',
        mobileNumber: '', // Replace industry with mobileNumber
        passwordMatch: ''
    });

    const [signInData, setSignInData] = useState<SignInData>({
        email: '',
        password: ''
    });

    const handleSignUpClick = (): void => {
        setRightPanelActive(true);
    };

    const handleSignInClick = (): void => {
        setRightPanelActive(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        // Update form data state
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Email validation
        if (name === 'email') {
            validateEmail(value);
        }
        
        // Mobile number validation
        if (name === 'mobileNumber') {
            validateMobileNumber(value);
        }
        
        // Password validation - use current input values
        if (name === 'password' || name === 'confirmPassword') {
            // Get the most up-to-date password values
            const currentPassword = name === 'password' ? value : formData.password;
            const currentConfirmPassword = name === 'confirmPassword' ? value : formData.confirmPassword;
            
            // Only validate if both fields have values
            if (currentPassword && currentConfirmPassword) {
                if (currentPassword !== currentConfirmPassword) {
                    setFormErrors(prev => ({
                        ...prev,
                        passwordMatch: 'Passwords do not match'
                    }));
                } else {
                    setFormErrors(prev => ({
                        ...prev,
                        passwordMatch: '✔ Passwords match'
                    }));
                }
            }
        }
    };

    // Add strong validation functions
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const isValid = emailRegex.test(email.trim());
        setFormErrors(prev => ({
            ...prev,
            email: isValid ? '' : 'Please enter a valid email address'
        }));
        return isValid;
    };

    // Update the validateMobileNumber function
    const validateMobileNumber = (number: string): boolean => {
        // Remove any non-numeric characters
        const cleanNumber = number.replace(/[^0-9]/g, '');
        
        // Check if starts with valid Indian mobile prefix (6-9)
        const validPrefix = /^[6-9]/.test(cleanNumber);
        
        // Check exact length of 10 digits
        const validLength = cleanNumber.length === 10;
        
        // Check for repeated digits (e.g., 9999999999)
        const repeatedDigits = /^(.)\1+$/.test(cleanNumber);
        
        if (!validPrefix) {
            setFormErrors(prev => ({
                ...prev,
                mobileNumber: 'Mobile number must start with 6, 7, 8, or 9'
            }));
            return false;
        }
        
        if (!validLength) {
            setFormErrors(prev => ({
                ...prev,
                mobileNumber: 'Mobile number must be exactly 10 digits'
            }));
            return false;
        }
        
        if (repeatedDigits) {
            setFormErrors(prev => ({
                ...prev,
                mobileNumber: 'Invalid mobile number pattern'
            }));
            return false;
        }
        
        setFormErrors(prev => ({
            ...prev,
            mobileNumber: ''
        }));
        return true;
    };

    const handleSignInInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSignInData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validatePasswords = () => {
        if (formData.password !== formData.confirmPassword) {
            setFormErrors(prev => ({
                ...prev,
                passwordMatch: 'Passwords do not match'
            }));
            return false;
        } else {
            setFormErrors(prev => ({
                ...prev,
                passwordMatch: ''
            }));
            return true;
        }
    };

    const handleContinue = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        
        const isEmailValid = validateEmail(formData.email);
        const isMobileValid = validateMobileNumber(formData.mobileNumber);
        
        if (!formData.name.trim()) {
            toast.error('Please enter your name');
            return;
        }
        
        if (!isMobileValid) {
            toast.error('Please enter a valid mobile number');
            return;
        }
        
        if (!isEmailValid) {
            toast.error('Please enter a valid email address');
            return;
        }
        
        setFormStep(2);
    };

    // First update the interface
    interface RegistrationData {
        name: string;
        email: string;
        mobile_number: string;  // Note: This name must match backend expectations
        password: string;
        role: 'solution_seeker';
    }

    // Add interfaces for API responses
    interface RegisterResponse {
        success: boolean;
        message: string;
        data: {
            id: string;
            token: string;
            name: string;
            email: string;
            mobile_number: string;
        }
    }

    // Update the handleSignUpSubmit function
    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Validate all fields
            if (!formData.name.trim()) {
                toast.error('Name is required');
                return;
            }

            if (!validateEmail(formData.email)) {
                toast.error('Please enter a valid email address');
                return;
            }

            if (!validateMobileNumber(formData.mobileNumber)) {
                toast.error('Please enter a valid mobile number');
                return;
            }

            if (!validatePasswords()) {
                toast.error('Passwords do not match');
                return;
            }

            // Update to use seeker-specific endpoint
            const registrationData = {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                mobile_number: formData.mobileNumber.trim(),
                password: formData.password
            };

            const response = await fetch(`${API_BASE_URL}/api/auth/register/seeker`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(registrationData)
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    const errorMessage = result.message || 'User already exists';
                    toast.error(errorMessage);
                    setFormData(prev => ({
                        ...prev,
                        email: '',
                        mobileNumber: ''
                    }));
                    return;
                }
                throw new Error(result.message || 'Registration failed');
            }

            // Store user data
            const userData = {
                id: result.data.id,
                name: result.data.name,
                email: result.data.email,
                mobile_number: result.data.mobile_number,
                token: result.data.token,
                role: 'solution_seeker',
                profile_completed: false
            };

            localStorage.setItem('user', JSON.stringify(userData));
            toast.success('Account created! Complete your profile to get started.');
            
            navigate('/auth/SeekerProfileForm', { 
                replace: true,
                state: { 
                    isNewUser: true,
                    userId: result.data.id 
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error instanceof Error ? error.message : 'Registration failed');
        }
    };    // Add interface for login response
    interface LoginResponse {
        success: boolean;
        message: string;
        data: {
            id: string;
            user_id?: string;
            token: string;
            name: string;
            email: string;
            mobile_number: string;
            role: 'solution_seeker';
            profile_completed?: boolean;
        }
    }

    // Update the handleSignInSubmit function
    const handleSignInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            if (!validateEmail(signInData.email)) {
                toast.error('Please enter a valid email address');
                return;
            }

            if (!signInData.password) {
                toast.error('Password is required');
                return;
            }

            const loginData = {
                email: signInData.email.trim().toLowerCase(),
                password: signInData.password,
                role: 'solution_seeker'
            };

            console.log('Attempting login with:', { email: loginData.email, role: loginData.role });

            const response = await fetch(`${API_BASE_URL}/api/auth/login/seeker`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json() as LoginResponse;

            if (!response.ok) {
                throw new Error(result.message || 'Invalid solution seeker credentials');
            }

            // Verify required data
            if (!result.data?.token || !result.data?.email) {
                throw new Error('Invalid response from server');
            }

            // Normalize user data
            const userData = {
                id: result.data.id || result.data.user_id,
                email: result.data.email,
                name: result.data.name,
                mobile_number: result.data.mobile_number,
                token: result.data.token,
                role: 'solution_seeker' as const,
                profile_completed: result.data.profile_completed || false
            };

            // Store normalized data
            localStorage.setItem('user', JSON.stringify(userData));

            toast.success('Login successful!');

            // Redirect based on profile completion
            if (userData.profile_completed) {
                navigate('/seekerdashboard', { replace: true });
            } else {
                navigate('/auth/SeekerProfileForm', { 
                    replace: true,
                    state: { 
                        isNewUser: false,
                        userId: userData.id 
                    }
                });
            }

        } catch (error) {
            console.error('Login error:', error);
            toast.error(error instanceof Error ? error.message : 'Invalid credentials');
            
            // Clear form on error
            setSignInData({
                email: '',
                password: ''
            });
        }
    };

    return (
        <>
            <Navbar />
            <div className="pt-20 min-h-screen flex items-center justify-center bg-gray-100">
                <div className={`auth-container ${isRightPanelActive ? 'right-panel-active' : ''}`} id="container">
                    <div className="form-container sign-up-container">
                        <form className="auth-form" onSubmit={handleSignUpSubmit}>
                            <h1>Create Account <br/> As a Solution Seeker</h1>
                            
                            <div className="flex justify-center space-x-2 mb-4">
                                <div className={`h-2 w-2 rounded-full ${formStep === 1 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                <div className={`h-2 w-2 rounded-full ${formStep === 2 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                            </div>
                            
                            <div className={formStep === 1 ? 'block' : 'hidden'}>
                                <input 
                                    type="text" 
                                    name="name"
                                    className="auth-input" 
                                    placeholder="Name" 
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required 
                                />
                                <div className="w-full">
                                    <input 
                                        type="email" 
                                        name="email"
                                        className={`auth-input ${formErrors.email ? 'border-red-500' : ''}`}
                                        placeholder="Email" 
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required 
                                    />
                                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                                </div>
                                <div className="w-full">
                                    <input 
                                        type="tel" 
                                        name="mobileNumber"
                                        className={`auth-input ${formErrors.mobileNumber ? 'border-red-500' : ''}`}
                                        placeholder="Enter 10-digit mobile number" 
                                        value={formData.mobileNumber}
                                        onChange={(e) => {
                                            // Only allow numeric input
                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                            
                                            // Limit to 10 digits
                                            if (value.length <= 10) {
                                                handleInputChange({
                                                    ...e,
                                                    target: {
                                                        ...e.target,
                                                        value,
                                                        name: 'mobileNumber'
                                                    }
                                                });
                                            }
                                        }}
                                        maxLength={10}
                                        required 
                                    />
                                    {formErrors.mobileNumber && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.mobileNumber}</p>
                                    )}
                                </div>
                                
                                <button 
                                    type="button" 
                                    className="auth-button mt-4"
                                    onClick={handleContinue}
                                >
                                    Continue
                                </button>
                                <br/>
                                <span className="mt-4">or use your email for registration</span>
                                <SocialIcons />
                            </div>
                            
                            <div className={formStep === 2 ? 'block' : 'hidden'}>
                                <h3 className="text-lg font-semibold mb-4">Create a Password</h3>
                                <input 
                                    type="password" 
                                    name="password"
                                    className="auth-input" 
                                    placeholder="Password" 
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required 
                                />
                                <input 
                                    type="password" 
                                    name="confirmPassword"
                                    className={`auth-input ${formErrors.passwordMatch === 'Passwords do not match' ? 'border-red-500' : 
                                                            formErrors.passwordMatch === '✔ Passwords match' ? 'border-green-500' : ''}`} 
                                    placeholder="Confirm Password" 
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    required 
                                />
                                {formErrors.passwordMatch && (
                                    <p className={`text-xs mt-1 ${
                                        formErrors.passwordMatch === '✔ Passwords match' ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                        {formErrors.passwordMatch}
                                    </p>
                                )}
                                
                                <div className="flex w-full gap-4 mt-4">
                                    <button 
                                        type="button" 
                                        className="border border-gray-300 rounded-full px-4 py-2 text-sm flex-1"
                                        onClick={() => setFormStep(1)}
                                    >
                                        Back
                                    </button>
                                    <button type="submit" className="auth-button flex-1">Sign Up</button>
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <div className="form-container sign-in-container">
                        <form className="auth-form" onSubmit={handleSignInSubmit}>
                            <h1>Sign In <br/> As a Solution Seeker</h1>
                            <input 
                                type="email" 
                                name="email" 
                                className="auth-input" 
                                placeholder="Email" 
                                value={signInData.email}
                                onChange={handleSignInInputChange}
                                required 
                            />
                            <input 
                                type="password" 
                                name="password" 
                                className="auth-input" 
                                placeholder="Password" 
                                value={signInData.password}
                                onChange={handleSignInInputChange}
                                required 
                            />
                            <a href="#">Forgot your password?</a>
                            <button type="submit" className="auth-button">Sign In</button>
                            <span>or use your account</span>
                            <SocialIcons />
                        </form>
                    </div>
                    <div className="overlay-container">
                        <div className="overlay">
                            <div className="overlay-panel overlay-left">
                                <h1>SignIn As a Solution Seeker</h1>
                                <p>To stay connected, please log in with your personal info</p>
                                <button className="ghost" onClick={handleSignInClick}>Sign In</button>
                            </div>
                            <div className="overlay-panel overlay-right">
                                <h1>SignUp As a Solution Seeker</h1>
                                <p>If you don't have an account. Then SignUp as a Solution Seeker</p>
                                <button className="ghost" onClick={handleSignUpClick}>Sign Up</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
           <Footer/>
        </>
    );
};

export default SeekerForm;

