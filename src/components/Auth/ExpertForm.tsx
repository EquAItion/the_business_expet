import React, { useState, useRef, useEffect } from 'react';
import { FaGoogle, FaLinkedinIn } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import './auth.css';
import { toast } from 'react-hot-toast';  // Make sure this is the only toast import
import Footer from '../layout/Footer';

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
                  
// Add new interface for functionality options
interface FunctionalityOption {
    id: number;
    option_value: string;
    display_name: string;
}

const ExpertForm: React.FC = () => {
    const navigate = useNavigate();
    const [isRightPanelActive, setRightPanelActive] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [formStep, setFormStep] = useState(1); // Track form step
    const formRef = useRef<HTMLDivElement>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        functionality: '' // Changed from industry
    });

    // Add state for functionality options
    const [functionalityOptions, setFunctionalityOptions] = useState<FunctionalityOption[]>([]);

    // Add new state for login form
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    // Add these new states to your component
    const [showPasswordPopup, setShowPasswordPopup] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    // Add a new state for confirmation popup
    const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);

    const handleSignUpClick = (): void => {
        setRightPanelActive(true);
        setError('');
    };

    const handleSignInClick = (): void => {
        setRightPanelActive(false);
        setError('');
    };

    // Replace your current handleInputChange function with this
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        // Create the updated form data
        const updatedFormData = {
            ...formData,
            [name]: value
        };
        
        // Update the form data state
        setFormData(updatedFormData);
        setError('');
    };

    // Add login form handler
    const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLoginData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    // Update handleSignUpSubmit function
    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // Validate fields
            if (!formData.name.trim() || !formData.email.trim() || !formData.functionality.trim()) {
                setError('All fields are required');
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                setError('Please enter a valid email address');
                return;
            }

            // Generate password
            const randomPassword = Array(12)
                .fill('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*')
                .map(x => x[Math.floor(Math.random() * x.length)])
                .join('');
            
            setGeneratedPassword(randomPassword);
            
            const API_BASE_URL = import.meta.env.VITE_API_URL;
            
            // Update to use expert-specific endpoint
            const response = await fetch(`${API_BASE_URL}/api/auth/register/expert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.toLowerCase().trim(),
                    functionality: formData.functionality.trim(),
                    password: randomPassword
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Registration failed');
            }

            // Store signup data
            localStorage.setItem('expertSignupData', JSON.stringify({
                ...formData,
                user_id: result.data.id,
                token: result.data.token
            }));
            
            setShowPasswordPopup(true);

        } catch (error) {
            console.error('Registration error:', error);
            setError(error instanceof Error ? error.message : 'Registration failed');
            toast.error(error instanceof Error ? error.message : 'Registration failed');
        }
    };

    // Update the handleContinueAfterPassword function
    const handleContinueAfterPassword = () => {
        setShowPasswordPopup(false);
        setShowConfirmationPopup(true); // Show the confirmation popup instead of navigating
    };

    // Add a function to handle closing the confirmation popup
    const handleCloseConfirmation = () => {
        setShowConfirmationPopup(false);
        setRightPanelActive(false); // Switch to sign-in panel
    };

    const handleSignInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // Validate inputs
            if (!loginData.email || !loginData.password) {
                setError('Email and password are required');
                return;
            }

            const API_BASE_URL = import.meta.env.VITE_API_URL;
            
            console.log('Attempting expert login:', { email: loginData.email });

            const response = await fetch(`${API_BASE_URL}/api/auth/login/expert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: loginData.email.trim().toLowerCase(),
                    password: loginData.password
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login failed');
            }

            if (!result.success || !result.data) {
                throw new Error('Invalid response format');
            }

            // Store user data
            const userData = {
                id: result.data.id,
                name: result.data.name,
                email: result.data.email,
                role: 'expert',
                token: result.data.token,
                profile_completed: result.data.profile_completed
            };

            localStorage.setItem('user', JSON.stringify(userData));
            
            // Change toast.info to toast with custom styling
            if (!result.data.profile_completed) {
                toast('Please complete your profile', {
                    icon: 'ℹ️',
                    style: {
                        background: '#3b82f6',
                        color: '#fff'
                    }
                });
                navigate('/auth/ExpertProfileForm');
                return;
            }

            toast.success('Login successful!');
            navigate('/dashboard');

        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            setError(errorMessage);
            toast.error(errorMessage);
            
            // Clear password on error
            setLoginData(prev => ({
                ...prev,
                password: ''
            }));
        }
    };

    const handleContinue = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        
        // Basic validation for first step
        if (!formData.name.trim() || !formData.email.trim() || !formData.functionality.trim()) {
            setError('Name, email, and industry are required');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }
        
        // Scroll to top of page smoothly
        window.scrollTo({top: 0, behavior: 'smooth'});
        
        // Move to second step
        setFormStep(2);
    };

    const copyPasswordToClipboard = () => {
        navigator.clipboard.writeText(generatedPassword)
          .then(() => {
            toast.success('Password copied to clipboard!');
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
          })
          .catch(err => {
            console.error('Failed to copy password: ', err);
            toast.error('Failed to copy password');
          });
    };

    // Add useEffect to fetch functionality options
    useEffect(() => {
        const fetchFunctionalities = async () => {
            try {
                const API_BASE_URL = import.meta.env.VITE_API_URL;
                const response = await fetch(`${API_BASE_URL}/api/functionalities`);
                const data = await response.json();
                if (data.success) {
                    setFunctionalityOptions(data.data);
                }
            } catch (error) {
                console.error('Error fetching functionalities:', error);
                setError('Failed to load functionality options');
            }
        };

        fetchFunctionalities();
    }, []);

    return (
        <>
            <Navbar />
            <div className="pt-20 min-h-screen flex items-center justify-center bg-gray-100">
                <div className={`auth-container ${isRightPanelActive ? 'right-panel-active' : ''}`} id="container">
                    <div className="form-container sign-up-container">
                        <form className="auth-form" onSubmit={handleSignUpSubmit} ref={formRef}>
                            <h1>Create Account <br/> As an Expert</h1>
                            {error && (
                                <div className="text-red-500 text-sm mb-4 text-center">
                                    {error}
                                </div>
                            )}
                            
                            <div className="w-full">
                                <input 
                                    type="text" 
                                    name="name"
                                    className="auth-input" 
                                    placeholder="Name" 
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required 
                                />
                                <input 
                                    type="email" 
                                    name="email"
                                    className="auth-input" 
                                    placeholder="Email" 
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required 
                                />
                                <select 
                                    name="functionality"
                                    className="auth-input" 
                                    value={formData.functionality}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select your expertise area</option>
                                    {functionalityOptions.map(option => (
                                        <option key={option.id} value={option.option_value}>
                                            {option.display_name}
                                        </option>
                                    ))}
                                </select>
                                <button 
                                    type="submit"
                                    className="auth-button mt-4"
                                >
                                    Sign Up
                                </button>
                            </div>
                            
                            <span className="mt-4">or use your email for registration</span>
                            <SocialIcons />
                        </form>
                    </div>
                    <div className="form-container sign-in-container">
                        <form className="auth-form" onSubmit={handleSignInSubmit}>
                            <h1>Sign In <br/> As an Expert</h1>
                            {error && (
                                <div className="text-red-500 text-sm mb-4 text-center">
                                    {error}
                                </div>
                            )}
                            <input 
                                type="email" 
                                name="email"
                                className="auth-input" 
                                placeholder="Email" 
                                value={loginData.email}
                                onChange={handleLoginChange}
                                required 
                            />
                            <input 
                                type="password" 
                                name="password"
                                className="auth-input" 
                                placeholder="Password" 
                                value={loginData.password}
                                onChange={handleLoginChange}
                                required 
                            />
                            <a href="#" className="forgot-password">Forgot your password?</a>
                            <button type="submit" className="auth-button">Sign In</button>
                            <span>or use your account</span>
                            <SocialIcons />
                        </form>
                    </div>
                    <div className="overlay-container">
                        <div className="overlay">
                            <div className="overlay-panel overlay-left">
                                <h1>Sign In As an Expert</h1>
                                <p>To stay connected, please log in with your personal info</p>
                                <button className="ghost" onClick={handleSignInClick}>Sign In</button>
                            </div>
                            <div className="overlay-panel overlay-right">
                                <h1>Sign Up As an Expert</h1>
                                <p>If you don't have an account. Then Sign Up as an Expert</p>
                                <button className="ghost" onClick={handleSignUpClick}>Sign Up</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Password Popup */}
            {showPasswordPopup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl p-5 
                                    sm:p-6 md:p-5 max-w-md w-full mx-auto my-8 
                                    md:absolute md:top-1/1 md:left-1/2 md:-translate-x-1/1 md:-translate-y-1/1 
                                    md:max-w-sm md:mt-16 md:my-0 
                                    animate-scale-in shadow-2xl">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-14 md:h-14 bg-green-100 rounded-full flex items-center justify-center mb-4 md:mb-3">
                                <svg 
                                    className="w-9 h-9 sm:w-12 sm:h-12 md:w-8 md:h-8 text-green-600" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24" 
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth="2" 
                                        d="M5 13l4 4L19 7"
                                    ></path>
                                </svg>
                            </div>
                            
                            <h2 className="text-xl sm:text-2xl md:text-lg font-bold mb-3 md:mb-2">Account Created!</h2>
                            <p className="text-base sm:text-lg md:text-sm mb-2">
                                Here is your auto-generated password:
                            </p>
                            
                            <div className="relative bg-gray-100 p-3 sm:p-4 md:p-2 rounded-lg mb-4 md:mb-3 w-full">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm sm:text-lg md:text-base font-mono font-semibold tracking-wider break-all pr-10">
                                        {generatedPassword}
                                    </p>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                                        {copySuccess && (
                                            <span className="text-green-600 text-xs mr-2 animate-fade-in">
                                                Copied!
                                            </span>
                                        )}
                                        <button 
                                            onClick={copyPasswordToClipboard}
                                            className={`${copySuccess ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'} text-white p-1.5 sm:p-2 md:p-1 rounded-md transition-colors`}
                                            aria-label="Copy password"
                                            title="Copy password"
                                        >
                                            {copySuccess ? (
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    className="h-4 w-4 sm:h-5 sm:w-5 md:h-4 md:w-4" 
                                                    fill="none" 
                                                    viewBox="0 0 24 24" 
                                                    stroke="currentColor"
                                                >
                                                    <path 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round" 
                                                        strokeWidth={2} 
                                                        d="M5 13l4 4L19 7" 
                                                    />
                                                </svg>
                                            ) : (
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    className="h-4 w-4 sm:h-5 sm:w-5 md:h-4 md:w-4" 
                                                    fill="none" 
                                                    viewBox="0 0 24 24" 
                                                    stroke="currentColor"
                                                >
                                                    <path 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round" 
                                                        strokeWidth={2} 
                                                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" 
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="text-amber-600 text-sm md:text-xs font-semibold mb-4 md:mb-3">
                                Please save this password securely. You'll need it to log in.
                            </p>
                            
                            <button 
                                onClick={handleContinueAfterPassword}
                                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 md:py-1.5 md:text-sm rounded-lg font-medium transition-colors w-full"
                            >
                                I've Saved My Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Confirmation Popup */}
            {showConfirmationPopup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md 
                     sm:p-6 md:p-5 max-w-md w-full mx-auto my-8 
                     md:absolute md:top-1/1 md:left-1/2 md:-translate-x-1/1 md:-translate-y-1/1 
                     md:max-w-sm md:mt-16 md:my-0 
                    w-full mx-auto shadow-2xl animate-scale-in">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <svg 
                                    className="w-10 h-10 text-green-600" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24" 
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth="2" 
                                        d="M5 13l4 4L19 7"
                                    ></path>
                                </svg>
                            </div>
                            
                            <h2 className="text-xl font-bold mb-3">Registration Successful!</h2>
                            <p className="text-base mb-5">
                                Your account has been created successfully. Please sign in with your email and password.
                            </p>
                            
                            <button 
                                onClick={handleCloseConfirmation}
                                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors w-full"
                            >
                                Sign In Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
          <Footer/>
        </>
    );
};

export default ExpertForm;


