import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useClientAuth } from '../../context/ClientAuthContext';
import '../Login.css';

const ClientRegister = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useClientAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await register(username, email, password);
    if (result.success) {
      navigate('/client/profile');
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Tavern Agent</h1>
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '12px' }}>
            Register
          </button>
          <div style={{ textAlign: 'center' }}>
            <Link to="/client/login" style={{ color: '#007bff', textDecoration: 'none' }}>
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientRegister;

