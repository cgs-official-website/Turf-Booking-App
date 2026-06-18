import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import "../../assets/styles/login.css";
import { adminLogin } from "../../services/adminApi";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const data = await adminLogin({ email, password });
      
      console.log("LOGIN RESPONSE:", data);
      console.log("Stored Token:", data.data.token);
      console.log("Stored Admin:", data.data.admin);
      
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("admin", JSON.stringify(data.data.admin));
      
      console.log(localStorage.getItem("token"));
      console.log(localStorage.getItem("admin"));
      
      navigate("/admin/dashboard");
    } catch (err) {
      setError(
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="main-container">
        <div className="logo-section">
          <img
            src={logo}
            alt="Namma Ooru Turf"
            className="login-logo"
          />
        </div>

        <div className="welcome-section">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">
            Login to your account and continue
          </p>
        </div>

        <div className="login-card">
          <form className="login-form" onSubmit={handleLogin}>
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

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="forgot-password">
              Forgot password?
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;

