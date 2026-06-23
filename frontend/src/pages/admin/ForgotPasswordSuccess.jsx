import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import "../../assets/styles/login.css";

function ForgotPasswordSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = location.state?.email || "admin@gmail.com";
  const resetLink = location.state?.resetLink;

  const handleOpenResetPage = () => {
    if (resetLink) {
      window.location.href = resetLink;
    }
  };

  return (
    <div className="login-page">
      <div className="main-container">
        <div className="logo-section">
          <img src={logo} alt="Namma Ooru Turf" className="login-logo" />
        </div>

        <div className="welcome-section">
          <h1 className="login-title">Welcome Back</h1>
        </div>

        <div className="login-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
          <div style={{ color: '#0A9847', display: 'flex', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>
          
          <p style={{ textAlign: "center", fontSize: "14px", color: "#666", margin: 0, lineHeight: '1.5' }}>
            Verify your email <strong style={{ color: '#0A9847', fontWeight: '500' }}>{email}</strong><br/>
            to reset your password
          </p>

          {resetLink ? (
            <button 
              className="login-btn" 
              onClick={handleOpenResetPage}
            >
              Open Reset Page &rarr;
            </button>
          ) : (
            <p style={{ textAlign: "center", fontSize: "14px", color: "#666", margin: 0 }}>
              Check your email for reset instructions
            </p>
          )}

          <button 
            type="button" 
            className="login-btn" 
            onClick={() => navigate('/admin/login')}
          >
            Return to Login
          </button>

          <p style={{ textAlign: "center", fontSize: "12px", color: "#9a9a9a", margin: 0 }}>
            Didn't receive the email? Check your spam folder<br/>
            or <span style={{ color: '#0A9847', cursor: 'pointer' }} onClick={() => navigate('/admin/forgot-password')}>try again</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordSuccess;
