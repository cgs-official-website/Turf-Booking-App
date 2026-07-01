import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import "../../assets/styles/login.css";

function ForgotPasswordSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = location.state?.email || "admin@gmail.com";

  const handleOpenEmail = () => {
    // Open Gmail in a new tab
    window.open("https://mail.google.com", "_blank");
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

        <div className="login-card">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Circular Envelope Icon */}
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              border: '4px solid #f4f4f5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0A9847" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            
            <h2 style={{ 
              fontSize: '15px', 
              color: '#334155', 
              fontWeight: '500', 
              margin: '0 0 6px 0',
              textAlign: 'center'
            }}>
              Verify your email <span style={{ color: '#0A9847' }}>{email}</span>
            </h2>
            
            <p style={{ 
              fontSize: '15px', 
              color: '#334155', 
              fontWeight: '500', 
              margin: '0 0 24px 0',
              textAlign: 'center'
            }}>
              to reset your password
            </p>

            <button 
              type="button" 
              className="login-btn" 
              onClick={handleOpenEmail}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                width: '100%',
                marginBottom: '24px'
              }}
            >
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '4px', 
                padding: '2px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.728L12 16.669 5.455 11.728v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 10.468l8.073-6.975C21.691 2.279 24 3.434 24 5.457z" fill="#EA4335"/>
                  <path d="M12 10.468L3.927 3.493A1.636 1.636 0 0 1 5.455 2.727h13.09a1.636 1.636 0 0 1 1.528.766L12 10.468z" fill="#D14836"/>
                  <path d="M0 5.457v13.909c0 .904.732 1.636 1.636 1.636h3.819V11.728L0 7.363V5.457z" fill="#C5221F"/>
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.728l5.455-4.365V5.457z" fill="#F4B400"/>
                </svg>
              </div>
              <span style={{ fontSize: '15px', fontWeight: '500' }}>Open Gmail</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>

            <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b", margin: 0 }}>
              Didn't receive the email? Check your spam folder<br/>
              or <span style={{ color: '#0A9847', cursor: 'pointer' }} onClick={() => navigate('/admin/forgot-password')}>try again.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordSuccess;
