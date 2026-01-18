import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../utils/adminApi';
import AdminNavbar from '../components/AdminNavbar';

const StoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStory();
  }, [id]);

  const loadStory = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getStory(id);
      setStory(data);
    } catch (err) {
      setError(err.message || 'Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve and publish this story?')) {
      return;
    }

    try {
      setLoading(true);
      await adminApi.approveStory(id);
      await loadStory(); // Reload to get updated status
    } catch (err) {
      setError(err.message || 'Failed to approve story');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this story?')) {
      return;
    }

    try {
      setLoading(true);
      await adminApi.rejectStory(id);
      await loadStory(); // Reload to get updated status
    } catch (err) {
      setError(err.message || 'Failed to reject story');
    } finally {
      setLoading(false);
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

  if (error || !story) {
    return (
      <>
        <AdminNavbar />
        <div className="container">
          <div style={{ color: '#c33' }}>{error || 'Story not found'}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ marginBottom: '8px' }}>{story.destination}</h1>
            <span style={{
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: 
                story.status === 'published' ? '#d4edda' :
                story.status === 'rejected' ? '#f8d7da' : '#fff3cd',
              color:
                story.status === 'published' ? '#155724' :
                story.status === 'rejected' ? '#721c24' : '#856404'
            }}>
              {story.status?.toUpperCase() || 'PENDING'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {story.status === 'pending' && (
              <>
                <button
                  className="btn btn-success"
                  onClick={handleApprove}
                  disabled={loading}
                >
                  Approve
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={loading}
                >
                  Reject
                </button>
              </>
            )}
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/admin/stories/${id}/edit?customer_id=${story.customer_id}`)}
            >
              Edit
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/admin/customers/${story.customer_id}`)}
            >
              Back
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Story Details</h2>
          <div style={{ marginBottom: '16px' }}>
            <strong>ID:</strong> {story.id}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Customer ID:</strong> {story.customer_id}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Destination:</strong> {story.destination}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>What Happened:</strong>
            <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>{story.what_happened || 'N/A'}</p>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Interesting Things:</strong>
            <p style={{ marginTop: '4px' }}>{story.interesting_things || 'N/A'}</p>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Artifact:</strong> {story.artifact || 'N/A'}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Emotion:</strong> {story.emotion || 'N/A'}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Status:</strong> 
            <span style={{
              marginLeft: '8px',
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
          </div>
          {story.pictures && story.pictures.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <strong>Pictures:</strong>
              <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                {story.pictures.map((pic, idx) => (
                  <li key={idx}>
                    <a href={pic} target="_blank" rel="noopener noreferrer">
                      {pic}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ marginBottom: '16px' }}>
            <strong>Created:</strong> {new Date(story.created_at).toLocaleString()}
          </div>
        </div>
      </div>
    </>
  );
};

export default StoryDetail;

