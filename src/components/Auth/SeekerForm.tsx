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
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    // Add new state for sign in form data
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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Add handler for sign in input changes
    const handleSignInInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSignInData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSignUpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    role: 'solution_seeker'
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Registration failed');
            }

            // Store signup data and token in localStorage
            localStorage.setItem('seekerSignupData', JSON.stringify({
                ...formData,
                token: result.data.token
            }));

            toast.success('Registration successful!');
            // Navigate to home page after successful registration
            navigate('/');
        } catch (error) {
            console.error('Registration error:', error);
            // Handle error - show error message to user
        }
    };

    // Add sign in submit handler
    const handleSignInSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
<<<<<<< HEAD
            const response = await fetch('http://localhost:5000/api/auth/login/seeker', {
=======
            const response = await fetch('http://localhost:5000/api/auth/login', {
>>>>>>> 852e4c3e570eb3d89277cdae7d3cfc8aba7ea042
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

            // Store user data and token in localStorage
            localStorage.setItem('user', JSON.stringify({
                email: signInData.email,
                token: result.data.token,
                role: 'solution_seeker'
            }));

            toast.success('Login successful!');
            // Navigate to seeker dashboard after successful login
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
                                type="password" 
                                name="password"
                                className="auth-input" 
                                placeholder="Password" 
                                value={formData.password}
                                onChange={handleInputChange}
                                required 
                            />
                            <button type="submit" className="auth-button">Sign Up</button>
                            <span>or use your email for registration</span>
                            <SocialIcons />
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
