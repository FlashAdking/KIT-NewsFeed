import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from './components/ToastProvider';

function CreatePost() {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: '',
    postType: 'event',
    priority: 'medium',
    eventDetails: {
      eventDate: '',
      eventTime: '',
      venue: '',
      maxParticipants: '',
    },
    registrationLink: '',
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchPost(id);
    }
    // eslint-disable-next-line
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data?.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchPost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/posts/${postId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        const post = result.data?.post || result.post;
        setFormData({
          title: post.title,
          content: post.content,
          categoryId: post.categoryId?._id || post.categoryId,
          postType: post.postType,
          priority: post.priority,
          eventDetails: post.eventDetails || {},
          registrationLink: post.registrationLink || '',
        });
      }
    } catch (error) {
      showError('Failed to load post');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('eventDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        eventDetails: {
          ...prev.eventDetails,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = id 
        ? `http://localhost:8080/api/posts/${id}`
        : 'http://localhost:8080/api/posts';
      
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(id ? 'Post updated successfully!' : 'Post created successfully!');
        navigate('/profile');
      } else {
        showError(result.message || 'Failed to save post');
      }
    } catch (error) {
      showError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate('/profile')}>
            ← Back
          </button>
          <h1>{id ? 'Edit Post' : 'Create New Post'}</h1>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter post title"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Content *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Enter post content"
              required
              rows="6"
              style={styles.textarea}
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label>Category *</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                style={styles.select}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label>Post Type *</label>
              <select
                name="postType"
                value={formData.postType}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="event">Event</option>
                <option value="announcement">Announcement</option>
                <option value="news">News</option>
                <option value="general">General</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label>Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {formData.postType === 'event' && (
            <>
              <h3 style={styles.sectionTitle}>Event Details</h3>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Event Date *</label>
                  <input
                    type="date"
                    name="eventDetails.eventDate"
                    value={formData.eventDetails.eventDate}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label>Event Time</label>
                  <input
                    type="time"
                    name="eventDetails.eventTime"
                    value={formData.eventDetails.eventTime}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Venue</label>
                  <input
                    type="text"
                    name="eventDetails.venue"
                    value={formData.eventDetails.venue}
                    onChange={handleChange}
                    placeholder="Event location"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label>Max Participants</label>
                  <input
                    type="number"
                    name="eventDetails.maxParticipants"
                    value={formData.eventDetails.maxParticipants}
                    onChange={handleChange}
                    placeholder="Optional"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label>Registration Link</label>
                <input
                  type="url"
                  name="registrationLink"
                  value={formData.registrationLink}
                  onChange={handleChange}
                  placeholder="https://example.com/register"
                  style={styles.input}
                />
              </div>
            </>
          )}

          <div style={styles.actions}>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              style={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Saving...' : id ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  wrapper: {
    maxWidth: '900px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '15px',
    padding: '40px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px',
  },
  backBtn: {
    padding: '10px 20px',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  input: {
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '15px',
  },
  textarea: {
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '15px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  select: {
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '15px',
  },
  sectionTitle: {
    marginTop: '20px',
    marginBottom: '10px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    marginTop: '20px',
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtn: {
    flex: 1,
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default CreatePost;
