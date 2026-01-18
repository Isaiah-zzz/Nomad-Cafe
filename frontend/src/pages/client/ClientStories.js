import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clientApi from '../../utils/clientApi';
import { useClientAuth } from '../../context/ClientAuthContext';
import ClientNavbar from '../../components/ClientNavbar';

const ClientStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout } = useClientAuth();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      const data = await clientApi.getMyStories();
      setStories(data);
      setError('');
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/client/login');
        return;
      }
      setError(err.message || 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return;
    }

    try {
      await clientApi.deleteMyStory(storyId);
      loadStories();
    } catch (err) {
      setError(err.message || 'Failed to delete story');
    }
  };

  if (loading) {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>My Stories</h1>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/client/stories/new')}
          >
            Add Story
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
                        style={{ marginRight: '8px' }}
                        onClick={() => navigate(`/client/stories/${story.id}`)}
                      >
                        View
                      </button>
                      {story.status !== 'published' && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(story.id)}
                        >
                          Delete
                        </button>
                      )}
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

export default ClientStories;

