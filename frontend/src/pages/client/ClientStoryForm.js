import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clientApi from '../../utils/clientApi';
import { useClientAuth } from '../../context/ClientAuthContext';
import ClientNavbar from '../../components/ClientNavbar';

const ClientStoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { logout } = useClientAuth();

  const [formData, setFormData] = useState({
    destination: '',
    what_happened: '',
    interesting_things: '',
    artifact: '',
    emotion: '',
    pictures: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      loadStory();
    }
  }, [id]);

  const loadStory = async () => {
    try {
      setLoading(true);
      const story = await clientApi.getMyStory(id);
      setFormData({
        destination: story.destination,
        what_happened: story.what_happened || '',
        interesting_things: story.interesting_things || '',
        artifact: story.artifact || '',
        emotion: story.emotion || '',
        pictures: story.pictures ? story.pictures.join(', ') : '',
      });
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/client/login');
        return;
      }
      setError(err.message || 'Failed to load story');
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
      const submitData = {
        ...formData,
        pictures: formData.pictures
          ? formData.pictures.split(',').map((p) => p.trim()).filter((p) => p)
          : null,
      };

      if (isEdit) {
        await clientApi.updateMyStory(id, submitData);
      } else {
        await clientApi.createStory(submitData);
      }
      navigate('/client/stories');
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/client/login');
        return;
      }
      setError(err.message || 'Failed to save story');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
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
        <h1>{isEdit ? 'Edit Story' : 'New Story'}</h1>

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
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Destination *</label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                required
                maxLength={200}
              />
            </div>
            <div className="form-group">
              <label>What Happened *</label>
              <textarea
                name="what_happened"
                value={formData.what_happened}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Interesting Things</label>
              <textarea
                name="interesting_things"
                value={formData.interesting_things}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Artifact</label>
              <input
                type="text"
                name="artifact"
                value={formData.artifact}
                onChange={handleChange}
                maxLength={200}
              />
            </div>
            <div className="form-group">
              <label>Emotion</label>
              <input
                type="text"
                name="emotion"
                value={formData.emotion}
                onChange={handleChange}
                maxLength={50}
              />
            </div>
            <div className="form-group">
              <label>Pictures (comma-separated URLs)</label>
              <input
                type="text"
                name="pictures"
                value={formData.pictures}
                onChange={handleChange}
                placeholder="url1, url2, url3"
              />
            </div>
            {!isEdit && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#fff3cd', 
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px',
                color: '#856404'
              }}>
                Note: Your story will be submitted for admin approval and will have "pending" status.
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/client/stories')}
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

export default ClientStoryForm;

