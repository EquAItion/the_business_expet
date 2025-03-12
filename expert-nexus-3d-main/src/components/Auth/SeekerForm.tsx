import React, { useState } from 'react';
import { FaGoogle, FaLinkedinIn } from 'react-icons/fa';
import Navbar from '../layout/Navbar';
import './auth.css'

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
    const [isRightPanelActive, setRightPanelActive] = useState<boolean>(false);

    const handleSignUpClick = (): void => {
        setRightPanelActive(true);
    };

    const handleSignInClick = (): void => {
        setRightPanelActive(false);
    };

    return (
        <>
            <Navbar />
            <div className="pt-20 min-h-screen flex items-center justify-center bg-gray-100">
                <div className={`auth-container ${isRightPanelActive ? 'right-panel-active' : ''}`} id="container">
                    <div className="form-container sign-up-container">
                        <form className="auth-form">
                            <h1>Create Account <br/> As a Solution Seeker</h1>
                            <input type="text" className="auth-input" placeholder="Name" required />
                            <input type="email" className="auth-input" placeholder="Email" required />
                            <input type="password" className="auth-input" placeholder="Password" required />
                            <button type="submit" className="auth-button">Sign Up</button>
                            <span>or use your email for registration</span>
                            <SocialIcons />
                        </form>
                    </div>
                    <div className="form-container sign-in-container">
                        <form className="auth-form">
                            <h1>Sign In <br/> As a Solution Seeker</h1>
                            <input type="email" className="auth-input" placeholder="Email" required />
                            <input type="password" className="auth-input" placeholder="Password" required />
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
        </>
    );
};

export default SeekerForm;
