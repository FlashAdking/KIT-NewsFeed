import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal";
import "../src/css/EventPage.css";
import FilterModal from "./FilterPage";
import { useToast } from './components/ToastProvider';

function EventsPage() {
  const [todaysEvents, setTodaysEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginAction, setLoginAction] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: "all",
    parentCategory: "all",
    subcategories: [],
    location: "all",
    eventMode: "all",
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [registeringId, setRegisteringId] = useState(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const { showInfo, showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const API_BASE = 'http://localhost:8080'; // ✅ ADDED: API base URL

  const getDisplayName = (u) => {
    if (!u) return "User";
    return u.username || u.fullName || (u.email ? u.email.split("@")[0] : "User");
  };

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      const cache = localStorage.getItem("userData");
      if (token && cache) {
        setIsLoggedIn(true);
        setUserProfile(JSON.parse(cache));
      }
      await checkAuthStatus();
      setLoading(true);
      await fetchEvents();
      setLoading(false);
    })();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      setUserProfile(null);
      return;
    }
    try {
      const resp = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const result = await resp.json();
        const user = result.user || result.data?.user;
        if (user) {
          setIsLoggedIn(true);
          setUserProfile(user);
          localStorage.setItem("userData", JSON.stringify(user));
        }
      } else if (resp.status === 401 || resp.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    } catch {
      // Don't clear on network error
    }
  };

  const fetchEvents = async () => {
    try {
      // ✅ FIXED: Added http:// protocol
      const response = await fetch(`${API_BASE}/api/posts?postType=event&status=published`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.posts) {
        const events = result.data.posts;
        const today = new Date().toISOString().split("T")[0];

        const todayEvents = events.filter((event) => {
          const eventDate = event.eventDetails?.eventDate?.split("T")[0];
          return eventDate === today;
        });

        const upcomingEventsData = events.filter((event) => {
          if (!event.eventDetails?.eventDate) return false;
          const eventDate = new Date(event.eventDetails.eventDate);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          return eventDate > now;
        });

        setTodaysEvents(todayEvents);
        setUpcomingEvents(upcomingEventsData);

        console.log("✅ Events loaded:", {
          today: todayEvents.length,
          upcoming: upcomingEventsData.length,
          total: events.length
        });
      } else {
        setTodaysEvents([]);
        setUpcomingEvents([]);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      showError("Failed to load events. Please refresh the page.");
      setTodaysEvents([]);
      setUpcomingEvents([]);
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    let count = 0;
    if (newFilters.priceRange !== "all") count++;
    if (newFilters.parentCategory !== "all") count++;
    if (newFilters.subcategories.length > 0) count++;
    if (newFilters.location !== "all") count++;
    if (newFilters.eventMode !== "all") count++;
    setActiveFiltersCount(count);
  };

  const filterEvents = (events) => {
    return events.filter((event) => {
      // Search filter
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.content.toLowerCase().includes(searchTerm.toLowerCase());

      // Price filter
      const matchesPrice = (() => {
        if (filters.priceRange === "all") return true;
        const fee = event.eventDetails?.registrationFee || 0;
        if (filters.priceRange === "free") return fee === 0;
        if (filters.priceRange === "paid") return fee > 0;
        if (filters.priceRange === "0-500") return fee >= 0 && fee <= 500;
        if (filters.priceRange === "500-1000") return fee > 500 && fee <= 1000;
        if (filters.priceRange === "1000+") return fee > 1000;
        return true;
      })();

      // Category filter (if you have categories)
      const matchesCategory = filters.parentCategory === "all" ||
        event.categoryId === filters.parentCategory;

      // Location filter
      const matchesLocation = filters.location === "all" ||
        event.eventDetails?.venue?.toLowerCase().includes(filters.location.toLowerCase());

      // Event mode filter (online/offline)
      const matchesEventMode = (() => {
        if (filters.eventMode === "all") return true;
        const venue = event.eventDetails?.venue?.toLowerCase() || "";
        if (filters.eventMode === "online") return venue.includes("online") || venue.includes("virtual");
        if (filters.eventMode === "offline") return !venue.includes("online") && !venue.includes("virtual");
        return true;
      })();

      return matchesSearch && matchesPrice && matchesCategory && matchesLocation && matchesEventMode;
    });
  };


  const handleAvatarClick = (e) => {
    e.stopPropagation();
    setMenuOpen((open) => !open);
  };

  useEffect(() => {
    const close = () => setMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setIsLoggedIn(false);
    setUserProfile(null);
    navigate("/login");
  };

  const handleRegisterClick = (event, e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      showInfo("Please login first to register for this event");
      navigate("/login", {
        state: {
          from: "/",
          pendingRegistration: event._id,
          eventTitle: event.title
        }
      });
      return;
    }
    performRegistration(event._id);
  };

  const performRegistration = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showInfo("Please login to register");
        navigate("/login");
        return;
      }
      setRegisteringId(eventId);
      setRegisterLoading(true);

      const resp = await fetch(`${API_BASE}/api/posts/${eventId}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.ok) {
        showSuccess("Successfully registered for the event!");
      } else if (resp.status === 401 || resp.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        setIsLoggedIn(false);
        setUserProfile(null);
        showInfo("Session expired. Please login again");
        navigate("/login");
      } else {
        const errText = await resp.text().catch(() => "");
        showError(`Registration failed: ${errText || "Please try again"}`);
      }
    } catch {
      showError("Network error. Please check your connection");
    } finally {
      setRegisterLoading(false);
      setRegisteringId(null);
    }
  };

  const handleViewEvent = (event, e) => {
    e.stopPropagation();
    navigate(`/event/${event._id}`, { state: { event } });
  };

  const handleEventClick = (event) => {
    navigate(`/event/${event._id}`, { state: { event } });
  };

  const handleLoginSuccess = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userData", JSON.stringify(userData));
    setIsLoggedIn(true);
    setUserProfile(userData);
    setShowLoginModal(false);
    if (loginAction === "register" && selectedEvent) {
      performRegistration(selectedEvent._id);
    } else if (loginAction === "profile") {
      navigate("/profile");
    }
    setLoginAction("");
    setSelectedEvent(null);
  };

  const getEventTypeColor = (title, content) => {
    const text = (title + " " + content).toLowerCase();
    if (text.includes("hackathon") || text.includes("coding")) return "#FF6B6B";
    if (text.includes("cultural")) return "#4ECDC4";
    if (text.includes("workshop")) return "#45B7D1";
    return "#A8E6CF";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h3>Loading events...</h3>
      </div>
    );
  }

  return (
    <>
      <div className="events-container">
        <nav className="navbar">
          <div className="navbar-brand">
            <div className="brand-logo">E</div>
            <div className="brand-text">
              <h1>EventEase</h1>
              <span>Discover • Connect • Participate</span>
            </div>
          </div>

          <div className="navbar-search">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search events..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-btn">Search</button>
            </div>
            <button className="filter-btn" onClick={() => setShowFilterModal(true)}>
              <span className="filter-icon">⚙</span>
              <span>Filters</span>
              {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
            </button>
          </div>

          {isLoggedIn && userProfile ? (
            <div className="profile-wrapper">
              <button
                type="button"
                className="profile-button"
                onClick={handleAvatarClick}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls="profile-menu"
              >
                <img
                  src={
                    userProfile.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(userProfile))}&background=4f46e5&color=fff`
                  }
                  alt="Profile"
                  className="avatar-img"
                />
                <span className="profile-name">
                  {getDisplayName(userProfile)}
                  {userProfile.role === 'admin' && (
                    <span className="admin-badge-nav">Admin</span>
                  )}
                </span>
                <span aria-hidden="true">▾</span>
              </button>
              {menuOpen && (
                <div id="profile-menu" className="profile-dropdown-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                  {/* ✅ FIXED: Different menus for admin vs regular users */}
                  {userProfile.role === 'admin' ? (
                    <>
                      {/* Admin sees: Dashboard, Settings, Logout */}
                      <button role="menuitem" className="dropdown-menu-item admin-dashboard-item" onClick={() => navigate("/admin")}>
                        <span className="dropdown-menu-icon">⚙️</span>
                        <span>Admin Dashboard</span>
                      </button>
                      <button role="menuitem" className="dropdown-menu-item" onClick={() => navigate("/settings")}>
                        <span className="dropdown-menu-icon">⚙️</span>
                        <span>Settings</span>
                      </button>
                      <div className="dropdown-menu-divider"></div>
                      <button role="menuitem" className="dropdown-menu-item dropdown-menu-danger" onClick={handleLogout}>
                        <span className="dropdown-menu-icon">🚪</span>
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Regular users see: My Profile, Settings, Logout */}
                      <button role="menuitem" className="dropdown-menu-item" onClick={() => navigate("/profile")}>
                        <span className="dropdown-menu-icon">👤</span>
                        <span>My Profile</span>
                      </button>
                      <button role="menuitem" className="dropdown-menu-item" onClick={() => navigate("/settings")}>
                        <span className="dropdown-menu-icon">⚙️</span>
                        <span>Settings</span>
                      </button>
                      <div className="dropdown-menu-divider"></div>
                      <button role="menuitem" className="dropdown-menu-item dropdown-menu-danger" onClick={handleLogout}>
                        <span className="dropdown-menu-icon">🚪</span>
                        <span>Logout</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="login-prompt" onClick={() => navigate("/login")}>
              {/* <img src="https://ui-avatars.com/api/?name=Guest&background=6b7280&color=fff" alt="Guest" className="avatar-img" /> */}
              <span className="dropdown-menu-icon">👤</span>
              <span>Login</span>
            </div>
          )}

        </nav>

        <div className="events-content">
          {/* Today's Events Section */}
          <section className="events-section">
            <div className="section-header">
              <h2>Today's Events</h2>
              <span className="event-count">{filterEvents(todaysEvents).length} events</span>
            </div>
            <div className="events-grid">
              {filterEvents(todaysEvents).length > 0 ? (
                filterEvents(todaysEvents).map((event) => (
                  <div
                    key={event._id}
                    className="event-card modern-card"
                    onClick={() => handleEventClick(event)}
                    style={{ ["--accent-color"]: getEventTypeColor(event.title, event.content) }}
                  >
                    <div className="card-header">
                      <div className="event-badge">
                        <span className="badge-text">TODAY</span>
                      </div>
                    </div>
                    <div className="card-image">
                      <img
                        src={event.media?.[0]?.url || "https://via.placeholder.com/400x200?text=Event"}
                        alt={event.title}
                      />
                    </div>
                    <div className="card-content">
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-description">{event.content}</p>
                      <div className="event-details">
                        <div className="detail-item">
                          <span className="detail-label">Location:</span>
                          <span>{event.eventDetails?.venue || "TBA"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Time:</span>
                          <span>{formatTime(event.eventDetails?.eventDate)}</span>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button className="view-btn" onClick={(e) => handleViewEvent(event, e)}>
                          View Details
                        </button>
                        {event.eventDetails?.registrationRequired && (
                          <button
                            className="register-btn"
                            onClick={(e) => handleRegisterClick(event, e)}
                            disabled={registerLoading && registeringId === event._id}
                          >
                            {registerLoading && registeringId === event._id ? "Registering..." : "Register Now"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-events">
                  <h3>No events today</h3>
                  <p>Check out upcoming events below</p>
                </div>
              )}
            </div>
          </section>

          {/* Upcoming Events Section */}
          <section className="events-section">
            <div className="section-header">
              <h2>Upcoming Events</h2>
              <span className="event-count">{filterEvents(upcomingEvents).length} events</span>
            </div>
            <div className="events-grid">
              {filterEvents(upcomingEvents).length > 0 ? (
                filterEvents(upcomingEvents).map((event) => (
                  <div
                    key={event._id}
                    className="event-card modern-card"
                    onClick={() => handleEventClick(event)}
                    style={{ ["--accent-color"]: getEventTypeColor(event.title, event.content) }}
                  >
                    <div className="card-header">
                      <div className="event-badge">
                        <span className="badge-text">UPCOMING</span>
                      </div>
                    </div>
                    <div className="card-image">
                      <img
                        src={event.media?.[0]?.url || "https://via.placeholder.com/400x200?text=Event"}
                        alt={event.title}
                      />
                    </div>
                    <div className="card-content">
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-description">{event.content}</p>
                      <div className="event-details">
                        <div className="detail-item">
                          <span className="detail-label">Location:</span>
                          <span>{event.eventDetails?.venue || "TBA"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Date:</span>
                          <span>{formatDate(event.eventDetails?.eventDate)}</span>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button className="view-btn" onClick={(e) => handleViewEvent(event, e)}>
                          View Details
                        </button>
                        {event.eventDetails?.registrationRequired && (
                          <button
                            className="register-btn"
                            onClick={(e) => handleRegisterClick(event, e)}
                            disabled={registerLoading && registeringId === event._id}
                          >
                            {registerLoading && registeringId === event._id ? "Registering..." : "Register Now"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-events">
                  <h3>No upcoming events</h3>
                  <p>Check back soon for new events!</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <FilterModal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} filters={filters} onApplyFilters={handleApplyFilters} />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess} />
    </>
  );
}

export default EventsPage;
