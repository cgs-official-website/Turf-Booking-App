import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import "../../assets/styles/login.css";
import { adminForgotPassword } from "../../services/adminApi";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      const data = await adminForgotPassword({ email });

      // Navigate to success page and pass email and resetLink (if provided in phase 1)
      navigate("/admin/forgot-password-success", {
        state: {
          email: email,
          resetLink: data.resetLink
        }
      });
    } catch (err) {
      setError(
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Failed to generate reset link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="main-container">
        <div className="logo-section">
          <img src={logo} alt="Namma Ooru Turf" className="login-logo" />
        </div>

        <div className="welcome-section">
          <h1 className="login-title">Forgot Password</h1>
          <p className="login-subtitle">
            Enter your email to receive a password reset link
          </p>
        </div>

        <div className="login-card">
          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ color: "#d93025", fontSize: "14px", textAlign: "center", marginBottom: "10px" }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label>E-mail Address</label>
              <input
                type="email"
                placeholder="Enter your e-mail address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Link 
              to="/admin/login"
              style={{ 
                color: '#0A9847', 
                textDecoration: 'none', 
                fontSize: '13px', 
                textAlign: 'right',
                marginTop: '-4px',
                marginBottom: '10px',
                display: 'block',
                fontWeight: '500'
              }}
            >
              Back to Login
            </Link>

            <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
