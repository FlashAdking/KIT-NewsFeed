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
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'events'
  
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
  const { showSuccess, showError, showInfo } = useToast();
  const API_BASE = 'http://localhost:8080';

  useEffect(() => {
    fetchProfile();
    fetchRegisteredEvents();
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

  const fetchRegisteredEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/registrations/my-events`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setRegisteredEvents(result.data?.registrations || []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
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
        setUser(prev => ({ ...prev, avatar: result.data.url }));
        showSuccess('Profile photo updated!');
      } else {
        showError('Failed to upload photo');
      }
    } catch (error) {
      showError('Network error during upload');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showError('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError('Resume size must be less than 10MB');
      return;
    }

    setUploadingResume(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/auth/upload-resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUser(prev => ({ ...prev, resumeUrl: result.data.url }));
        showSuccess('Resume uploaded successfully!');
      } else {
        showError('Failed to upload resume');
      }
    } catch (error) {
      showError('Network error during upload');
    } finally {
      setUploadingResume(false);
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

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        
        {/* Header */}
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

        {/* Tab Navigation */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile Information
          </button>
          <button
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Registered Events ({registeredEvents.length})
          </button>
        </div>

        {activeTab === 'profile' ? (
          <div className="profile-content-grid">
            {/* Left Card - Avatar & Stats */}
            <div className="profile-card avatar-card">
              <div className="avatar-upload-section">
                <div className="avatar-large" onClick={() => !uploadingPhoto && photoInputRef.current?.click()}>
                  {uploadingPhoto ? (
                    <div className="upload-spinner">Uploading...</div>
                  ) : (
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'User')}&size=200&background=4f46e5&color=fff`}
                      alt={user.fullName}
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
                <span className="user-role-badge">{user.role || 'Student'}</span>
              </div>

              <div className="profile-stats-grid">
                <div className="stat-box">
                  <div className="stat-number">{completeness}%</div>
                  <div className="stat-label">Complete</div>
                </div>
                <div className="stat-box">
                  <div className="stat-number">{registeredEvents.length}</div>
                  <div className="stat-label">Events</div>
                </div>
              </div>

              <div className="resume-section">
                <h4>Resume</h4>
                {user.resumeUrl ? (
                  <div className="resume-uploaded">
                    <a href={user.resumeUrl} target="_blank" rel="noopener noreferrer" className="resume-link">
                      View Resume
                    </a>
                    <button className="upload-resume-btn secondary" onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume}>
                      Update
                    </button>
                  </div>
                ) : (
                  <button className="upload-resume-btn" onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume}>
                    {uploadingResume ? 'Uploading...' : 'Upload Resume'}
                  </button>
                )}
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  style={{ display: 'none' }}
                />
                <small>PDF only, max 10MB</small>
              </div>
            </div>

            {/* Right Card - Information */}
            <div className="profile-card info-card">
              {editMode ? (
                /* Edit Mode */
                <div className="profile-edit-form">
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
                      <label>Department</label>
                      <select name="department" value={formData.department} onChange={handleInputChange}>
                        <option value="">Select Department</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Civil">Civil</option>
                        <option value="Electrical">Electrical</option>
                      </select>
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
                /* View Mode */
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
        ) : (
          /* Registered Events Tab */
          <div className="registered-events-section">
            {registeredEvents.length > 0 ? (
              <div className="events-grid-profile">
                {registeredEvents.map((registration) => (
                  <div key={registration._id} className="event-card-profile" onClick={() => navigate(`/event/${registration.postId._id}`)}>
                    <div className="event-image-profile">
                      <img
                        src={registration.postId.media?.[0]?.url || 'https://via.placeholder.com/400x200?text=Event'}
                        alt={registration.postId.title}
                      />
                    </div>
                    <div className="event-content-profile">
                      <h3>{registration.postId.title}</h3>
                      <div className="event-meta-profile">
                        <span>📅 {new Date(registration.postId.eventDetails?.eventDate).toLocaleDateString()}</span>
                        <span>📍 {registration.postId.eventDetails?.venue}</span>
                      </div>
                      <div className="event-status-profile">
                        <span className={`status-badge ${registration.status}`}>
                          {registration.status}
                        </span>
                        {registration.paymentStatus && (
                          <span className={`payment-badge ${registration.paymentStatus}`}>
                            {registration.paymentStatus}
                          </span>
                        )}
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
