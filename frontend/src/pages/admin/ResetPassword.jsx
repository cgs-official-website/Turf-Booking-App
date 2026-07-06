import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import "../../assets/styles/login.css";
import { adminResetPassword } from "../../services/adminApi";
import { FiEye, FiEyeOff } from "react-icons/fi";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await adminResetPassword({ token, password });
      
      setSuccessMsg("Password updated successfully");
      
      // Wait a moment so the user sees the success message
      setTimeout(() => {
        navigate("/admin/login");
      }, 2000);
      
    } catch (err) {
      setError(
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Failed to reset password. The link might be expired."
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
          <h1 className="login-title">New password</h1>
          <p className="login-subtitle">
            Create a strong password
          </p>
        </div>

        <div className="login-card">
          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ color: "#d93025", fontSize: "14px", textAlign: "center", marginBottom: "10px" }}>
                {error}
              </div>
            )}
            
            {successMsg && (
              <div style={{ color: "#0A9847", fontSize: "14px", textAlign: "center", marginBottom: "10px", padding: "10px", backgroundColor: "#f0fdf4", borderRadius: "8px" }}>
                {successMsg}
              </div>
            )}
            
            <div className="form-group">
              <label>New password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || successMsg}
                />
                <button 
                  type="button"
                  className="password-toggle-icon"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm new password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Enter your confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading || successMsg}
                />
                <button 
                  type="button"
                  className="password-toggle-icon"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="login-btn" 
              disabled={loading || successMsg || !token}
              style={{ marginTop: "12px" }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
