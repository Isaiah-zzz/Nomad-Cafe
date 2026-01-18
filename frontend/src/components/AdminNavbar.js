import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import './Navbar.css';

const AdminNavbar = () => {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <Link to="/admin/customers">Tavern Agent Admin</Link>
        </div>
        <div className="navbar-links">
          <Link to="/admin/customers">Customers</Link>
          <Link to="/admin/stories">Stories</Link>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;

