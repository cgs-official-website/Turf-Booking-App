import React, { useState } from "react";
import logo from "../../assets/images/logo.png";
import "../../assets/styles/login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    console.log("Login Data:", {
      email,
      password,
    });

    // TODO:
    // Call login API here
    // Navigate to dashboard after success
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
            <div className="form-group">
              <label>E-mail Address</label>
              <input
                type="email"
                placeholder="Enter your e-mail address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              />
            </div>

            <div className="forgot-password">
              Forgot password?
            </div>

            <button
              type="submit"
              className="login-btn"
            >
              Log In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;