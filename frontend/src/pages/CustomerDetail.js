import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../utils/adminApi';
import AdminNavbar from '../components/AdminNavbar';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getCustomer(id);
      setCustomer(data);
    } catch (err) {
      setError(err.message || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (storyId) => {
    if (!window.confirm('Are you sure you want to approve and publish this story?')) {
      return;
    }

    try {
      await adminApi.approveStory(storyId);
      await loadCustomer(); // Reload to get updated status
    } catch (err) {
      setError(err.message || 'Failed to approve story');
    }
  };

  const handleReject = async (storyId) => {
    if (!window.confirm('Are you sure you want to reject this story?')) {
      return;
    }

    try {
      await adminApi.rejectStory(storyId);
      await loadCustomer(); // Reload to get updated status
    } catch (err) {
      setError(err.message || 'Failed to reject story');
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

  if (error || !customer) {
    return (
      <>
        <AdminNavbar />
        <div className="container">
          <div style={{ color: '#c33' }}>{error || 'Customer not found'}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>{customer.name}</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/admin/customers/${id}/edit`)}
            >
              Edit
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/admin/customers')}
            >
              Back
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Customer Details</h2>
          <div style={{ marginBottom: '16px' }}>
            <strong>ID:</strong> {customer.id}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>User ID:</strong> {customer.user_id}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Personality Traits:</strong>
            <p style={{ marginTop: '4px' }}>{customer.personality_traits || 'N/A'}</p>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Visual Description:</strong>
            <p style={{ marginTop: '4px' }}>{customer.visual_description || 'N/A'}</p>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Created:</strong> {new Date(customer.created_at).toLocaleString()}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>Stories ({customer.stories?.length || 0})</h2>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/admin/stories/new?customer_id=${id}`)}
            >
              Add Story
            </button>
          </div>

          {customer.stories && customer.stories.length > 0 ? (
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
                        {story.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td>{story.emotion || '-'}</td>
                    <td>{new Date(story.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ marginRight: '4px' }}
                        onClick={() => navigate(`/admin/stories/${story.id}`)}
                      >
                        View
                      </button>
                      {story.status === 'pending' && (
                        <>
                          <button
                            className="btn btn-success"
                            style={{ marginRight: '4px' }}
                            onClick={() => handleApprove(story.id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleReject(story.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
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

export default CustomerDetail;

