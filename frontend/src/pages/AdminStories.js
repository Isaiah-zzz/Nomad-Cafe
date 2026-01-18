import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../utils/adminApi';
import AdminNavbar from '../components/AdminNavbar';

const AdminStories = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadStories();
  }, [statusFilter]);

  const loadStories = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllStories(statusFilter || null, null);
      setStories(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load stories');
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
      loadStories();
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
      loadStories();
    } catch (err) {
      setError(err.message || 'Failed to reject story');
    }
  };

  const handleDelete = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return;
    }

    try {
      await adminApi.deleteStory(storyId);
      loadStories();
    } catch (err) {
      setError(err.message || 'Failed to delete story');
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
          <h1>All Stories</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ marginRight: '8px' }}>Filter by status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
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
              onClick={loadStories}
              style={{ marginLeft: '12px' }}
            >
              Retry
            </button>
          </div>
        )}

        <div className="card">
          {stories.length === 0 ? (
            <p>No stories found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Destination</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Emotion</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stories.map((story) => (
                  <tr key={story.id}>
                    <td>{story.destination}</td>
                    <td>
                      <button
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#007bff', 
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                        onClick={() => navigate(`/admin/customers/${story.customer_id}`)}
                      >
                        View Customer
                      </button>
                    </td>
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
                            style={{ marginRight: '4px' }}
                            onClick={() => handleReject(story.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(story.id)}
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

export default AdminStories;

