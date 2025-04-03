import React, { useState, useRef } from 'react';
import { FaGoogle, FaLinkedinIn } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import './auth.css';
import { toast } from 'react-hot-toast';
import Footer from '../layout/Footer';
import { motion, AnimatePresence } from 'framer-motion';

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

const ExpertForm: React.FC = () => {
    const navigate = useNavigate();
    const [isRightPanelActive, setRightPanelActive] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [formStep, setFormStep] = useState(1); // Track form step
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const formRef = useRef<HTMLDivElement>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '', 
        confirmPassword: '', // Add this field
        industry: ''
    });

    // Add new state for login form
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

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
        
        // Check password match immediately with the updated values
        if (name === 'password' || name === 'confirmPassword') {
            if (updatedFormData.password && updatedFormData.confirmPassword) {
                const doPasswordsMatch = updatedFormData.password === updatedFormData.confirmPassword;
                setPasswordsMatch(doPasswordsMatch);
            } else {
                setPasswordsMatch(true); // Reset to true if either field is empty
            }
        }
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

    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Final validation
        if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.industry.trim()) {
            setError('All fields are required');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }
        
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    role: 'expert'
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Registration failed');
            }

            // Store signup data and token in localStorage
            localStorage.setItem('expertSignupData', JSON.stringify({
                ...formData,
                token: result.data.token
            }));

            toast.success('Registration successful! Please complete your profile.');
            // Navigate to expert profile form page
            navigate('/auth/ExpertProfileForm');
        } catch (error) {
            console.error('Registration error:', error);
            setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
        }
    };

    // Add login submit handler
    const handleSignInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/login/expert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login failed');
            }

            // Store user data
            const userData = {
                user_id: result.data.user_id,
                name: result.data.name,
                email: result.data.email,
                role: result.data.role,
                token: result.data.token
                
            };

            localStorage.setItem('user', JSON.stringify(userData));

            toast.success('Login successful!');
            // Use the existing dashboard route
            navigate('/dashboard');

        } catch (error) {
            console.error('Login error:', error);
            setError(error instanceof Error ? error.message : 'Login failed');
            toast.error(error instanceof Error ? error.message : 'Login failed');
        }
    };

    // const handleLoginSubmit = async (e: React.FormEvent) => {
    //     e.preventDefault();
    //     setError('');

    //     try {
    //         const response = await fetch('http://localhost:5000/api/auth/login', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify(loginData)
    //         });

    //         const result = await response.json();

    //         if (!response.ok) {
    //             throw new Error(result.message || 'Login failed');
    //         }

    //         // Store user data
    //         localStorage.setItem('user', JSON.stringify({
    //             id: result.data.id,
    //             name: result.data.name,
    //             email: result.data.email,
    //             role: result.data.role,
    //             token: result.data.token
    //         }));

    //         toast.success('Login successful!');
    //         // Update navigation path to match new route structure
    //         navigate(`/expert/dashboard/${result.data.id}`);

    //     } catch (error) {
    //         console.error('Login error:', error);
    //         setError(error instanceof Error ? error.message : 'Login failed');
    //         toast.error(error instanceof Error ? error.message : 'Login failed');
    //     }
    // };

    // Add this function after your other handleInputChange functions
    const sendWelcomeEmail = async (name: string, email: string) => {
        try {
            const response = await fetch('http://localhost:5000/api/email/welcome', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    role: 'expert'
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                console.error('Error sending welcome email:', data.message);
                return false;
            }
            
            if (data.previewUrl) {
                window.open(data.previewUrl, '_blank');
                toast.success('Email preview opened in new tab');
            }
            
            return true;
        } catch (error) {
            console.error('Error sending welcome email:', error);
            return false;
        }
    };

    // Update your handleContinue function
    const handleContinue = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        
        // Basic validation for first step
        if (!formData.name.trim() || !formData.email.trim() || !formData.industry.trim()) {
            setError('Name, email, and industry are required');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }
        
        // Send welcome email
        const emailSent = await sendWelcomeEmail(formData.name, formData.email);
        if (emailSent) {
            toast.success('Welcome email sent! Please check your inbox.');
        }
        
        // Scroll to top of page smoothly
        window.scrollTo({top: 0, behavior: 'smooth'});
        
        // Move to second step
        setFormStep(2);
    };

    // Add password confirmation check
    const checkPasswordsMatch = () => {
        if (formData.password && formData.confirmPassword) {
            setPasswordsMatch(formData.password === formData.confirmPassword);
        } else {
            setPasswordsMatch(true);
        }
    };

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
                            
                            {/* Use AnimatePresence to control animations for both steps */}
                            <AnimatePresence mode="wait">
                                {formStep === 1 ? (
                                    /* Step 1 - Initial Information */
                                    <motion.div 
                                        key="step1"
                                        className="w-full"
                                        initial={{ x: 0, opacity: 1 }}
                                        exit={{ x: -300, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
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
                                        <input 
                                            type="text" 
                                            name="industry"
                                            className="auth-input" 
                                            placeholder="Industry" 
                                            value={formData.industry}
                                            onChange={handleInputChange}
                                            required 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleContinue} 
                                            className="auth-button mt-4"
                                        >
                                            Continue
                                        </button>
                                    </motion.div>
                                ) : (
                                    /* Step 2 - Password Information */
                                    <motion.div
                                        key="step2"
                                        className="w-full"
                                        initial={{ x: 300, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
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
                                            className={`auth-input ${
                                                !passwordsMatch && formData.confirmPassword 
                                                    ? 'border-red-500' 
                                                    : (passwordsMatch && formData.confirmPassword && formData.password) 
                                                        ? 'border-green-500' 
                                                        : ''
                                            }`}
                                            placeholder="Confirm Password" 
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            required 
                                        />
                                        {!passwordsMatch && formData.confirmPassword && (
                                            <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                                        )}
                                        {passwordsMatch && formData.password && formData.confirmPassword && (
                                            <p className="text-green-500 text-xs mt-1">Passwords match ✓</p>
                                        )}
                                        
                                        <div className="flex w-full mt-4">
                                            {/* <button 
                                                type="button" 
                                                onClick={() => setFormStep(1)} 
                                                className="auth-button-secondary mr-3"
                                                style={{ 
                                                    width: '120px',
                                                    padding: '2px 2px',  // Reduce padding from default (likely 12px)
                                                    fontSize: '11px'      // Slightly smaller font
                                                }}
                                            >
                                                Back
                                            </button> */}
                                            <button 
                                                type="submit" 
                                                className="auth-button flex-1"  // Keep flex-1 to take remaining space
                                                disabled={!passwordsMatch}
                                            >
                                                Sign Up
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            {/* Show social icons on both steps */}
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
          <Footer/>
        </>
    );
};

export default ExpertForm;
