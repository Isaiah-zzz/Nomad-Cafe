import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import adminApi from '../utils/adminApi';
import AdminNavbar from '../components/AdminNavbar';

const StoryForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const customerId = searchParams.get('customer_id');

  const [formData, setFormData] = useState({
    customer_id: customerId || '',
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
      const story = await adminApi.getStory(id);
      setFormData({
        customer_id: story.customer_id,
        destination: story.destination,
        what_happened: story.what_happened || '',
        interesting_things: story.interesting_things || '',
        artifact: story.artifact || '',
        emotion: story.emotion || '',
        pictures: story.pictures ? story.pictures.join(', ') : '',
      });
    } catch (err) {
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
        await adminApi.updateStory(id, submitData);
      } else {
        // Admin cannot create stories - stories are created by clients
        throw new Error('Admins cannot create stories. Stories must be created by clients.');
      }
      navigate(`/admin/customers/${formData.customer_id}`);
    } catch (err) {
      setError(err.message || 'Failed to save story');
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
        <h1>{isEdit ? 'Edit Story' : 'New Story'}</h1>

        {error && <div style={{ color: '#c33', marginBottom: '16px' }}>{error}</div>}

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Customer ID (UUID)</label>
              <input
                type="text"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                required
                disabled={isEdit}
              />
            </div>
            <div className="form-group">
              <label>Destination</label>
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
              <label>What Happened</label>
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(`/admin/customers/${formData.customer_id}`)}
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

export default StoryForm;

