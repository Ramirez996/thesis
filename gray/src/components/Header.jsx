import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../componentDesign/HeaderFooter.css";
import LoginModal from "./Login";  // Ensure the path to your LoginModal component is correct
import { auth } from "../firebase/firebase";  // Import Firebase auth configuration
import { signOut } from "firebase/auth";  // Import Firebase signOut method

const Header = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState(null);  // Track the user authentication state

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);  // Set user state if logged in or null if logged out
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const handleLoginClick = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);  // Sign the user out
      alert("Logout successful!");
    } catch (error) {
      alert("Logout failed.");
    }
  };

  return (
    <>
      <div className="header">
        <Link to="/" className="home-button">
          <i className="fa fa-home"></i>
        </Link>

        <div className="header-content">
          <h1>Making Mental Health Accessible and Efficient</h1>
          <p>Take the test to assess your mental distress</p>
        </div>

        {user ? (
          <button className="login-button" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <button className="login-button" onClick={handleLoginClick}>
            Login
          </button>
        )}
      </div>

      {/* Conditionally render the LoginModal */}
      {isModalOpen && <LoginModal visible={isModalOpen} onClose={handleCloseModal} />}
    </>
  );
};

export default Header;
