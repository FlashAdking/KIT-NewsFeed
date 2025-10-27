import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './components/ToastProvider';
import '../src/css/AdminDashboard.css';

function AdminDashboard() {
  // Core state
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);

  // Viewer state
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');
  const [viewerType, setViewerType] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  // User promotion state
  // const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(null); // { id, name }



  // Dashboard stats
  const [stats, setStats] = useState({
    pendingRepresentatives: 0,
    pendingPosts: 0,
    totalUsers: 0,
    totalEvents: 0,
  });

  // Representatives
  const [representativeRequests, setRepresentativeRequests] = useState([]);
  const [representativeHistory, setRepresentativeHistory] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Posts
  const [posts, setPosts] = useState([]);
  const [postFilter, setPostFilter] = useState('pending');

  // Admins
  const [admins, setAdmins] = useState([]);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);


  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();
  const API_BASE = 'http://localhost:8080';

  // Utility: Determine if file is image based on extension AND mime type
  const isImageFile = (filename = '', mimeType = '') => {
    const imageExtensions = /\.(jpe?g|png|gif|webp|bmp|svg)$/i;
    const hasImageExt = imageExtensions.test(filename);
    const hasImageMime = mimeType && mimeType.startsWith('image/');

    console.log('[isImageFile]', { filename, mimeType, hasImageExt, hasImageMime });

    return hasImageMime || hasImageExt;
  };

  // Utility: Build document URL
  const buildDocumentUrl = (filename) => {
    if (!filename) {
      console.error('[buildDocumentUrl] No filename provided');
      return '';
    }
    const url = `${API_BASE}/uploads/verifications/${encodeURIComponent(filename)}`;
    console.log('[buildDocumentUrl]', { filename, url });
    return url;
  };

  // Effects
  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (adminUser) {
      loadDashboardData();
    }
  }, [activeTab, adminUser]);

  useEffect(() => {
    if (adminUser && activeTab === 'posts') {
      loadPosts();
    }
  }, [postFilter, adminUser, activeTab]);

  useEffect(() => {
    if (adminUser && activeTab) {
      const isSuperAdmin = adminUser.adminProfile?.adminLevel === 'super';
      const restrictedTabs = ['representatives', 'admins'];

      if (!isSuperAdmin && restrictedTabs.includes(activeTab)) {
        console.warn(`[Access Denied] Post moderator tried to access: ${activeTab}`);
        showError('You do not have permission to access this section');
        setActiveTab('overview');
      }
    }
  }, [activeTab, adminUser]);

  useEffect(() => {
    if (showCreateAdminModal) {
      fetchUsers();
    }
  }, [showCreateAdminModal]);



  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/admins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.data.admins);
      }
    } catch (error) {
      showError('Failed to load admins');
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Revoke admin
  const revokeAdmin = async () => {
    if (!confirmRevoke) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId: confirmRevoke.id })
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(`${confirmRevoke.name}'s admin access revoked successfully`);
        fetchAdmins();
      } else {
        showError(result.message || 'Failed to revoke admin access');
      }
    } catch (error) {
      showError('Network error');
    } finally {
      setConfirmRevoke(null); // Close modal
    }
  };


  // Load on mount
  useEffect(() => {
    if (activeTab === 'admins') {
      fetchAdmins();
    }
  }, [activeTab]);


  const filteredUsers = allUsers.filter(user =>
    user.fullName.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('✅ Users with profiles:', data.data.users);
      setAllUsers(data.data.users);
    } catch (error) {
      showError('Failed to load users');
    }
  };

  // API helpers with enhanced error handling
  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('[checkAdminAccess] No token found');
        showError('Please login as admin');
        navigate('/login');
        return;
      }

      console.log('[checkAdminAccess] Checking admin access...');
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        const user = result.user || result.data?.user;
        console.log('[checkAdminAccess] User:', user);

        // Check if user is admin
        if (!user || user.role !== 'admin') {
          console.error('[checkAdminAccess] User is not admin:', user);
          showError('Admin access required');
          navigate('/');
          return;
        }

        setAdminUser(user);

        // ✅ Set initial tab based on admin level
        const isSuperAdmin = user.adminProfile?.adminLevel === 'super';
        if (!isSuperAdmin && activeTab === 'representatives') {
          // Post moderator tried to access admin-only tab
          setActiveTab('overview');
        }
        if (!isSuperAdmin && activeTab === 'admins') {
          // Post moderator tried to access admin management
          setActiveTab('overview');
        }

        setLoading(false);
      } else {
        console.error('[checkAdminAccess] Response not ok:', response.status);
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('[checkAdminAccess] Error:', error);
      showError('Failed to verify admin access');
      navigate('/login');
    }
  };


  const loadDashboardData = async () => {
    console.log('[loadDashboardData] Loading for tab:', activeTab);
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
      default:
        break;
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');

      const repResponse = await fetch(`${API_BASE}/api/admin/representatives/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const repData = await repResponse.json();

      const postsResponse = await fetch(`${API_BASE}/api/posts?status=pending&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const postsData = await postsResponse.json();

      console.log('[loadStats]', { repData, postsData });

      setStats({
        pendingRepresentatives: repData.data?.count || 0,
        pendingPosts: postsData.data?.pagination?.totalPosts || 0,
        totalUsers: 0,
        totalEvents: postsData.data?.pagination?.totalPosts || 0,
      });
    } catch (error) {
      console.error('[loadStats] Error:', error);
    }
  };

  const loadRepresentativeRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('[loadRepresentativeRequests] Fetching...');

      const response = await fetch(`${API_BASE}/api/admin/representatives/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[loadRepresentativeRequests] Result:', result);
        setRepresentativeRequests(result.data?.requests || []);
      } else {
        console.error('[loadRepresentativeRequests] Response not ok:', response.status);
      }

      const historyResponse = await fetch(`${API_BASE}/api/admin/representatives/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (historyResponse.ok) {
        const historyResult = await historyResponse.json();
        console.log('[loadRepresentativeRequests] History:', historyResult);
        setRepresentativeHistory(historyResult.data || []);
      }
    } catch (error) {
      console.error('[loadRepresentativeRequests] Error:', error);
      showError('Failed to load representative requests');
    }
  };

  const processRepresentativeRequest = async (membershipId, decision) => {
    try {
      setProcessingId(membershipId);
      const token = localStorage.getItem('token');
      console.log('[processRepresentativeRequest]', { membershipId, decision });

      const response = await fetch(`${API_BASE}/api/admin/representatives/${membershipId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision,
          adminNotes: selectedRequest?.adminNotes || '',
          reviewMethod: 'standard',
        }),
      });

      const result = await response.json();
      console.log('[processRepresentativeRequest] Result:', result);

      if (response.ok) {
        showSuccess(`Request ${decision} successfully!`);
        setSelectedRequest(null);
        await loadRepresentativeRequests();
        await loadStats();
      } else {
        console.error('[processRepresentativeRequest] Failed:', result);
        showError(result.message || `Failed to ${decision} request`);
      }
    } catch (error) {
      console.error('[processRepresentativeRequest] Error:', error);
      showError('Network error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const loadPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('[loadPosts] Filter:', postFilter);

      const response = await fetch(`${API_BASE}/api/posts?status=${postFilter}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[loadPosts] Result:', result);
        setPosts(result.data?.posts || []);
      } else {
        console.error('[loadPosts] Response not ok:', response.status);
        setPosts([]);
      }
    } catch (error) {
      console.error('[loadPosts] Error:', error);
      showError('Failed to load posts');
      setPosts([]);
    }
  };

  const moderatePost = async (postId, action) => {
    try {
      const token = localStorage.getItem('token');
      console.log('[moderatePost]', { postId, action });

      const response = await fetch(`${API_BASE}/api/posts/${postId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, notes: '' }),
      });

      const result = await response.json();
      console.log('[moderatePost] Result:', result);

      if (response.ok) {
        showSuccess(`Post ${action}d successfully!`);
        await loadPosts();
        await loadStats();
      } else {
        console.error('[moderatePost] Failed:', result);
        showError(result.message || 'Failed to moderate post');
      }
    } catch (error) {
      console.error('[moderatePost] Error:', error);
      showError('Network error occurred');
    }
  };

  const loadAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('[loadAdmins] Fetching...');

      const response = await fetch(`${API_BASE}/api/admin/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[loadAdmins] Result:', result);
        setAdmins(result.data?.admins || []);
      }
    } catch (error) {
      console.error('[loadAdmins] Error:', error);
    }
  };

  const promoteUser = async (e) => {
    e.preventDefault();

    if (!selectedUserId) {
      showError('Please select a user to promote');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('[promoteUser] Promoting user:', selectedUserId);

      const response = await fetch(`${API_BASE}/api/admin/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: selectedUserId
        }),
      });

      const result = await response.json();
      console.log('[promoteUser] Result:', result);

      if (response.ok) {
        showSuccess('User promoted to Post Moderator successfully!');
        setShowCreateAdminModal(false);
        setSelectedUserId('');
        setSearchUser('');

        // ✅ Refresh admin list immediately
        await fetchAdmins();

        // ✅ Also refresh user list to remove promoted user
        await fetchUsers();
      } else {
        console.error('[promoteUser] Failed:', result);
        showError(result.message || 'Failed to promote user');
      }
    } catch (error) {
      console.error('[promoteUser] Error:', error);
      showError('Network error occurred');
    }
  };


  const handleLogout = () => {
    console.log('[handleLogout] Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    showInfo('Logged out successfully');
    navigate('/login');
  };

  // Open viewer with proper type detection
  const openDocumentViewer = (doc) => {
    if (!doc || !doc.filename) {
      console.error('[openDocumentViewer] Invalid document:', doc);
      showError('Document not available');
      return;
    }

    const url = buildDocumentUrl(doc.filename);
    const isImage = isImageFile(doc.filename, doc.fileType);

    console.log('[openDocumentViewer]', {
      filename: doc.filename,
      fileType: doc.fileType,
      url,
      isImage,
    });

    setCurrentPdfUrl(url);
    setViewerType(isImage ? 'image' : 'pdf');
    setImageLoadError(false);
    setPdfViewerOpen(true);
  };

  const closeViewer = () => {
    console.log('[closeViewer] Closing viewer');
    setPdfViewerOpen(false);
    setViewerType(null);
    setCurrentPdfUrl('');
    setImageLoadError(false);
  };

  const handleImageError = (e) => {
    console.error('[handleImageError] Image failed to load:', currentPdfUrl);
    setImageLoadError(true);
    showError('Failed to load image. Please check if the file exists.');
  };

  const handleImageLoad = () => {
    console.log('[handleImageLoad] Image loaded successfully:', currentPdfUrl);
    setImageLoadError(false);
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
          <span className="admin-badge">
            {adminUser?.adminProfile?.adminLevel === 'super' ? 'Super Admin' : 'Post Moderator'}
          </span>
        </div>

        <nav className="admin-nav">
          {/* Overview - Only Super Admin */}
          {adminUser?.adminProfile?.adminLevel === 'super' && (
            <button
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="nav-icon">📊</span>
              <span>Overview</span>
            </button>
          )}

          {/* Club Representatives - Only Super Admin */}
          {adminUser?.adminProfile?.adminLevel === 'super' && (
            <button
              className={`nav-item ${activeTab === 'representatives' ? 'active' : ''}`}
              onClick={() => setActiveTab('representatives')}
            >
              <span className="nav-icon">👥</span>
              <span>Club Representatives</span>
              {stats.pendingRepresentatives > 0 && <span className="badge">{stats.pendingRepresentatives}</span>}
            </button>
          )}

          {/* Post Moderation - All Admins */}
          <button
            className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <span className="nav-icon">📝</span>
            <span>Post Moderation</span>
            {stats.pendingPosts > 0 && <span className="badge">{stats.pendingPosts}</span>}
          </button>

          {/* Admin Management - Only Super Admin */}
          {adminUser?.adminProfile?.adminLevel === 'super' && (
            <button
              className={`nav-item ${activeTab === 'admins' ? 'active' : ''}`}
              onClick={() => setActiveTab('admins')}
            >
              <span className="nav-icon">⚙️</span>
              <span>Admin Management</span>
            </button>
          )}

          {/* Back to Events - All Admins */}
          <button className="nav-item" onClick={() => navigate('/')}>
            <span className="nav-icon">🏠</span>
            <span>Back to Events</span>
          </button>

          {/* Logout - All Admins */}
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
          {/* Overview */}
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
                    <button className="action-btn primary" onClick={() => setActiveTab('representatives')}>
                      Review {stats.pendingRepresentatives} Representative Request{stats.pendingRepresentatives > 1 ? 's' : ''}
                    </button>
                  )}
                  {stats.pendingPosts > 0 && (
                    <button className="action-btn warning" onClick={() => setActiveTab('posts')}>
                      Moderate {stats.pendingPosts} Post{stats.pendingPosts > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Representatives */}
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
                  {representativeRequests.map((request) => {
                    const doc = request.verificationDocument;
                    const isImage = doc ? isImageFile(doc.filename, doc.fileType) : false;

                    return (
                      <div key={request._id} className="request-card">
                        <div className="request-header">
                          <div className="user-avatar">{request.userId?.fullName?.charAt(0) || 'U'}</div>
                          <div className="user-info">
                            <h4>{request.userId?.fullName || 'Unknown User'}</h4>
                            <p>{request.userId?.email || 'No email'}</p>
                          </div>
                        </div>

                        <div className="request-details">
                          <div className="detail-row">
                            <span className="label">Club:</span>
                            <span className="value">{request.clubId?.clubName || 'N/A'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Position:</span>
                            <span className="value">{request.clubPosition || 'N/A'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Club Type:</span>
                            <span className="value">{request.clubId?.clubtype || 'N/A'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Department:</span>
                            <span className="value">{request.clubId?.department || 'General'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Official Email:</span>
                            <span className="value">{request.officialEmail || 'N/A'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Official Phone:</span>
                            <span className="value">{request.officialPhone || 'N/A'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Requested:</span>
                            <span className="value">{new Date(request.requestedAt).toLocaleDateString()}</span>
                          </div>

                          {/* Application Details */}
                          {request.applicationDetails && (
                            <>
                              <div className="detail-section-header">
                                <strong>Application Details:</strong>
                              </div>
                              {request.applicationDetails.statement && (
                                <div className="detail-row statement-row">
                                  <span className="label">Statement:</span>
                                  <span className="value statement">{request.applicationDetails.statement}</span>
                                </div>
                              )}
                              {request.applicationDetails.supportingDocUrl && (
                                <div className="detail-row">
                                  <span className="label">Documents:</span>
                                  <a
                                    href={request.applicationDetails.supportingDocUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="doc-link"
                                  >
                                    View Document
                                  </a>
                                </div>
                              )}
                            </>
                          )}

                          {/* Verification Document */}
                          {doc && (
                            <div className="verification-document-section">
                              <div className="detail-section-header">
                                <strong>Verification Document</strong>
                              </div>

                              <div className="document-preview-card">
                                <div className="preview-thumb">
                                  {isImage ? (
                                    <img
                                      src={buildDocumentUrl(doc.filename)}
                                      alt="Verification Document"
                                      loading="lazy"
                                      onError={(e) => {
                                        console.error('[Thumbnail] Image load failed:', doc.filename);
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = '<div class="pdf-icon-box">❌</div>';
                                      }}
                                      onLoad={() => console.log('[Thumbnail] Image loaded:', doc.filename)}
                                    />
                                  ) : (
                                    <div className="pdf-icon-box">📄</div>
                                  )}
                                </div>

                                <div className="preview-details">
                                  <div className="preview-title">
                                    {isImage ? 'Image Document' : 'PDF Document'}
                                  </div>
                                  <div className="preview-meta">
                                    <span>{(doc.fileSize / 1024).toFixed(2)} KB</span>
                                    <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                  </div>
                                </div>

                                <div className="preview-actions">
                                  <button
                                    className="btn-view-document"
                                    onClick={() => openDocumentViewer(doc)}
                                  >
                                    👁 View {isImage ? 'Image' : 'PDF'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="request-actions">
                          <button
                            className="btn-approve"
                            onClick={() => processRepresentativeRequest(request._id, 'approved')}
                            disabled={processingId === request._id}
                          >
                            {processingId === request._id ? 'Processing...' : '✓ Approve'}
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => processRepresentativeRequest(request._id, 'rejected')}
                            disabled={processingId === request._id}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {representativeHistory.length > 0 && (
                <div className="history-section">
                  <h3>Recent History</h3>
                  <div className="history-list">
                    {representativeHistory.slice(0, 10).map((item) => (
                      <div key={item._id} className="history-item">
                        <div className="history-info">
                          <strong>{item.userId?.fullName || 'Unknown'}</strong>
                          <span> for </span>
                          <strong>{item.clubId?.clubName || 'Unknown Club'}</strong>
                          <span className={`status-badge ${item.status}`}>{item.status}</span>
                        </div>
                        <div className="history-meta">
                          {new Date(item.decidedAt).toLocaleDateString()}
                          {item.decidedBy?.fullName && ` by ${item.decidedBy.fullName}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Posts Section - keeping existing code */}
          {activeTab === 'posts' && (
            <div className="posts-section">
              <div className="section-header">
                <h3>Post Moderation</h3>
                <div className="post-filters">
                  <button className={`filter-btn ${postFilter === 'pending' ? 'active' : ''}`} onClick={() => setPostFilter('pending')}>
                    Pending
                  </button>
                  <button className={`filter-btn ${postFilter === 'published' ? 'active' : ''}`} onClick={() => setPostFilter('published')}>
                    Approved
                  </button>
                  <button className={`filter-btn ${postFilter === 'rejected' ? 'active' : ''}`} onClick={() => setPostFilter('rejected')}>
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
                        {(() => {
                          // ✅ Determine image source - check both formats
                          const imgSrc = post.imageUrl
                            ? `${API_BASE}${post.imageUrl}`
                            : post.media?.[0]?.url;

                          return imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={post.title}
                              onError={(e) => {
                                console.error('[Post Image] Load failed:', imgSrc);
                                e.target.style.display = 'none';
                                e.target.nextElementSibling?.style && (e.target.nextElementSibling.style.display = 'flex');
                              }}
                            />
                          ) : (
                            <div className="post-placeholder">📷 No Image</div>
                          );
                        })()}
                        <div className="post-placeholder" style={{ display: 'none' }}>📷 No Image</div>
                      </div>

                      <div className="post-content">
                        <div className="post-header">
                          <h4>{post.title}</h4>
                          <div className="post-badges">
                            <span className={`post-type-badge ${post.postType}`}>{post.postType}</span>
                            <span className={`status-badge ${post.status}`}>{post.status}</span>
                          </div>
                        </div>

                        <p className="post-excerpt">{post.content?.substring(0, 150)}...</p>

                        <div className="post-meta">
                          <span>Priority: {post.priority || 'normal'}</span>
                          <span>Views: {post.views || 0}</span>
                          {post.eventDetails?.eventDate && (
                            <span>Date: {new Date(post.eventDetails.eventDate).toLocaleDateString()}</span>
                          )}
                        </div>

                        <div className="post-actions">
                          {postFilter === 'pending' && (
                            <>
                              <button className="btn-approve" onClick={() => moderatePost(post._id, 'approve')}>
                                ✓ Approve
                              </button>
                              <button className="btn-reject" onClick={() => moderatePost(post._id, 'reject')}>
                                ✕ Reject
                              </button>
                            </>
                          )}
                          <button className="btn-view" onClick={() => window.open(`/event/${post._id}`, '_blank')}>
                            👁 View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              )}
            </div>
          )}

          {/* Admins Section - keeping existing code */}
          {activeTab === 'admins' && adminUser?.adminProfile?.adminLevel === 'super' && (
            <div className="admins-section">
              <div className="section-header">
                <h3>Admin Management</h3>
                <button className="btn-create" onClick={() => setShowCreateAdminModal(true)}>
                  + Promote User to Admin
                </button>
              </div>

              {loadingAdmins ? (
                <div className="loading-state">Loading admins...</div>
              ) : (
                <div className="admins-list">
                  {admins.length > 0 ? (
                    admins
                      .filter(admin => admin.adminProfile?.adminLevel !== 'super') // ✅ Hide super admin from list
                      .map((admin) => (
                        <div key={admin._id} className="admin-card">
                          <div className="admin-info">
                            {/* Admin Avatar */}
                            <div className="admin-avatar">
                              {admin.profilePicture ? (
                                <img
                                  src={`${API_BASE}${admin.profilePicture}`}
                                  alt={admin.fullName}
                                  className="admin-avatar-img"
                                />
                              ) : (
                                admin.fullName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="admin-details">
                              <h4>{admin.fullName}</h4>
                              <p>{admin.email}</p>
                              <div className="admin-meta">
                                <span className={`admin-level-badge ${admin.adminProfile?.adminLevel}`}>
                                  {admin.adminProfile?.adminLevel === 'department' ? 'Post Moderator' : admin.adminProfile?.adminLevel}
                                </span>
                                {admin.adminProfile?.permissions && (
                                  <div className="admin-permissions">
                                    {admin.adminProfile.permissions.map((perm, idx) => (
                                      <span key={idx} className="permission-tag">
                                        {perm.replace(/_/g, ' ')}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* ✅ Revoke Button */}
                          <div className="admin-actions">
                            <button
                              className="btn-revoke"
                              onClick={() => setConfirmRevoke({
                                id: admin._id,
                                name: admin.fullName,
                                profilePicture: admin.profilePicture // ✅ Add this
                              })}
                            >
                              Revoke Access
                            </button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="empty-state">
                      <p>No admins found. Promote users to create post moderators.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowCreateAdminModal(false)} />
          <div className="modal create-admin-modal">
            <div className="modal-header">
              <h3>Promote User to Post Moderator</h3>
              <button className="modal-close" onClick={() => setShowCreateAdminModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={promoteUser} className="modal-form">
              {/* Search Bar */}
              <div className="form-group">
                <label>Search User</label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="search-input"
                />
              </div>

              {/* User List */}
              <div className="form-group">
                <label>Select User to Promote</label>
                <div className="user-select-list">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <div
                        key={user._id}
                        className={`user-select-item ${selectedUserId === user._id ? 'selected' : ''}`}
                        onClick={() => setSelectedUserId(user._id)}
                      >
                        {/* ✅ Updated Avatar Section */}
                        <div className="user-select-avatar">
                          {user.profilePicture ? (
                            <img
                              src={`${API_BASE}${user.profilePicture}`}
                              alt={user.fullName}
                              className="user-select-avatar-img"
                              onError={(e) => {
                                // Fallback to letter if image fails
                                e.target.style.display = 'none';
                                e.target.parentElement.textContent = user.fullName.charAt(0).toUpperCase();
                              }}
                            />
                          ) : (
                            user.fullName.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="user-select-info">
                          <h4>{user.fullName}</h4>
                          <p>{user.email}</p>
                          <small>{user.department} • {user.collegeName}</small>
                        </div>

                        {selectedUserId === user._id && (
                          <div className="user-select-check">✓</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="no-users">No users found</p>
                  )}


                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateAdminModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={!selectedUserId}>
                  Promote to Moderator
                </button>
              </div>
            </form>
          </div>
        </>
      )}


      {/* Viewer Modal */}
      {pdfViewerOpen && (
        <>
          <div className="pdf-viewer-overlay" onClick={closeViewer} />
          <div className="pdf-viewer-modal">
            <div className="pdf-viewer-header">
              <h3>Document Preview</h3>
              <div className="pdf-viewer-controls">
                <button className="close-pdf-viewer" onClick={closeViewer} title="Close">
                  ✕
                </button>
              </div>
            </div>

            <div className="pdf-viewer-content">
              {viewerType === 'image' ? (
                <div className="image-viewer-container">
                  {imageLoadError ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <p style={{ color: '#ef4444', fontSize: '1.125rem', marginBottom: '1rem' }}>
                        ❌ Failed to load image
                      </p>
                      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        URL: {currentPdfUrl}
                      </p>
                      <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        Check console for details
                      </p>
                    </div>
                  ) : (
                    <img
                      src={currentPdfUrl}
                      alt="Document"
                      className="full-image-viewer"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                    />
                  )}
                </div>
              ) : (
                <iframe src={currentPdfUrl} title="PDF Viewer" className="pdf-iframe" />
              )}
            </div>
          </div>
        </>
      )}


      {/* Confirmation Modal */}
      {confirmRevoke && (
        <>
          <div className="modal-overlay" onClick={() => setConfirmRevoke(null)} />
          <div className="modal confirm-modal">
            <div className="modal-header">

              <h3>Revoke Admin Access</h3>
            </div>

            <div className="modal-content">
              <p>Are you sure you want to revoke admin access for:</p>
              <div className="confirm-user-info">
                <div className="confirm-avatar">
                  {confirmRevoke.profilePicture ? (
                    <img
                      src={`${API_BASE}${confirmRevoke.profilePicture}`}
                      alt={confirmRevoke.name}
                      className="confirm-avatar-img"
                    />
                  ) : (
                    confirmRevoke.name.charAt(0).toUpperCase()
                  )}
                </div>

                <div>
                  <strong>{confirmRevoke.name}</strong>
                  <p>This action cannot be undone.</p>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setConfirmRevoke(null)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={revokeAdmin}
              >
                Yes, Revoke Access
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default AdminDashboard;
