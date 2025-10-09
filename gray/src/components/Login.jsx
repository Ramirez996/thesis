import React, { useState, useEffect } from "react";
import "../componentDesign/Login.css";
import {
  doSignInWithGoogle,
  doCreateWithEmailAndPassword,
  doSignInWithEmailAndPassword,
  doSignOut,
  doPasswordReset
} from "../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";

const Login = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ name: "", email: "", phone: "", password: "" });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  const handleLoginChange = (e) => {
    setLoginData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegisterChange = (e) => {
    setRegisterData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await doCreateWithEmailAndPassword(registerData.email, registerData.password);
      setIsError(false);
      setMessage("✅ Registration successful!");
      setTimeout(() => {
        setIsLogin(true);
        setRegisterData({ name: "", email: "", phone: "", password: "" });
      }, 1000);
    } catch (error) {
      setIsError(true);
      setMessage("❌ Email already in use.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await doSignInWithEmailAndPassword(loginData.email, loginData.password);
      setIsError(false);
      setMessage("✅ Login successful!");
      setTimeout(() => handleClose(), 1000);
    } catch (error) {
      setIsError(true);
      setMessage("❌ Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage("");
    try {
      await doSignInWithGoogle();
      setIsError(false);
      setMessage("✅ Google Login successful!");
      setTimeout(() => handleClose(), 1000);
    } catch {
      setIsError(true);
      setMessage("❌ Google Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginData.email) {
      setMessage("⚠️ Please enter your email to reset password.");
      setIsError(true);
      return;
    }
    try {
      await doPasswordReset(loginData.email);
      setIsError(false);
      setMessage("✅ Password reset email sent!");
    } catch {
      setIsError(true);
      setMessage("❌ Failed to send reset email.");
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 250);
  };

  return (
    <div className={`modal-overlay fullscreen ${isClosing ? "closing" : ""}`}>
      <div className="modal-content modal-fullscreen">
        <button className="close-button" onClick={handleClose} aria-label="Close modal">
          ×
        </button>

        <h2 className="modal-title">Mental Health</h2>

        <div className="modal-toggle">
          <button className={isLogin ? "active" : ""} onClick={() => setIsLogin(true)}>
            Login
          </button>
          <button className={!isLogin ? "active" : ""} onClick={() => setIsLogin(false)}>
            Sign Up
          </button>
        </div>

        {isLogin ? (
          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={loginData.email}
              onChange={handleLoginChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={loginData.password}
              onChange={handleLoginChange}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="google-sign-in"
              disabled={loading}
            >
              {loading ? "Connecting..." : "Login with Google"}
            </button>
            <p className="forgot-password" onClick={handleForgotPassword}>
              Forgot Password?
            </p>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleRegister}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={registerData.name}
              onChange={handleRegisterChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={registerData.email}
              onChange={handleRegisterChange}
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number (Optional)"
              value={registerData.phone}
              onChange={handleRegisterChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={registerData.password}
              onChange={handleRegisterChange}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>
        )}

        {message && (
          <p className={`auth-message ${isError ? "auth-error" : "auth-success"}`}>{message}</p>
        )}
      </div>
    </div>
  );
};

export default Login;
