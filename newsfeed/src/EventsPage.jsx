import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from './LoginModal';
import "../src/css/EventPage.css";
import FilterModal from "./FilterPage";

function EventsPage() {

  //  useEffect for JWT validation
  useEffect(() => {
    checkAuthStatus();
    fetchEvents();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        // Validate token with backend
        const response = await fetch('/api/auth/validate', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          setIsLoggedIn(true);
          setUserProfile(result.data.user);
        } else {
          // Token invalid, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          setIsLoggedIn(false);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setIsLoggedIn(false);
      }
    }
  };



  const [todaysEvents, setTodaysEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventType, setEventType] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginAction, setLoginAction] = useState(''); // 'register' or 'profile'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    parentCategory: 'all',
    subcategories: [],
    location: 'all',
    eventMode: 'all'
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Filter events based on all criteria
  const filterEvents = (events) => {
    return events.filter(event => {
      // Search term filter
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.content.toLowerCase().includes(searchTerm.toLowerCase());

      // Price filter
      const matchesPrice = filters.priceRange === 'all' ||
        (filters.priceRange === 'free' && (!event.eventDetails?.registrationFee || event.eventDetails.registrationFee === 0)) ||
        (filters.priceRange === 'paid' && event.eventDetails?.registrationFee > 0) ||
        (filters.priceRange === 'budget' && event.eventDetails?.registrationFee > 0 && event.eventDetails.registrationFee <= 500) ||
        (filters.priceRange === 'premium' && event.eventDetails?.registrationFee > 500);

      // Category filter
      const matchesCategory = filters.parentCategory === 'all' ||
        checkCategoryMatch(event, filters.parentCategory);

      // Subcategory filter
      const matchesSubcategory = filters.subcategories.length === 0 ||
        filters.subcategories.some(sub =>
          event.title.toLowerCase().includes(sub) ||
          event.content.toLowerCase().includes(sub)
        );

      // Location filter
      const matchesLocation = filters.location === 'all' ||
        event.eventDetails?.venue?.toLowerCase().includes(filters.location.toLowerCase());

      // Event mode filter
      const matchesMode = filters.eventMode === 'all' ||
        checkEventMode(event, filters.eventMode);

      return matchesSearch && matchesPrice && matchesCategory && matchesSubcategory && matchesLocation && matchesMode;
    });
  };

  const checkCategoryMatch = (event, category) => {
    const text = (event.title + ' ' + event.content).toLowerCase();
    switch (category) {
      case 'tech':
        return text.includes('tech') || text.includes('coding') || text.includes('hackathon') || text.includes('programming');
      case 'academic':
        return text.includes('workshop') || text.includes('seminar') || text.includes('conference') || text.includes('research');
      case 'cultural':
        return text.includes('cultural') || text.includes('music') || text.includes('dance') || text.includes('art');
      case 'sports':
        return text.includes('sport') || text.includes('cricket') || text.includes('football') || text.includes('basketball');
      default:
        return true;
    }
  };

  const checkEventMode = (event, mode) => {
    const venue = event.eventDetails?.venue?.toLowerCase() || '';
    switch (mode) {
      case 'online':
        return venue.includes('online') || venue.includes('virtual') || venue.includes('zoom');
      case 'offline':
        return !venue.includes('online') && !venue.includes('virtual') && !venue.includes('zoom');
      case 'hybrid':
        return venue.includes('hybrid');
      default:
        return true;
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);

    // Count active filters
    let count = 0;
    if (newFilters.priceRange !== 'all') count++;
    if (newFilters.parentCategory !== 'all') count++;
    if (newFilters.subcategories.length > 0) count++;
    if (newFilters.location !== 'all') count++;
    if (newFilters.eventMode !== 'all') count++;

    setActiveFiltersCount(count);
  };

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in (but don't require it)
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');

    if (token && userData) {
      setIsLoggedIn(true);
      setUserProfile(JSON.parse(userData));
    }

    // Always fetch events (no login required)
    fetchEvents();
  }, []);

