import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
        `${API_BASE}/api/posts?postType=event&status=published`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        throw new Error(`API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('📦 API Response:', result);

      // ✅ Handle different response structures
      if (result.success && result.data) {
        // Handle paginated response
        const events = result.data.posts || [];
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

  const handleExternalHackathonClick = (hackathon) => {
    window.open(hackathon.registrationLink || hackathon.externalUrl, '_blank', 'noopener,noreferrer');
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

  // ===== RENDER =====
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h3>Loading events...</h3>
      </div>
    );
  }



  // ✅ Dedicated filter function for external hackathons
  const filterExternalHackathons = (hackathons) => {
    return hackathons.filter((hackathon) => {
      // 1. Search filter - checks title, content, tags, and source
      const matchesSearch = (() => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();

        return (
          hackathon.title.toLowerCase().includes(searchLower) ||
          hackathon.content.toLowerCase().includes(searchLower) ||
          hackathon.source.toLowerCase().includes(searchLower) ||
          (hackathon.tags && hackathon.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
          (hackathon.eventDetails?.venue || "").toLowerCase().includes(searchLower)
        );
      })();

      // 2. Price filter - External events are always free to register (redirects)
      const matchesPrice = (() => {
        if (filters.priceRange === "all") return true;
        // External events don't charge on our platform, they redirect
        if (filters.priceRange === "free") return true;
        if (filters.priceRange === "paid") return false; // External events aren't "paid" on our platform
        return true;
      })();

      // 3. Category filter - uses tags and content keywords
      const matchesCategory = (() => {
        if (filters.parentCategory === "all") return true;

        const text = (
          hackathon.title + " " +
          hackathon.content + " " +
          (hackathon.tags ? hackathon.tags.join(" ") : "") +
          " " + hackathon.source
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

      // 4. Subcategory filter - uses tags array
      const matchesSubcategory = (() => {
        if (!filters.subcategories || filters.subcategories.length === 0) return true;

        const text = (
          hackathon.title + " " +
          hackathon.content + " " +
          (hackathon.tags ? hackathon.tags.join(" ") : "")
        ).toLowerCase();

        return filters.subcategories.some(subcat => {
          const subcatKeyword = subcat.replace("-", " ").toLowerCase();
          return text.includes(subcatKeyword);
        });
      })();

      // 5. Location filter - checks venue field
      const matchesLocation = (() => {
        if (filters.location === "all") return true;
        const venue = (hackathon.eventDetails?.venue || "").toLowerCase();
        const locationFilter = filters.location.toLowerCase();

        return venue.includes(locationFilter);
      })();

      // 6. Event mode filter - online/offline/hybrid
      const matchesEventMode = (() => {
        if (filters.eventMode === "all") return true;
        const venue = (hackathon.eventDetails?.venue || "").toLowerCase();

        const isOnline = venue.includes("online") ||
          venue.includes("virtual") ||
          venue.includes("remote") ||
          venue.includes("zoom") ||
          venue.includes("meet") ||
          venue.includes("global");

        const isHybrid = venue.includes("hybrid");
        const isOffline = !isOnline && !isHybrid && venue.length > 0;

        if (filters.eventMode === "online") return isOnline;
        if (filters.eventMode === "offline") return isOffline;
        if (filters.eventMode === "hybrid") return isHybrid;

        return true;
      })();

      // 7. Additional filter - by source platform
      const matchesSource = (() => {
        // You can add source filtering later if needed
        // For now, show all sources
        return true;
      })();

      return (
        matchesSearch &&
        matchesPrice &&
        matchesCategory &&
        matchesSubcategory &&
        matchesLocation &&
        matchesEventMode &&
        matchesSource
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
                    style={{ "--accent-color": getEventTypeColor(event.title, event.content) }}
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
                      key={`external-${idx}`}
                      className="event-card"
                      style={{ "--accent-color": "#667eea" }}
                      onClick={() => handleExternalHackathonClick(hackathon)}
                    >
                      <div className="card-header">
                        <div className="event-badge">
                          <span>{hackathon.source}</span>
                        </div>
                        <div className="priority-indicator" style={{ background: "#667eea" }}></div>
                      </div>

                      <div className="card-image">
                        <img
                          src={
                            hackathon.media?.[0]?.url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              hackathon.title
                            )}&size=400&background=667eea&color=fff&bold=true`
                          }
                          alt={hackathon.title}
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              hackathon.title
                            )}&size=400&background=667eea&color=fff&bold=true`;
                          }}
                        />
                      </div>

                      <div className="card-content">
                        <h3 className="event-title">{hackathon.title}</h3>
                        <p className="event-description">{hackathon.content}</p>

                        <div className="event-details">
                          {hackathon.eventDetails?.venue && (
                            <div className="detail-item">
                              <span className="detail-icon">📍</span>
                              <span>{hackathon.eventDetails.venue}</span>
                            </div>
                          )}
                          {hackathon.eventDetails?.eventDate && (
                            <div className="detail-item">
                              <span className="detail-icon">📅</span>
                              <span>{formatDate(hackathon.eventDetails.eventDate)}</span>
                            </div>
                          )}
                        </div>

                        <div className="card-footer">
                          <span className="fee-tag">External Event</span>
                          <span className="organizer-badge" style={{ background: "#667eea" }}>
                            {hackathon.source}
                          </span>
                        </div>

                        <div className="card-actions">
                          <button
                            className="register-btn"
                            style={{
                              background: "linear-gradient(135deg, #667eea, #764ba2)",
                              width: "100%"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExternalHackathonClick(hackathon);
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
