import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './components/ToastProvider';
import '../src/css/AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({
    pendingRepresentatives: 0,
    pendingPosts: 0,
    totalUsers: 0,
    totalEvents: 0,
  });

  // Representative Requests
  const [representativeRequests, setRepresentativeRequests] = useState([]);
  const [representativeHistory, setRepresentativeHistory] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Posts
  const [posts, setPosts] = useState([]);
  const [postFilter, setPostFilter] = useState('pending');
  const [selectedPost, setSelectedPost] = useState(null);

  // Admin Management
  const [admins, setAdmins] = useState([]);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    email: '',
    password: '',
    fullName: '',
    adminLevel: 'department',
    permissions: [],
  });

  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();
  const API_BASE = 'http://localhost:8080';

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (adminUser) {
      loadDashboardData();
    }
  }, [activeTab, adminUser]);

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Please login as admin');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        const user = result.user || result.data?.user;
        
        if (user.role !== 'admin') {
          showError('Admin access required');
          navigate('/');
          return;
        }
        
        setAdminUser(user);
        setLoading(false);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      showError('Failed to verify admin access');
      navigate('/login');
    }
  };

  const loadDashboardData = async () => {
    switch (activeTab) {
      case 'overview':
        await loadStats();
        break;
      case 'representatives':
        await loadRepresentativeRequests();
        break;
      case 'posts':
        await loadPosts();
        break;
      case 'admins':
        if (adminUser?.adminProfile?.adminLevel === 'super') {
          await loadAdmins();
        }
        break;
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load pending representatives
      const repResponse = await fetch(`${API_BASE}/api/admin/representatives/pending`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const repData = await repResponse.json();
      
      // Load pending posts
      const postsResponse = await fetch(`${API_BASE}/api/posts?status=pending&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const postsData = await postsResponse.json();

      setStats({
        pendingRepresentatives: repData.data?.count || 0,
        pendingPosts: postsData.data?.pagination?.totalPosts || 0,
        totalUsers: 0, // Add endpoint if available
        totalEvents: postsData.data?.pagination?.totalPosts || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadRepresentativeRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/representatives/pending`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setRepresentativeRequests(result.data?.requests || []);
      }

      // Load history
      const historyResponse = await fetch(`${API_BASE}/api/admin/representatives/history`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (historyResponse.ok) {
        const historyResult = await historyResponse.json();
        setRepresentativeHistory(historyResult.data || []);
      }
    } catch (error) {
      showError('Failed to load representative requests');
    }
  };

  const processRepresentativeRequest = async (membershipId, decision) => {
    try {
      setProcessingId(membershipId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/api/admin/representatives/${membershipId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision,
          adminNotes: selectedRequest?.adminNotes || '',
          reviewMethod: 'standard',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(`Request ${decision} successfully!`);
        setSelectedRequest(null);
        await loadRepresentativeRequests();
        await loadStats();
      } else {
        showError(result.message || `Failed to ${decision} request`);
      }
    } catch (error) {
      showError('Network error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const loadPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/posts?status=${postFilter}&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setPosts(result.data?.posts || []);
      }
    } catch (error) {
      showError('Failed to load posts');
    }
  };

  const moderatePost = async (postId, action, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/posts/${postId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action, notes }),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(`Post ${action}d successfully!`);
        setSelectedPost(null);
        await loadPosts();
        await loadStats();
      } else {
        showError(result.message || 'Failed to moderate post');
      }
    } catch (error) {
      showError('Network error occurred');
    }
  };

  const loadAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      // You'll need to add this endpoint to your backend
      const response = await fetch(`${API_BASE}/api/admin/list`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setAdmins(result.data?.admins || []);
      }
    } catch (error) {
      console.error('Failed to load admins:', error);
    }
  };

  const createNewAdmin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: newAdminData.userId,
          adminLevel: newAdminData.adminLevel,
          permissions: newAdminData.permissions,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess('Admin created successfully!');
        setShowCreateAdminModal(false);
        setNewAdminData({
          email: '',
          password: '',
          fullName: '',
          adminLevel: 'department',
          permissions: [],
        });
        await loadAdmins();
      } else {
        showError(result.message || 'Failed to create admin');
      }
    } catch (error) {
      showError('Network error occurred');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    showInfo('Logged out successfully');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <h3>Loading Admin Dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>Admin Panel</h2>
          <p>{adminUser?.fullName}</p>
          <span className="admin-badge">{adminUser?.adminProfile?.adminLevel || 'admin'}</span>
        </div>

        <nav className="admin-nav">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">📊</span>
            <span>Overview</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'representatives' ? 'active' : ''}`}
            onClick={() => setActiveTab('representatives')}
          >
            <span className="nav-icon">👥</span>
            <span>Club Representatives</span>
            {stats.pendingRepresentatives > 0 && (
              <span className="badge">{stats.pendingRepresentatives}</span>
            )}
          </button>

          <button
            className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <span className="nav-icon">📝</span>
            <span>Post Moderation</span>
            {stats.pendingPosts > 0 && (
              <span className="badge">{stats.pendingPosts}</span>
            )}
          </button>

          {adminUser?.adminProfile?.adminLevel === 'super' && (
            <button
              className={`nav-item ${activeTab === 'admins' ? 'active' : ''}`}
              onClick={() => setActiveTab('admins')}
            >
              <span className="nav-icon">⚙️</span>
              <span>Admin Management</span>
            </button>
          )}

          <button className="nav-item" onClick={() => navigate('/')}>
            <span className="nav-icon">🏠</span>
            <span>Back to Events</span>
          </button>

          <button className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-header">
          <h1>
            {activeTab === 'overview' && 'Dashboard Overview'}
            {activeTab === 'representatives' && 'Club Representative Requests'}
            {activeTab === 'posts' && 'Post Moderation'}
            {activeTab === 'admins' && 'Admin Management'}
          </h1>
        </div>

        <div className="admin-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon pending">👥</div>
                  <div className="stat-info">
                    <h3>{stats.pendingRepresentatives}</h3>
                    <p>Pending Representatives</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon warning">📝</div>
                  <div className="stat-info">
                    <h3>{stats.pendingPosts}</h3>
                    <p>Pending Posts</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon success">📅</div>
                  <div className="stat-info">
                    <h3>{stats.totalEvents}</h3>
                    <p>Total Events</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon info">👤</div>
                  <div className="stat-info">
                    <h3>{stats.totalUsers}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  {stats.pendingRepresentatives > 0 && (
                    <button
                      className="action-btn primary"
                      onClick={() => setActiveTab('representatives')}
                    >
                      Review {stats.pendingRepresentatives} Representative Request{stats.pendingRepresentatives > 1 ? 's' : ''}
                    </button>
                  )}
                  {stats.pendingPosts > 0 && (
                    <button
                      className="action-btn warning"
                      onClick={() => setActiveTab('posts')}
                    >
                      Moderate {stats.pendingPosts} Post{stats.pendingPosts > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Representatives Tab */}
          {activeTab === 'representatives' && (
            <div className="representatives-section">
              <div className="section-header">
                <h3>Pending Requests ({representativeRequests.length})</h3>
              </div>

              {representativeRequests.length === 0 ? (
                <div className="empty-state">
                  <p>No pending representative requests</p>
                </div>
              ) : (
                <div className="requests-grid">
                  {representativeRequests.map((request) => (
                    <div key={request._id} className="request-card">
                      <div className="request-header">
                        <div className="user-avatar">
                          {request.userId?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="user-info">
                          <h4>{request.userId?.fullName}</h4>
                          <p>{request.userId?.email}</p>
                        </div>
                      </div>

                      <div className="request-details">
                        <div className="detail-row">
                          <span className="label">Club:</span>
                          <span className="value">{request.clubId?.clubName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Department:</span>
                          <span className="value">{request.userId?.department || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Semester:</span>
                          <span className="value">{request.userId?.semester || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Requested:</span>
                          <span className="value">
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="request-actions">
                        <button
                          className="btn-approve"
                          onClick={() => processRepresentativeRequest(request._id, 'approved')}
                          disabled={processingId === request._id}
                        >
                          {processingId === request._id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => processRepresentativeRequest(request._id, 'rejected')}
                          disabled={processingId === request._id}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* History */}
              {representativeHistory.length > 0 && (
                <div className="history-section">
                  <h3>Recent History</h3>
                  <div className="history-list">
                    {representativeHistory.slice(0, 10).map((item) => (
                      <div key={item._id} className="history-item">
                        <div className="history-info">
                          <strong>{item.userId?.fullName}</strong>
                          <span> for </span>
                          <strong>{item.clubId?.clubName}</strong>
                          <span className={`status-badge ${item.status}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="history-meta">
                          {new Date(item.decidedAt).toLocaleDateString()} by {item.decidedBy?.fullName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="posts-section">
              <div className="section-header">
                <h3>Post Moderation</h3>
                <div className="post-filters">
                  <button
                    className={`filter-btn ${postFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => { setPostFilter('pending'); loadPosts(); }}
                  >
                    Pending
                  </button>
                  <button
                    className={`filter-btn ${postFilter === 'published' ? 'active' : ''}`}
                    onClick={() => { setPostFilter('published'); loadPosts(); }}
                  >
                    Approved
                  </button>
                  <button
                    className={`filter-btn ${postFilter === 'rejected' ? 'active' : ''}`}
                    onClick={() => { setPostFilter('rejected'); loadPosts(); }}
                  >
                    Rejected
                  </button>
                </div>
              </div>

              {posts.length === 0 ? (
                <div className="empty-state">
                  <p>No {postFilter} posts</p>
                </div>
              ) : (
                <div className="posts-list">
                  {posts.map((post) => (
                    <div key={post._id} className="post-card">
                      <div className="post-image">
                        {post.media?.[0]?.url ? (
                          <img src={post.media[0].url} alt={post.title} />
                        ) : (
                          <div className="post-placeholder">No Image</div>
                        )}
                      </div>

                      <div className="post-content">
                        <div className="post-header">
                          <h4>{post.title}</h4>
                          <span className={`post-type-badge ${post.postType}`}>
                            {post.postType}
                          </span>
                        </div>

                        <p className="post-excerpt">
                          {post.content.substring(0, 150)}...
                        </p>

                        <div className="post-meta">
                          <span>Priority: {post.priority}</span>
                          <span>Views: {post.views}</span>
                          {post.eventDetails?.eventDate && (
                            <span>
                              Date: {new Date(post.eventDetails.eventDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {postFilter === 'pending' && (
                          <div className="post-actions">
                            <button
                              className="btn-approve"
                              onClick={() => moderatePost(post._id, 'approve')}
                            >
                              Approve
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => moderatePost(post._id, 'reject')}
                            >
                              Reject
                            </button>
                            <button
                              className="btn-view"
                              onClick={() => window.open(`/event/${post._id}`, '_blank')}
                            >
                              View Details
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admins Tab (Super Admin Only) */}
          {activeTab === 'admins' && adminUser?.adminProfile?.adminLevel === 'super' && (
            <div className="admins-section">
              <div className="section-header">
                <h3>Admin Management</h3>
                <button
                  className="btn-create"
                  onClick={() => setShowCreateAdminModal(true)}
                >
                  Create New Admin
                </button>
              </div>

              <div className="admins-list">
                {admins.map((admin) => (
                  <div key={admin._id} className="admin-card">
                    <div className="admin-info">
                      <h4>{admin.fullName}</h4>
                      <p>{admin.email}</p>
                      <span className="admin-level-badge">
                        {admin.adminProfile?.adminLevel}
                      </span>
                    </div>
                    <div className="admin-permissions">
                      {admin.adminProfile?.permissions?.map((perm, idx) => (
                        <span key={idx} className="permission-tag">{perm}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowCreateAdminModal(false)}></div>
          <div className="modal create-admin-modal">
            <div className="modal-header">
              <h3>Create New Admin</h3>
              <button className="modal-close" onClick={() => setShowCreateAdminModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={createNewAdmin} className="modal-form">
              <div className="form-group">
                <label>User ID *</label>
                <input
                  type="text"
                  value={newAdminData.userId}
                  onChange={(e) => setNewAdminData({ ...newAdminData, userId: e.target.value })}
                  placeholder="Enter user ID to promote"
                  required
                />
              </div>

              <div className="form-group">
                <label>Admin Level *</label>
                <select
                  value={newAdminData.adminLevel}
                  onChange={(e) => setNewAdminData({ ...newAdminData, adminLevel: e.target.value })}
                  required
                >
                  <option value="department">Department Admin</option>
                  <option value="college">College Admin</option>
                  <option value="super">Super Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label>Permissions</label>
                <div className="permissions-checkboxes">
                  {['moderate_posts', 'manage_clubs', 'manage_users', 'view_analytics'].map((perm) => (
                    <label key={perm} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newAdminData.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewAdminData({
                              ...newAdminData,
                              permissions: [...newAdminData.permissions, perm],
                            });
                          } else {
                            setNewAdminData({
                              ...newAdminData,
                              permissions: newAdminData.permissions.filter((p) => p !== perm),
                            });
                          }
                        }}
                      />
                      <span>{perm.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateAdminModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
