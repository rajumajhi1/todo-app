import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await login();
      // Success - auth context will handle the redirect
    } catch (error) {
      setError('Failed to sign in. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
      
      <div className="login-card">
        <div className="app-logo">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        
        <h1>Task Manager</h1>
        <p className="login-subtitle">Organize your tasks efficiently</p>
        
        {error && <div className="login-error">{error}</div>}
        
        <button 
          className="google-sign-in" 
          onClick={handleLogin}
          disabled={loading}
        >
          <img src="/google-icon.svg" alt="Google" className="google-icon" />
          <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
        </button>
        
        <div className="login-features">
          <div className="feature-item">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v10l4.24 4.24"></path>
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </div>
            <span>Track daily tasks</span>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <span>Plan for tomorrow</span>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <span>AI task summaries</span>
          </div>
        </div>
        
        <div className="login-footer">
          <p>© {new Date().getFullYear()} Task Manager</p>
        </div>
      </div>
    </div>
  );
};

export default Login; 