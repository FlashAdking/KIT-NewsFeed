import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginModal from "./LoginModal";
import "../src/css/EventPage.css";
import FilterModal from "./FilterPage";
import { useToast } from './components/ToastProvider';
import NavBar from './components/NavBar';

function EventsPage() {
  // ===== STATE DECLARATIONS =====
  const [todaysEvents, setTodaysEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginAction, setLoginAction] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: "all",
    parentCategory: "all",
    subcategories: [],
    location: "all",
    eventMode: "all",
  });
  const location = useLocation();
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [registeringId, setRegisteringId] = useState(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // External hackathons state
  const [externalHackathons, setExternalHackathons] = useState([]);
  const [externalLoading, setExternalLoading] = useState(true);
  const [externalError, setExternalError] = useState(null);

  // ===== HOOKS =====
  const { showInfo, showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // ===== CONSTANTS =====
  const API_BASE = 'http://localhost:8080';
  const SCRAPER_API = 'http://localhost:8000';

  // ===== useEffect - ONLY ONE =====
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

      // Fetch both internal and external events in parallel
      await Promise.all([fetchEvents(), fetchExternalHackathons()]);

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== FUNCTIONS =====

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
      const response = await fetch(
        `${API_BASE}/api/posts?status=published`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('📦 API Response:', result);

      if (result.success && result.data) {
        const events = result.data.posts || [];

        // ✅ FIX: Get today's date properly
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        console.log('📅 Today:', today);

        const todayEvents = events.filter((event) => {
          if (!event.eventDetails?.eventDate) return false;

          const eventDate = new Date(event.eventDetails.eventDate);
          const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

          const isToday = eventDay.getTime() === today.getTime();

          console.log('Event:', event.title, 'Date:', eventDay, 'Is today?', isToday);

          return isToday;
        });

        const upcomingEventsData = events.filter((event) => {
          if (!event.eventDetails?.eventDate) return false;

          const eventDate = new Date(event.eventDetails.eventDate);
          const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

          return eventDay > today;
        });

        setTodaysEvents(todayEvents);
        setUpcomingEvents(upcomingEventsData);

        console.log("✅ Events loaded:", {
          today: todayEvents.length,
          upcoming: upcomingEventsData.length,
          total: events.length,
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


  const fetchExternalHackathons = async () => {
    setExternalLoading(true);
    setExternalError(null);

    try {
      const response = await fetch(`${SCRAPER_API}/hackathons`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch external hackathons');
      }

      const hackathons = await response.json();
      setExternalHackathons(hackathons || []);

      console.log("✅ External hackathons loaded:", hackathons.length);
    } catch (error) {
      console.error("Failed to fetch external hackathons:", error);
      setExternalError("Unable to load external hackathons. Please try again later.");
    } finally {
      setExternalLoading(false);
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
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.eventDetails?.description || "").toLowerCase().includes(searchTerm.toLowerCase());

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

      const matchesCategory = (() => {
        if (filters.parentCategory === "all") return true;
        const text = (event.title + " " + event.content + " " + (event.eventDetails?.description || "")).toLowerCase();
        const categoryKeywords = {
          tech: ["hackathon", "coding", "programming", "tech", "ai", "ml", "blockchain", "cyber", "development", "software"],
          academic: ["workshop", "seminar", "conference", "research", "presentation", "lecture", "academic", "study"],
          cultural: ["cultural", "music", "dance", "drama", "art", "exhibition", "performance", "festival", "celebration"],
          sports: ["sports", "cricket", "football", "basketball", "athletics", "tournament", "match", "game", "championship"]
        };
        const keywords = categoryKeywords[filters.parentCategory] || [];
        return keywords.some(keyword => text.includes(keyword));
      })();

      const matchesSubcategory = (() => {
        if (!filters.subcategories || filters.subcategories.length === 0) return true;
        const text = (event.title + " " + event.content + " " + (event.eventDetails?.description || "")).toLowerCase();
        return filters.subcategories.some(subcat => {
          const subcatKeyword = subcat.replace("-", " ");
          return text.includes(subcatKeyword);
        });
      })();

      const matchesLocation = (() => {
        if (filters.location === "all") return true;
        const venue = (event.eventDetails?.venue || "").toLowerCase();
        return venue.includes(filters.location.toLowerCase());
      })();

      const matchesEventMode = (() => {
        if (filters.eventMode === "all") return true;
        const venue = (event.eventDetails?.venue || "").toLowerCase();
        const isOnline = venue.includes("online") || venue.includes("virtual") || venue.includes("zoom") || venue.includes("meet");
        const isOffline = !isOnline && venue.length > 0;
        if (filters.eventMode === "online") return isOnline;
        if (filters.eventMode === "offline") return isOffline;
        if (filters.eventMode === "hybrid") return venue.includes("hybrid");
        return true;
      })();

      return matchesSearch && matchesPrice && matchesCategory && matchesSubcategory && matchesLocation && matchesEventMode;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setIsLoggedIn(false);
    setUserProfile(null);
    navigate("/login");
  };

  // ✅ UPDATED: Check login for both internal and external registration
  const handleRegisterClick = (event, e) => {
    e.stopPropagation();

    // Check if user is logged in
    if (!isLoggedIn) {
      showInfo("Please login first to register for this event");
      navigate("/login", {
        state: {
          from: "/",
          pendingRegistration: event._id,
          eventTitle: event.title,
          registrationLink: event.registrationLink // ✅ Pass registration link
        }
      });
      return;
    }

    // User is logged in
    if (event.registrationLink) {
      // External registration - open link in new tab
      window.open(event.registrationLink, '_blank', 'noopener,noreferrer');
      showSuccess("Registration link opened. Complete your registration there!");
    } else {
      // Internal registration via API
      performRegistration(event._id);
    }
  };

  // Internal registration function (keep as is)
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
        const errData = await resp.json().catch(() => ({}));
        showError(errData.message || "Registration failed. Please try again");
      }
    } catch (error) {
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

  const handleExternalHackathonClick = (hackathon) => {
    window.open(hackathon.registrationLink || hackathon.externalUrl, '_blank', 'noopener,noreferrer');
  };

  // In your login success handler
  const handleLoginSuccess = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userData", JSON.stringify(userData));
    setIsLoggedIn(true);
    setUserProfile(userData);
    setShowLoginModal(false);

    // Check if there was a pending registration
    const state = location.state;
    if (state?.registrationLink) {
      // External registration - open link
      window.open(state.registrationLink, '_blank', 'noopener,noreferrer');
      showSuccess("Registration link opened. Complete your registration!");
    } else if (state?.pendingRegistration) {
      // Internal registration
      performRegistration(state.pendingRegistration);
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

  // ===== RENDER =====
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h3>Loading events...</h3>
      </div>
    );
  }



  const filterExternalHackathons = (hackathons) => {
    if (!hackathons || !Array.isArray(hackathons)) return [];

    return hackathons.filter((hackathon) => {
      if (!hackathon || !hackathon.title) return false;

      // 1. Search filter - ✅ Use correct field names
      const matchesSearch = (() => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();

        return (
          (hackathon.title || "").toLowerCase().includes(searchLower) ||
          (hackathon.description || "").toLowerCase().includes(searchLower) || // ✅ Changed from content
          (hackathon.source || "").toLowerCase().includes(searchLower) ||
          (hackathon.location || "").toLowerCase().includes(searchLower) || // ✅ Changed from eventDetails.venue
          (hackathon.tags && Array.isArray(hackathon.tags) &&
            hackathon.tags.some(tag => tag && typeof tag === 'string' && tag.toLowerCase().includes(searchLower))
          )
        );
      })();

      // 2. Price filter
      const matchesPrice = (() => {
        if (filters.priceRange === "all") return true;
        if (filters.priceRange === "free") return true;
        if (filters.priceRange === "paid") return false;
        return true;
      })();

      // 3. Category filter - ✅ Use correct field names
      const matchesCategory = (() => {
        if (filters.parentCategory === "all") return true;

        const text = (
          (hackathon.title || "") + " " +
          (hackathon.description || "") + " " + // ✅ Changed from content
          (hackathon.tags && Array.isArray(hackathon.tags) ? hackathon.tags.join(" ") : "") +
          " " + (hackathon.source || "")
        ).toLowerCase();

        const categoryKeywords = {
          tech: [
            "hackathon", "coding", "programming", "tech", "ai", "ml", "machine learning",
            "blockchain", "crypto", "ethereum", "web3", "defi", "nft", "smart contract",
            "cyber", "security", "development", "software", "developer", "devpost",
            "mlh", "api", "cloud", "data", "algorithm", "open source"
          ],
          academic: [
            "workshop", "seminar", "conference", "research", "presentation",
            "lecture", "academic", "study", "educational", "learning", "training"
          ],
          cultural: [
            "cultural", "music", "dance", "drama", "art", "exhibition",
            "performance", "festival", "celebration", "creative"
          ],
          sports: [
            "sports", "cricket", "football", "basketball", "athletics",
            "tournament", "match", "game", "championship", "esports"
          ]
        };

        const keywords = categoryKeywords[filters.parentCategory] || [];
        return keywords.some(keyword => text.includes(keyword));
      })();

      // 4. Subcategory filter - ✅ Use correct field names
      const matchesSubcategory = (() => {
        if (!filters.subcategories || filters.subcategories.length === 0) return true;

        const text = (
          (hackathon.title || "") + " " +
          (hackathon.description || "") + " " + // ✅ Changed from content
          (hackathon.tags && Array.isArray(hackathon.tags) ? hackathon.tags.join(" ") : "")
        ).toLowerCase();

        return filters.subcategories.some(subcat => {
          const subcatKeyword = subcat.replace("-", " ").toLowerCase();
          return text.includes(subcatKeyword);
        });
      })();

      // 5. Location filter - ✅ Use correct field names
      const matchesLocation = (() => {
        if (filters.location === "all") return true;
        const location = (hackathon.location || "").toLowerCase(); // ✅ Changed from eventDetails.venue
        const locationFilter = filters.location.toLowerCase();
        return location.includes(locationFilter);
      })();

      // 6. Event mode filter - ✅ Use correct field names
      const matchesEventMode = (() => {
        if (filters.eventMode === "all") return true;
        const location = (hackathon.location || "").toLowerCase(); // ✅ Changed from eventDetails.venue

        const isOnline = location.includes("online") ||
          location.includes("virtual") ||
          location.includes("remote") ||
          location.includes("zoom") ||
          location.includes("meet") ||
          location.includes("worldwide");

        const isHybrid = location.includes("hybrid");
        const isOffline = !isOnline && !isHybrid && location.length > 0;

        if (filters.eventMode === "online") return isOnline;
        if (filters.eventMode === "offline") return isOffline;
        if (filters.eventMode === "hybrid") return isHybrid;

        return true;
      })();

      return (
        matchesSearch &&
        matchesPrice &&
        matchesCategory &&
        matchesSubcategory &&
        matchesLocation &&
        matchesEventMode
      );
    });
  };



  return (
    <>
      <div className="events-container">
        {/* ✅ Updated NavBar with all necessary props */}
        <NavBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showSearch={true}
          showFilters={true}
          onFilterClick={() => setShowFilterModal(true)}
          activeFiltersCount={activeFiltersCount}
          isLoggedIn={isLoggedIn}
          userProfile={userProfile}
          onLogout={handleLogout}
        />

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
                    style={{ "--accent-color": getEventTypeColor(event.title, event.content) }}
                  >
                    <div className="card-header">
                      <div className="event-badge">
                        <span className="badge-text">{event.postType?.toUpperCase() || 'EVENT'}</span>
                      </div>
                      {event.priority === 'high' && (
                        <div className="priority-indicator" style={{ background: "#ff6b6b" }}></div>
                      )}
                    </div>

                    <div className="card-image">
                      <img
                        src={
                          event.imageUrl
                            ? `${API_BASE}${event.imageUrl}`
                            : event.media?.[0]?.url
                            || "https://via.placeholder.com/400x200?text=Event"
                        }
                        alt={event.title}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/400x200?text=Event";
                        }}
                      />
                    </div>

                    <div className="card-content">
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-description">{event.content}</p>

                      {event.clubId && (
                        <div className="organizer-badge" style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                          🏛️ {event.clubId.clubName || 'College Club'}
                        </div>
                      )}

                      <div className="event-details">
                        <div className="detail-item">
                          <span className="detail-icon">📍</span>
                          <span>{event.eventDetails?.venue || "TBA"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">📅</span>
                          <span>{formatDate(event.eventDetails?.eventDate)}</span>
                        </div>
                        {event.eventDetails?.maxParticipants && (
                          <div className="detail-item">
                            <span className="detail-icon">👥</span>
                            <span>{event.eventDetails.maxParticipants} max</span>
                          </div>
                        )}
                      </div>

                      <div className="card-actions">
                        <button className="view-btn" onClick={(e) => handleViewEvent(event, e)}>
                          View Details
                        </button>
                        {(event.registrationLink || event.eventDetails?.registrationRequired) && (
                          <button
                            className="register-btn"
                            onClick={(e) => handleRegisterClick(event, e)}
                            disabled={registerLoading && registeringId === event._id}
                          >
                            {registerLoading && registeringId === event._id ? "Registering..." : "Register Now →"}
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
                    style={{ "--accent-color": getEventTypeColor(event.title, event.content) }}
                  >
                    <div className="card-header">
                      <div className="event-badge">
                        <span className="badge-text">{event.postType?.toUpperCase() || 'UPCOMING'}</span>
                      </div>
                      {event.priority === 'high' && (
                        <div className="priority-indicator" style={{ background: "#ff6b6b" }}></div>
                      )}
                    </div>

                    <div className="card-image">
                      <img
                        src={
                          event.imageUrl
                            ? `${API_BASE}${event.imageUrl}`
                            : event.media?.[0]?.url
                            || "https://via.placeholder.com/400x200?text=Event"
                        }
                        alt={event.title}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/400x200?text=Event";
                        }}
                      />
                    </div>

                    <div className="card-content">
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-description">{event.content}</p>

                      {/* {event.clubId && (
                        <div className="organizer-badge" style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                          🏛️ {event.clubId.clubName || 'College Club'}
                        </div>
                      )} */}

                      <div className="event-details">
                        <div className="detail-item">
                          <span className="detail-icon">📍</span>
                          <span>{event.eventDetails?.venue || "TBA"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">📅</span>
                          <span>{formatDate(event.eventDetails?.eventDate)}</span>
                        </div>
                        {event.eventDetails?.maxParticipants && (
                          <div className="detail-item">
                            <span className="detail-icon">👥</span>
                            <span>{event.eventDetails.maxParticipants} max</span>
                          </div>
                        )}
                      </div>

                      <div className="card-actions">
                        <button className="view-btn" onClick={(e) => handleViewEvent(event, e)}>
                          View Details
                        </button>
                        {(event.registrationLink || event.eventDetails?.registrationRequired) && (
                          <button
                            className="register-btn"
                            onClick={(e) => handleRegisterClick(event, e)}
                            disabled={registerLoading && registeringId === event._id}
                          >
                            {registerLoading && registeringId === event._id ? "Registering..." : "Register Now →"}
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





          {/* External Hackathons Section */}
          <section className="events-section">
            <div className="section-header">
              <h2>🌐 Over The Internet</h2>
              <span className="event-count">
                {externalLoading ? (
                  <span className="loading-badge">Loading...</span>
                ) : (
                  `${filterExternalHackathons(externalHackathons).length} hackathons`
                )}
              </span>
            </div>

            {externalLoading ? (
              <div className="events-grid">
                <div className="no-events">
                  <div className="loading-spinner-external"></div>
                  <p>Discovering hackathons from around the world...</p>
                  <small>This may take a few moments</small>
                </div>
              </div>
            ) : externalError ? (
              <div className="events-grid">
                <div className="no-events">
                  <div className="no-events-icon">⚠️</div>
                  <h3>Unable to Load External Hackathons</h3>
                  <p>{externalError}</p>
                  <button className="retry-btn" onClick={fetchExternalHackathons}>
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="events-grid">
                {filterExternalHackathons(externalHackathons).length > 0 ? (
                  filterExternalHackathons(externalHackathons).map((hackathon, idx) => (
                    <div
                      key={`external-${hackathon.id || idx}`}
                      className="event-card modern-card"
                      style={{ "--accent-color": "#667eea" }}
                      onClick={() => window.open(hackathon.url, '_blank', 'noopener,noreferrer')}
                    >
                      <div className="card-header">
                        <div className="event-badge">
                          <span className="badge-text">{hackathon.source}</span>
                        </div>
                        <div className="priority-indicator" style={{ background: "#667eea" }}></div>
                      </div>

                      <div className="card-image">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                            hackathon.title
                          )}&size=400&background=667eea&color=fff&bold=true`}
                          alt={hackathon.title}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/400x200?text=Hackathon";
                          }}
                        />
                      </div>

                      <div className="card-content">
                        <h3 className="event-title">{hackathon.title}</h3>
                        <p className="event-description">{hackathon.description}</p>

                        <div className="event-details">
                          {hackathon.location && (
                            <div className="detail-item">
                              <span className="detail-icon">📍</span>
                              <span>{hackathon.location}</span>
                            </div>
                          )}
                          {hackathon.date && (
                            <div className="detail-item">
                              <span className="detail-icon">📅</span>
                              <span>{hackathon.date}</span>
                            </div>
                          )}
                          {hackathon.prize && (
                            <div className="detail-item">
                              <span className="detail-icon">🏆</span>
                              <span>{hackathon.prize}</span>
                            </div>
                          )}
                        </div>

                        {hackathon.tags && hackathon.tags.length > 0 && (
                          <div className="event-tags" style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {hackathon.tags.slice(0, 3).map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  background: '#f0f0f0',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  color: '#666'
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="card-actions">
                          <button
                            className="register-btn"
                            style={{
                              background: "linear-gradient(135deg, #667eea, #764ba2)",
                              width: "100%"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(hackathon.url, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            Visit {hackathon.source} →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-events">
                    <div className="no-events-icon">🔍</div>
                    <h3>No Matching External Hackathons</h3>
                    <p>
                      {externalHackathons.length > 0
                        ? "Try adjusting your search or filters"
                        : "Check back later for exciting opportunities from around the world"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>



        </div>
      </div>







      <FilterModal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} filters={filters} onApplyFilters={handleApplyFilters} />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess} />
    </>
  );
}

export default EventsPage;
