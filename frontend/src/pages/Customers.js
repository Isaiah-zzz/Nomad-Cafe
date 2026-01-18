import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../utils/adminApi';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminNavbar from '../components/AdminNavbar';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getCustomers();
      setCustomers(data);
      setError('');
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/admin/login');
        return;
      }
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      await adminApi.deleteCustomer(customerId);
      loadCustomers();
    } catch (err) {
      setError(err.message || 'Failed to delete customer');
    }
  };

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <div className="container">Loading...</div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Customers</h1>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/customers/new')}
          >
            Add Customer
          </button>
        </div>

        {error && (
          <div style={{ 
            color: '#c33', 
            marginBottom: '16px', 
            padding: '12px', 
            backgroundColor: '#fee', 
            borderRadius: '4px',
            border: '1px solid #fcc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{error}</span>
            <button 
              className="btn btn-primary" 
              onClick={loadCustomers}
              style={{ marginLeft: '12px' }}
            >
              Retry
            </button>
          </div>
        )}

        <div className="card">
          {customers.length === 0 ? (
            <p>No customers found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Personality Traits</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.personality_traits || '-'}</td>
                    <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '8px' }}
                        onClick={() => navigate(`/admin/customers/${customer.id}`)}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(customer.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default Customers;

