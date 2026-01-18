import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clientApi from '../../utils/clientApi';
import { useClientAuth } from '../../context/ClientAuthContext';
import ClientNavbar from '../../components/ClientNavbar';

const ClientProfile = () => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    personality_traits: '',
    visual_description: '',
  });
  const navigate = useNavigate();
  const { logout } = useClientAuth();

  useEffect(() => {
    loadCustomer();
  }, []);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const data = await clientApi.getMyCustomerWithStories();
      setCustomer(data);
      setFormData({
        name: data.name,
        personality_traits: data.personality_traits || '',
        visual_description: data.visual_description || '',
      });
      setError('');
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/client/login');
        return;
      }
      setError(err.message || 'Failed to load profile');
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
      const updated = await clientApi.updateMyCustomer(formData);
      setCustomer({ ...customer, ...updated });
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !customer) {
    return (
      <>
        <ClientNavbar />
        <div className="container">Loading...</div>
      </>
    );
  }

  return (
    <>
      <ClientNavbar />
      <div className="container">
        <h1>My Profile</h1>

        {error && (
          <div style={{ 
            color: '#c33', 
            marginBottom: '16px', 
            padding: '12px', 
            backgroundColor: '#fee', 
            borderRadius: '4px',
            border: '1px solid #fcc'
          }}>
            {error}
          </div>
        )}

        <div className="card">
          {editing ? (
            <form onSubmit={handleSubmit}>
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
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: customer.name,
                      personality_traits: customer.personality_traits || '',
                      visual_description: customer.visual_description || '',
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>{customer?.name}</h2>
                <button className="btn btn-primary" onClick={() => setEditing(true)}>
                  Edit Profile
                </button>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Personality Traits:</strong>
                <p style={{ marginTop: '4px' }}>{customer?.personality_traits || 'N/A'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Visual Description:</strong>
                <p style={{ marginTop: '4px' }}>{customer?.visual_description || 'N/A'}</p>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>My Stories ({customer?.stories?.length || 0})</h2>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/client/stories/new')}
            >
              Add Story
            </button>
          </div>

          {customer?.stories && customer.stories.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Emotion</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customer.stories.map((story) => (
                  <tr key={story.id}>
                    <td>{story.destination}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: 
                          story.status === 'published' ? '#d4edda' :
                          story.status === 'rejected' ? '#f8d7da' : '#fff3cd',
                        color:
                          story.status === 'published' ? '#155724' :
                          story.status === 'rejected' ? '#721c24' : '#856404'
                      }}>
                        {story.status}
                      </span>
                    </td>
                    <td>{story.emotion || '-'}</td>
                    <td>{new Date(story.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => navigate(`/client/stories/${story.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No stories yet.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientProfile;

