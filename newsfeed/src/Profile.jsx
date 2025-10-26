import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './components/ToastProvider';
import '../src/css/Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [myPosts, setMyPosts] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]); // For regular students
  const [activeTab, setActiveTab] = useState('profile');
  const [postFilter, setPostFilter] = useState('all');
  const [deletingPost, setDeletingPost] = useState(null);

  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    collegeName: '',
    department: '',
    year: '',
    bio: '',
    skills: '',
    github: '',
    linkedin: '',
    portfolio: '',
  });

  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const API_BASE = 'http://localhost:8080';

  const fetchRepresentativeStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/club-representative/status`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Representative status:', result.data);
        setUser(prev => ({
          ...prev,
          representativeStatus: result.data
        }));
      }
    } catch (error) {
      console.log('ℹ️ Representative feature not available');
    }
  };

  const fetchMyPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/posts/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setMyPosts(result.data?.posts || []);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  // ✅ Fetch registered events for regular students
  const fetchRegisteredEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/events/registered`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setRegisteredEvents(result.data?.events || []);
      }
    } catch (error) {
      console.log('No registered events found');
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      await fetchProfile();
      await fetchRepresentativeStatus();
      await fetchMyPosts();
      await fetchRegisteredEvents();
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Please login to view profile');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        const userData = result.user || result.data?.user;
        console.log('👤 User data:', userData);
        setUser(userData);
        setFormData({
          fullName: userData.fullName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          collegeName: userData.collegeName || '',
          department: userData.department || '',
          year: userData.year || '',
          bio: userData.bio || '',
          skills: userData.skills?.join(', ') || '',
          github: userData.socialLinks?.github || '',
          linkedin: userData.socialLinks?.linkedin || '',
          portfolio: userData.socialLinks?.portfolio || '',
        });
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        showError('Session expired. Please login again');
        navigate('/login');
      }
    } catch (error) {
      showError('Network error. Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      setDeletingPost(postId);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showSuccess('Post deleted successfully');
        fetchMyPosts();
      } else {
        const result = await response.json();
        showError(result.message || 'Failed to delete post');
      }
    } catch (error) {
      showError('Network error occurred');
    } finally {
      setDeletingPost(null);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/auth/upload-photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Upload result:', result);

        // ✅ FIX: Update profilePicture, not avatar
        setUser(prev => ({
          ...prev,
          profilePicture: result.data.url // ✅ Changed from 'avatar'
        }));

        showSuccess('Profile photo updated!');
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError('Network error during upload');
    } finally {
      setUploadingPhoto(false);
    }
  };



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const updateData = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        department: formData.department.trim(),
        year: formData.year,
        bio: formData.bio.trim(),
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        socialLinks: {
          github: formData.github.trim(),
          linkedin: formData.linkedin.trim(),
          portfolio: formData.portfolio.trim(),
        },
      };

      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedUser = result.user || result.data?.user;
        setUser(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        setEditMode(false);
        showSuccess('Profile updated successfully!');
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to update profile');
      }
    } catch (error) {
      showError('Network error. Please try again');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      collegeName: user.collegeName || '',
      department: user.department || '',
      year: user.year || '',
      bio: user.bio || '',
      skills: user.skills?.join(', ') || '',
      github: user.socialLinks?.github || '',
      linkedin: user.socialLinks?.linkedin || '',
      portfolio: user.socialLinks?.portfolio || '',
    });
    setEditMode(false);
  };

  const getProfileCompleteness = () => {
    if (!user) return 0;
    const fields = [
      user.fullName,
      user.email,
      user.collegeName,
      user.phone,
      user.department,
      user.year,
      user.bio,
      user.skills?.length > 0,
      user.avatar,
    ];
    const filledFields = fields.filter(f => f).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const getFilteredPosts = () => {
    if (postFilter === 'all') return myPosts;
    return myPosts.filter(post => post.status === postFilter);
  };

  const getPostStats = () => {
    return {
      total: myPosts.length,
      pending: myPosts.filter(p => p.status === 'pending').length,
      published: myPosts.filter(p => p.status === 'published').length,
      rejected: myPosts.filter(p => p.status === 'rejected').length,
    };
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <h3>Loading profile...</h3>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-error">
        <h3>Failed to load profile</h3>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const completeness = getProfileCompleteness();
  const postStats = getPostStats();
  const isActiveRep = user?.representativeStatus?.currentStatus?.isActive;
  const hasPendingApplication = user?.representativeStatus?.applications?.some(app => app.status === 'pending');

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        <div className="profile-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Events
          </button>
          <h1>My Profile</h1>
          {!editMode && activeTab === 'profile' && (
            <button className="edit-btn" onClick={() => setEditMode(true)}>
              Edit Profile
            </button>
          )}
        </div>

        {/* ✅ Dynamic Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile Information
          </button>
          {isActiveRep ? (
            <button
              className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              My Posts ({postStats.total})
            </button>
          ) : (
            <button
              className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              Registered Events ({registeredEvents.length})
            </button>
          )}
        </div>

        {activeTab === 'profile' ? (
          <div className="profile-content-grid">
            {/* Left Card */}
            <div className="profile-card avatar-card">
              <div className="avatar-upload-section">
                <div className="avatar-large" onClick={() => !uploadingPhoto && photoInputRef.current?.click()}>
                  {uploadingPhoto ? (
                    <div className="upload-spinner">Uploading...</div>
                  ) : (
                    // In your profile component
                    <img
                      src={
                        user.profilePicture
                          ? `${API_BASE}${user.profilePicture}`
                          : '/default-avatar.png'
                      }
                      alt="Profile"
                      className="avatar-img"
                    />

                  )}
                  <div className="avatar-overlay">
                    <span>Change Photo</span>
                  </div>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <button className="upload-photo-btn" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}>
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>

              <div className="user-info-compact">
                <h2>{user.fullName}</h2>
                <p className="user-email">{user.email}</p>
                {/* <span className="user-role-badge">{user.role || 'Student'}</span> */}
              </div>

              <div className="profile-stats-grid">
                <div className="stat-box">
                  <div className="stat-number">{completeness}%</div>
                  <div className="stat-label">Complete</div>
                </div>
                <div className="stat-box">
                  <div className="stat-number">{isActiveRep ? postStats.total : registeredEvents.length}</div>
                  <div className="stat-label">{isActiveRep ? 'Posts' : 'Events'}</div>
                </div>
              </div>


              {/* ✅ FIXED: Dynamic Club Representative Section */}
              {(isActiveRep || hasPendingApplication || (!isActiveRep && !hasPendingApplication)) && (
                <div className="rep-section">
                  <div className="rep-header">
                    <h4>Club Representative</h4>
                    {isActiveRep && (
                      <span className="rep-badge active">Active</span>
                    )}
                    {hasPendingApplication && (
                      <span className="rep-badge pending">Pending</span>
                    )}
                  </div>

                  {isActiveRep ? (
                    <div className="rep-content active">
                      <div className="rep-club-info">
                        <div className="rep-club-name">
                          {user.clubRepresentative?.clubId?.clubName ||  // ✅ Changed to clubName
                            user.clubRepresentative?.ClubName || 'N/A'}
                        </div>
                        <div className="rep-position">
                          {user.representativeStatus?.currentStatus?.clubPosition ||
                            user.clubRepresentative?.clubPosition || 'Member'}
                        </div>
                      </div>
                      <button
                        className="create-post-btn"
                        onClick={() => navigate('/create-post')}
                      >
                        <span className="btn-icon">+</span>
                        Create New Post
                      </button>
                    </div>
                  ) : hasPendingApplication ? (
                    <div className="rep-content inactive">
                      <div className="rep-pending">
                        <div className="pending-icon">⏳</div>
                        <p className="pending-text">Application Under Review</p>
                        <small>{user.representativeStatus.applications[0].club?.clubName}</small>
                        <small className="pending-date">
                          Applied: {new Date(user.representativeStatus.applications[0].requestedAt).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  ) : (
                    <div className="rep-content inactive">
                      <p className="rep-message">Become a club representative to create and manage event posts</p>
                      <button
                        className="apply-rep-btn"
                        onClick={() => navigate('/request-representative')}
                      >
                        Apply Now
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Card - Personal Information (INCREASED HEIGHT) */}
            <div className="profile-card info-card">
              {editMode ? (
                <div className="profile-edit-form">
                  {/* Edit form remains same */}
                  <h3>Edit Profile</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 9876543210"
                      />
                    </div>

                    <div className="form-group">
                      <label>Year</label>
                      <select name="year" value={formData.year} onChange={handleInputChange}>
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <label>Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself..."
                      rows="3"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Skills (comma-separated)</label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      placeholder="React, Node.js, Python, Machine Learning"
                    />
                  </div>
                  <div className="form-section-divider">
                    <h4>Social Links</h4>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>GitHub</label>
                      <input
                        type="url"
                        name="github"
                        value={formData.github}
                        onChange={handleInputChange}
                        placeholder="https://github.com/username"
                      />
                    </div>
                    <div className="form-group">
                      <label>LinkedIn</label>
                      <input
                        type="url"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Portfolio</label>
                      <input
                        type="url"
                        name="portfolio"
                        value={formData.portfolio}
                        onChange={handleInputChange}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="cancel-btn" onClick={handleCancel} disabled={saving}>
                      Cancel
                    </button>
                    <button className="save-btn" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="profile-view">
                  <div className="info-section">
                    <h3>Personal Information</h3>
                    <div className="info-items">
                      <div className="info-row">
                        <span className="info-label">Full Name</span>
                        <span className="info-value">{user.fullName}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Email</span>
                        <span className="info-value">{user.email}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Phone</span>
                        <span className="info-value">{user.phone || 'Not provided'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">College</span>
                        <span className="info-value">{user.collegeName}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Department</span>
                        <span className="info-value">{user.department || 'Not provided'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Year</span>
                        <span className="info-value">{user.year ? `${user.year}${getOrdinalSuffix(user.year)} Year` : 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  {user.bio && (
                    <div className="info-section">
                      <h3>About Me</h3>
                      <p className="bio-text">{user.bio}</p>
                    </div>
                  )}

                  {user.skills && user.skills.length > 0 && (
                    <div className="info-section">
                      <h3>Skills</h3>
                      <div className="skills-container">
                        {user.skills.map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(user.socialLinks?.github || user.socialLinks?.linkedin || user.socialLinks?.portfolio) && (
                    <div className="info-section">
                      <h3>Social Links</h3>
                      <div className="social-links-list">
                        {user.socialLinks.github && (
                          <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="social-link-item">
                            <span className="social-icon">🔗</span>
                            <span>GitHub</span>
                          </a>
                        )}
                        {user.socialLinks.linkedin && (
                          <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="social-link-item">
                            <span className="social-icon">🔗</span>
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {user.socialLinks.portfolio && (
                          <a href={user.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="social-link-item">
                            <span className="social-icon">🔗</span>
                            <span>Portfolio</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'posts' ? (
          /* My Posts Management Section (for club representatives) */
          <div className="posts-management-section">
            {/* ... same as before ...  */}
            <div className="posts-header">
              <div className="posts-stats">
                <div className="stat-item">
                  <span className="stat-count">{postStats.total}</span>
                  <span className="stat-label">Total</span>
                </div>
                <div className="stat-item pending">
                  <span className="stat-count">{postStats.pending}</span>
                  <span className="stat-label">Pending</span>
                </div>
                <div className="stat-item published">
                  <span className="stat-count">{postStats.published}</span>
                  <span className="stat-label">Published</span>
                </div>
                <div className="stat-item rejected">
                  <span className="stat-count">{postStats.rejected}</span>
                  <span className="stat-label">Rejected</span>
                </div>
              </div>

              <div className="posts-filters">
                <button
                  className={`filter-chip ${postFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPostFilter('all')}
                >
                  All
                </button>
                <button
                  className={`filter-chip ${postFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setPostFilter('pending')}
                >
                  Pending
                </button>
                <button
                  className={`filter-chip ${postFilter === 'published' ? 'active' : ''}`}
                  onClick={() => setPostFilter('published')}
                >
                  Published
                </button>
                <button
                  className={`filter-chip ${postFilter === 'rejected' ? 'active' : ''}`}
                  onClick={() => setPostFilter('rejected')}
                >
                  Rejected
                </button>
              </div>
            </div>

            {getFilteredPosts().length > 0 ? (
              <div className="posts-grid">
                {getFilteredPosts().map((post) => (
                  <div key={post._id} className="post-management-card">
                    <div className="post-image-container">
                      {/* ✅ Check both imageUrl and media formats */}
                      {post.imageUrl || post.media?.[0]?.url ? (
                        <img
                          src={
                            post.imageUrl
                              ? `${API_BASE}${post.imageUrl}`
                              : post.media[0].url
                          }
                          alt={post.title}
                          className="post-thumbnail"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="post-placeholder">No Image</div>
                      )}
                      <span className={`post-status-badge ${post.status}`}>
                        {post.status}
                      </span>
                    </div>


                    <div className="post-info">
                      <h3 className="post-title">{post.title}</h3>
                      <p className="post-content-preview">
                        {post.content?.substring(0, 100)}...
                      </p>

                      <div className="post-metadata">
                        <span className="post-meta-item">
                          📅 {new Date(post.eventDetails?.eventDate || post.createdAt).toLocaleDateString()}
                        </span>
                        <span className="post-meta-item">
                          👁 {post.views || 0} views
                        </span>
                        {post.priority && (
                          <span className={`priority-tag ${post.priority}`}>
                            {post.priority}
                          </span>
                        )}
                      </div>

                      <div className="post-actions-row">
                        <button
                          className="post-action-btn view"
                          onClick={() => navigate(`/event/${post._id}`)}
                        >
                          <span>👁</span> View
                        </button>
                        {post.status === 'pending' && (
                          <button
                            className="post-action-btn edit"
                            onClick={() => navigate(`/edit-post/${post._id}`)}
                          >
                            <span>✏️</span> Edit
                          </button>
                        )}
                        <button
                          className="post-action-btn delete"
                          onClick={() => handleDeletePost(post._id)}
                          disabled={deletingPost === post._id}
                        >
                          <span>🗑️</span> {deletingPost === post._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-posts-state">
                <div className="no-posts-icon">📝</div>
                <h3>No {postFilter !== 'all' ? postFilter : ''} posts</h3>
                <p>
                  {postFilter === 'all'
                    ? 'Start creating event posts for your club'
                    : `You don't have any ${postFilter} posts`
                  }
                </p>
                <button
                  className="create-first-post-btn"
                  onClick={() => navigate('/create-post')}
                >
                  Create Your First Post
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ✅ Registered Events Section (for regular students) */
          <div className="registered-events-section">
            {registeredEvents.length > 0 ? (
              <div className="events-grid-profile">
                {registeredEvents.map((event) => (
                  <div
                    key={event._id}
                    className="event-card-profile"
                    onClick={() => navigate(`/event/${event._id}`)}
                  >
                    <div className="event-image-profile">
                      <img
                        src={event.media?.[0]?.url || 'https://via.placeholder.com/400x200?text=Event'}
                        alt={event.title}
                      />
                    </div>
                    <div className="event-content-profile">
                      <h3>{event.title}</h3>
                      <div className="event-meta-profile">
                        <span>📅 {new Date(event.eventDetails?.eventDate).toLocaleDateString()}</span>
                        <span>📍 {event.eventDetails?.venue || 'TBA'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-events-profile">
                <div className="no-events-icon">📅</div>
                <h3>No Registered Events</h3>
                <p>You haven't registered for any events yet</p>
                <button className="browse-events-btn" onClick={() => navigate('/')}>
                  Browse Events
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const getOrdinalSuffix = (num) => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

export default Profile;
