import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClientAuth } from '../context/ClientAuthContext';
import './Navbar.css';

const ClientNavbar = () => {
  const { logout } = useClientAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/client/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <Link to="/client/profile">Tavern Agent</Link>
        </div>
        <div className="navbar-links">
          <Link to="/client/profile">Profile</Link>
          <Link to="/client/stories">My Stories</Link>
          <Link to="/client/stories/published">Published Stories</Link>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default ClientNavbar;

