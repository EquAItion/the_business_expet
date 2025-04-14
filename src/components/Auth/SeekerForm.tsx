import React, { useState } from 'react';
import { FaGoogle, FaLinkedinIn } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import './auth.css'
import { toast } from 'sonner';
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

const SeekerForm: React.FC = () => {
    const navigate = useNavigate();
    const [isRightPanelActive, setRightPanelActive] = useState<boolean>(false);
    const [formStep, setFormStep] = useState(1);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        industry: '',
        password: '',
        confirmPassword: ''
    });
    
    const [formErrors, setFormErrors] = useState({
        email: '',
        industry: '',
        passwordMatch: ''
    });

    const [signInData, setSignInData] = useState({
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
        
        // Clear industry error
        if (name === 'industry') {
            setFormErrors(prev => ({
                ...prev,
                industry: ''
            }));
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

    const validateEmail = (email: string) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            setFormErrors(prev => ({
                ...prev,
                email: 'Please enter a valid email address'
            }));
            return false;
        } else {
            setFormErrors(prev => ({
                ...prev,
                email: ''
            }));
            return true;
        }
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
        
        if (!formData.name.trim()) {
            toast.error('Please enter your name');
            return;
        }
        
        if (!formData.industry.trim()) {
            setFormErrors(prev => ({
                ...prev,
                industry: 'Industry is required'
            }));
            toast.error('Please select your industry');
            return;
        }
        
        if (!isEmailValid) {
            toast.error('Please enter a valid email address');
            return;
        }
        
        setFormStep(2);
    };

    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formStep === 2) {
            const passwordsMatch = validatePasswords();
            
            if (!passwordsMatch) {
                toast.error('Passwords do not match');
                return;
            }
        }
        
        try {
            const { confirmPassword, ...dataToSend } = formData;

            const API_BASE_URL = import.meta.env.VITE_API_URL;
            
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...dataToSend,
                    role: 'solution_seeker'
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Registration failed');
            }

            localStorage.setItem('seekerSignupData', JSON.stringify({
                id: result.data.userId,
                name: formData.name,
                email: formData.email,
                industry: formData.industry,
                token: result.data.token
            }));

            toast.success('Registration successful! Please complete your profile.');
            navigate('/auth/SeekerProfileForm');
        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error instanceof Error ? error.message : 'Registration failed');
        }
    };

    const handleSignInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateEmail(signInData.email)) {
            toast.error('Please enter a valid email address');
            return;
        }
        
        const API_BASE_URL = import.meta.env.VITE_API_URL;

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login/seeker`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: signInData.email,
                    password: signInData.password,
                    role: 'solution_seeker'
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login failed');
            }

            localStorage.setItem('user', JSON.stringify({
                email: signInData.email,
                token: result.data.token,
                role: 'solution_seeker'
            }));

            toast.success('Login successful!');
            navigate('/seekerdashboard');
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Login failed. Please check your credentials.');
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
                                        type="text" 
                                        name="industry"
                                        className={`auth-input ${formErrors.industry ? 'border-red-500' : ''}`}
                                        placeholder="Industry" 
                                        value={formData.industry}
                                        onChange={handleInputChange}
                                        required 
                                    />
                                    {formErrors.industry && <p className="text-red-500 text-xs mt-1">{formErrors.industry}</p>}
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