const fetchEvents = async () => {
  try {
    const response = await fetch('/api/posts?postType=event&status=published', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    console.log('🔍 API Response:', result);
    
    if (result.success) {
      // ✅ FIX: Extract posts array from the paginated response
      const events = result.data.posts || []; // Get the posts array
      const pagination = result.data.pagination || {};
      
      console.log('✅ Events array:', events);
      console.log('📄 Pagination info:', pagination);
      
      const today = new Date().toISOString().split('T')[0];
      
      const todayEvents = events.filter(event => 
        event.eventDetails?.eventDate?.split('T')[0] === today
      );
      
      const upcomingEventsData = events.filter(event => 
        event.eventDetails?.eventDate && 
        new Date(event.eventDetails.eventDate) > new Date()
      );
      
      setTodaysEvents(todayEvents);
      setUpcomingEvents(upcomingEventsData);
    } else {
      console.error('❌ API returned success: false');
      setMockData();
    }
  } catch (error) {
    console.error('❌ Failed to fetch events:', error);
    setMockData();
  }
};


  const setMockData = () => {
    const mockEvents = [
      {
        _id: '1',
        title: 'Code Sprint 2025',
        content: 'Join the biggest coding hackathon of the year! Build innovative solutions, compete with talented developers, and win exciting prizes.',
        media: [{ type: 'image', url: 'https://via.placeholder.com/400x200?text=Hackathon' }],
        eventDetails: {
          eventDate: new Date().toISOString(),
          venue: 'Tech Park, Bangalore',
          registrationRequired: true,
          registrationFee: 500,
          maxParticipants: 100,
          description: 'A 48-hour coding marathon where creativity meets technology.',
          contactInfo: { email: 'hackathon@college.edu', phone: '+91-9876543210' }
        },
        postType: 'event',
        priority: 'high',
        views: 234,
        likes: ['user1', 'user2'],
        authorType: 'club',
        clubId: 'tech-club-id',
        registrationStats: { totalRegistered: 45 }
      },
      {
        _id: '2',
        title: 'Cultural Fest 2025',
        content: 'Experience the vibrant culture and traditions through dance, music, and art performances.',
        media: [{ type: 'image', url: 'https://via.placeholder.com/400x200?text=Cultural' }],
        eventDetails: {
          eventDate: '2025-08-20T10:00:00Z',
          venue: 'Main Auditorium',
          registrationRequired: false,
          registrationFee: 0,
          description: 'Celebrate diversity through cultural performances and exhibitions.',
          contactInfo: { email: 'cultural@college.edu' }
        },
        postType: 'event',
        priority: 'medium',
        views: 156,
        likes: ['user3'],
        authorType: 'faculty',
        registrationStats: { totalRegistered: 0 }
      }
    ];

    setTodaysEvents([mockEvents[0]]);
    setUpcomingEvents([mockEvents[1]]);
  };

  // Handle registration with login check
  const handleRegisterClick = (event, e) => {
    e.stopPropagation(); // Prevent card click

    if (!isLoggedIn) {
      setSelectedEvent(event);
      setLoginAction('register');
      setShowLoginModal(true);
    } else {
      // User is logged in, proceed with registration
      proceedWithRegistration(event);
    }
  };

  // Handle profile access with login check
  const handleProfileClick = () => {
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      navigate('/profile');
    }
  };

  // Handle view event (no login required)
  const handleViewEvent = (event, e) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/event/${event._id}`, { state: { event } });
  };

  // Handle card click (view event)
  const handleEventClick = (event) => {
    navigate(`/event/${event._id}`, { state: { event } });
  };

  // Proceed with registration after login
  const proceedWithRegistration = (event) => {
    // Navigate to registration page or show registration form
    navigate(`/event/${event._id}/register`, { state: { event } });
  };

  // Handle successful login
  const handleLoginSuccess = (userData, token) => {
    // Store JWT token and user data
    localStorage.setItem('token', token);
    localStorage.setItem('userData', JSON.stringify(userData));

    // Update app state
    setIsLoggedIn(true);
    setUserProfile(userData);
    setShowLoginModal(false);

    // Execute pending actions (registration, profile access)
    if (loginAction === 'register' && selectedEvent) {
      proceedWithRegistration(selectedEvent);
    } else if (loginAction === 'profile') {
      navigate('/profile');
    }

    // Reset state
    setLoginAction('');
    setSelectedEvent(null);
  };


  // Rest of your existing functions (getEventTypeColor, getEventTypeIcon, formatDate, formatTime)
  const getEventTypeColor = (title, content) => {
    const text = (title + ' ' + content).toLowerCase();
    if (text.includes('hackathon') || text.includes('coding') || text.includes('tech')) return '#FF6B6B';
    if (text.includes('cultural') || text.includes('fest') || text.includes('art')) return '#4ECDC4';
    if (text.includes('workshop') || text.includes('seminar')) return '#45B7D1';
    if (text.includes('sports') || text.includes('tournament')) return '#96CEB4';
    if (text.includes('opportunity') || text.includes('internship')) return '#FECA57';
    return '#A8E6CF';
  };

  const getEventTypeIcon = (title, content) => {
    const text = (title + ' ' + content).toLowerCase();
    if (text.includes('hackathon') || text.includes('coding')) return '💻';
    if (text.includes('cultural') || text.includes('fest')) return '🎭';
    if (text.includes('workshop') || text.includes('seminar')) return '🎓';
    if (text.includes('sports')) return '🏆';
    if (text.includes('opportunity')) return '💼';
    return '📅';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  return (
    <>
      <div className="events-container">
        {/* Professional Navbar */}
        <nav className="navbar">
          <div className="navbar-brand">
            <div className="brand-logo">🎯</div>
            <div className="brand-text">
              <h1>EventEase</h1>
              <span>Discover • Connect • Participate</span>
            </div>
          </div>

          <div className="navbar-search">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search events, hackathons, workshops..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-btn">🔍</button>
            </div>
            <button
              className="filter-btn"
              onClick={() => setShowFilterModal(true)}
            >
              <span className="filter-icon">🔧</span>
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="filter-badge">{activeFiltersCount}</span>
              )}
            </button>
          </div>

          <div className="navbar-actions">
            {/* <button className="create-event-btn" onClick={() => !isLoggedIn ? setShowLoginModal(true) : navigate('/create-event')}>
              + Create Event
            </button> */}
            <div className="profile-section" onClick={handleProfileClick}>
              {isLoggedIn && userProfile ? (
                <div className="profile-avatar">
                  <img
                    src={userProfile.avatar || `https://ui-avatars.com/api/?name=${userProfile.fullName}&background=4f46e5&color=fff`}
                    alt="Profile"
                    className="avatar-img"
                  />
                  <span className="profile-name">{userProfile.fullName}</span>
                </div>
              ) : (
                <div className="login-prompt">
                  <div className="guest-avatar">👤</div>
                  <span>Login</span>
                </div>
              )}
            </div>
          </div>
        </nav>

        {activeFiltersCount > 0 && (
          <div className="active-filters">
            <div className="active-filters-content">
              <span className="filters-label">Active filters:</span>
              <div className="filter-tags">
                {filters.priceRange !== 'all' && (
                  <span className="filter-tag">
                    💰 {filters.priceRange.charAt(0).toUpperCase() + filters.priceRange.slice(1)}
                  </span>
                )}
                {filters.parentCategory !== 'all' && (
                  <span className="filter-tag">
                    🎯 {filters.parentCategory.charAt(0).toUpperCase() + filters.parentCategory.slice(1)}
                  </span>
                )}
                {filters.location !== 'all' && (
                  <span className="filter-tag">
                    📍 {filters.location.charAt(0).toUpperCase() + filters.location.slice(1)}
                  </span>
                )}
                {filters.eventMode !== 'all' && (
                  <span className="filter-tag">
                    🌐 {filters.eventMode.charAt(0).toUpperCase() + filters.eventMode.slice(1)}
                  </span>
                )}
              </div>
              <button
                className="clear-filters-btn"
                onClick={() => handleApplyFilters({
                  priceRange: 'all',
                  parentCategory: 'all',
                  subcategories: [],
                  location: 'all',
                  eventMode: 'all'
                })}
              >
                ✕ Clear All
              </button>
            </div>
          </div>
        )}

        <div className="events-content">
          {/* Today's Events */}
          <section className="events-section">
            <div className="section-header">
              <h2>🔥 Happening Today</h2>
              <span className="event-count">{filterEvents(todaysEvents).length} events</span>
            </div>

            <div className="events-grid">
              {filterEvents(todaysEvents).length > 0 ? (
                filterEvents(todaysEvents).map((event) => (
                  <div
                    key={event._id}
                    className="event-card modern-card"
                    onClick={() => handleEventClick(event)}
                    style={{ '--accent-color': getEventTypeColor(event.title, event.content) }}
                  >
                    <div className="card-header">
                      <div className="event-badge">
                        <span className="badge-icon">{getEventTypeIcon(event.title, event.content)}</span>
                        <span className="badge-text">TODAY</span>
                      </div>
                      <div className={`priority-indicator priority-${event.priority}`}></div>
                    </div>

                    <div className="card-image">
                      <img
                        src={event.media?.[0]?.url || "https://via.placeholder.com/400x200?text=Event+Image"}
                        alt={event.title}
                      />
                      <div className="image-overlay">
                        <div className="event-stats">
                          <span>👥 {event.registrationStats?.totalRegistered || 0}</span>
                          <span>👀 {event.views || 0}</span>
                          <span>❤️ {event.likes?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-content">
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-description">{event.content}</p>

                      <div className="event-details">
                        <div className="detail-item">
                          <span className="detail-icon">📍</span>
                          <span>{event.eventDetails?.venue || 'Venue TBA'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">🕒</span>
                          <span>{formatTime(event.eventDetails?.eventDate)}</span>
                        </div>
                      </div>

                      <div className="card-footer">
                        <div className="registration-info">
                          {event.eventDetails?.registrationRequired ? (
                            <span className="fee-tag">
                              {event.eventDetails.registrationFee > 0
                                ? `₹${event.eventDetails.registrationFee}`
                                : 'FREE'}
                            </span>
                          ) : (
                            <span className="no-reg-tag">No Registration</span>
                          )}
                        </div>
                        <div className="organizer-info">
                          <span className="organizer-badge">{event.authorType}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="card-actions">
                        <button
                          className="view-btn"
                          onClick={(e) => handleViewEvent(event, e)}
                        >
                          👁️ View Details
                        </button>
                        {event.eventDetails?.registrationRequired && (
                          <button
                            className="register-btn"
                            onClick={(e) => handleRegisterClick(event, e)}
                          >
                            🎫 Register Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-events">
                  <div className="no-events-icon">📅</div>
                  <h3>No events scheduled for today</h3>
                  <p>Check out upcoming events below!</p>
                </div>
              )}
            </div>
          </section>

          {/* Upcoming Events */}
          <section className="events-section">
            <div className="section-header">
              <h2>📅 Upcoming Events</h2>
              <span className="event-count">{filterEvents(upcomingEvents).length} events</span>
            </div>

            <div className="events-grid">
              {filterEvents(upcomingEvents).length > 0 ? (
                filterEvents(upcomingEvents).map((event) => (
                  <div
                    key={event._id}
                    className="event-card modern-card"
                    onClick={() => handleEventClick(event)}
                    style={{ '--accent-color': getEventTypeColor(event.title, event.content) }}
                  >
                    <div className="card-header">
                      <div className="event-badge upcoming-badge">
                        <span className="badge-icon">{getEventTypeIcon(event.title, event.content)}</span>
                        <span className="badge-text">{formatDate(event.eventDetails?.eventDate)}</span>
                      </div>
                      <div className={`priority-indicator priority-${event.priority}`}></div>
                    </div>

                    <div className="card-image">
                      <img
                        src={event.media?.[0]?.url || "https://via.placeholder.com/400x200?text=Event+Image"}
                        alt={event.title}
                      />
                      <div className="image-overlay">
                        <div className="event-stats">
                          <span>👥 {event.registrationStats?.totalRegistered || 0}</span>
                          <span>👀 {event.views || 0}</span>
                          <span>❤️ {event.likes?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="card-content">
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-description">{event.content}</p>

                      <div className="event-details">
                        <div className="detail-item">
                          <span className="detail-icon">📍</span>
                          <span>{event.eventDetails?.venue || 'Venue TBA'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">🕒</span>
                          <span>{formatTime(event.eventDetails?.eventDate)}</span>
                        </div>
                      </div>

                      <div className="card-footer">
                        <div className="registration-info">
                          {event.eventDetails?.registrationRequired ? (
                            <span className="fee-tag">
                              {event.eventDetails.registrationFee > 0
                                ? `₹${event.eventDetails.registrationFee}`
                                : 'FREE'}
                            </span>
                          ) : (
                            <span className="no-reg-tag">No Registration</span>
                          )}
                        </div>
                        <div className="organizer-info">
                          <span className="organizer-badge">{event.authorType}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="card-actions">
                        <button
                          className="view-btn"
                          onClick={(e) => handleViewEvent(event, e)}
                        >
                          👁️ View Details
                        </button>
                        {event.eventDetails?.registrationRequired && (
                          <button
                            className="register-btn"
                            onClick={(e) => handleRegisterClick(event, e)}
                          >
                            🎫 Register Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-events">
                  <div className="no-events-icon">🎯</div>
                  <h3>No upcoming events</h3>
                  <p>Stay tuned for new events!</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />
    </>
  );
}

export default EventsPage;
