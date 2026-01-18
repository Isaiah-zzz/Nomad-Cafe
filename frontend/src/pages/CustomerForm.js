import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../utils/adminApi';
import AdminNavbar from '../components/AdminNavbar';

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    personality_traits: '',
    visual_description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      loadCustomer();
    }
  }, [id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const customer = await adminApi.getCustomer(id);
      setFormData({
        user_id: customer.user_id,
        name: customer.name,
        personality_traits: customer.personality_traits || '',
        visual_description: customer.visual_description || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        await adminApi.updateCustomer(id, formData);
        navigate(`/admin/customers/${id}`);
      } else {
        const newCustomer = await adminApi.createCustomer(formData);
        navigate(`/admin/customers/${newCustomer.id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
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
        <h1>{isEdit ? 'Edit Customer' : 'New Customer'}</h1>

        {error && <div style={{ color: '#c33', marginBottom: '16px' }}>{error}</div>}

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>User ID (UUID)</label>
              <input
                type="text"
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                required
                disabled={isEdit}
              />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                maxLength={100}
              />
            </div>
            <div className="form-group">
              <label>Personality Traits</label>
              <textarea
                name="personality_traits"
                value={formData.personality_traits}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Visual Description</label>
              <textarea
                name="visual_description"
                value={formData.visual_description}
                onChange={handleChange}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/admin/customers')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CustomerForm;

