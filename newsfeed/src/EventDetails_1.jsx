import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useToast } from "./components/ToastProvider";
import NavBar from "./components/NavBar";

const API_BASE = "http://localhost:8080";

function formatDate(d) { 
  return new Date(d).toLocaleDateString("en-US", { 
    month: "long", 
    day: "numeric", 
    year: "numeric" 
  }); 
}

function formatTime(d) { 
  return new Date(d).toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit" 
  }); 
}

export default function EventDetails() {
  const { id } = useParams();
  const loc = useLocation();
  const navigate = useNavigate();
  const { showError, showInfo, showSuccess } = useToast();

  const [event, setEvent] = useState(loc.state?.event || null);
  const [loading, setLoading] = useState(!event);
  const [registering, setRegistering] = useState(false);
  
  // Auth state for NavBar
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Fetch event if not passed via state
  useEffect(() => {
    if (event) return;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { "Content-Type": "application/json" };
        
        // Optional: Include token if available for personalized data
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE}/api/posts/${id}`, { headers });
        if (!res.ok) throw new Error(res.statusText || res.status);
        const json = await res.json();
        
        // Adapt to your API shape
        const e = json.data?.post || json.data || json;
        setEvent(e);
      } catch (err) {
        showError("Failed to load event details");
      } finally { 
        setLoading(false); 
      }
    })();
  }, [id]);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");
    const cache = localStorage.getItem("userData");
    
    if (token && cache) {
      setIsLoggedIn(true);
      setUserProfile(JSON.parse(cache));
    } else {
      setIsLoggedIn(false);
      setUserProfile(null);
    }

    // Verify token validity
    if (token) {
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
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setIsLoggedIn(false);
    setUserProfile(null);
    navigate("/login");
  };

  const handleRegister = async () => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token || !isLoggedIn) {
      showInfo("Please login to register for this event");
      navigate("/login", {
        state: {
          from: `/event/${id}`,
          pendingRegistration: id,
          eventTitle: event?.title
        }
      });
      return;
    }

    // If event has external registration link, open it
    if (event.eventDetails?.registrationLink) {
      window.open(event.eventDetails.registrationLink, "_blank");
      showInfo("Redirected to organizer's registration page");
      return;
    }

    // Internal registration
    setRegistering(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${id}/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        }
      });
      
      if (res.ok) {
        showSuccess("Successfully registered for the event!");
      } else if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        setIsLoggedIn(false);
        setUserProfile(null);
        showInfo("Session expired. Please login again");
        navigate("/login", {
          state: {
            from: `/event/${id}`,
            pendingRegistration: id,
            eventTitle: event?.title
          }
        });
      } else {
        const txt = await res.text().catch(() => "");
        showError(txt || "Registration failed. Please try again.");
      }
    } catch {
      showError("Network error. Please check your connection.");
    } finally { 
      setRegistering(false); 
    }
  };

  if (loading) {
    return (
      <>
        <NavBar 
          showSearch={false}
          showFilters={false}
          isLoggedIn={isLoggedIn}
          userProfile={userProfile}
          onLogout={handleLogout}
        />
        <div className="event-details-loading">
          <div className="loading-spinner"></div>
          <p>Loading event details...</p>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <NavBar 
          showSearch={false}
          showFilters={false}
          isLoggedIn={isLoggedIn}
          userProfile={userProfile}
          onLogout={handleLogout}
        />
        <div className="event-not-found">
          <h2>Event Not Found</h2>
          <p>The event you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate("/")} className="back-home-btn">
            Back to Events
          </button>
        </div>
      </>
    );
  }

  const img = event.media?.[0]?.url || "https://via.placeholder.com/800x400?text=Event";
  const hasExternalLink = event.eventDetails?.registrationLink;

  return (
    <>
      <NavBar 
        showSearch={false}
        showFilters={false}
        isLoggedIn={isLoggedIn}
        userProfile={userProfile}
        onLogout={handleLogout}
      />
      
      <div className="event-details-container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Events
        </button>

        <div className="event-header-section">
          <div className="event-main-image">
            <img src={img} alt={event.title} />
            <div className="event-badge-overlay">
              {event.eventDetails?.registrationRequired && (
                <span className="badge registration-badge">Registration Required</span>
              )}
              {event.eventDetails?.registrationFee > 0 && (
                <span className="badge paid-badge">Paid Event</span>
              )}
            </div>
          </div>

          <div className="event-header-content">
            <h1 className="event-title">{event.title}</h1>
            
            <div className="event-meta-grid">
              <div className="meta-card">
                <span className="meta-icon">📅</span>
                <div className="meta-content">
                  <span className="meta-label">Date</span>
                  <span className="meta-value">
                    {event.eventDetails?.eventDate 
                      ? formatDate(event.eventDetails.eventDate) 
                      : "TBA"}
                  </span>
                </div>
              </div>

              <div className="meta-card">
                <span className="meta-icon">⏰</span>
                <div className="meta-content">
                  <span className="meta-label">Time</span>
                  <span className="meta-value">
                    {event.eventDetails?.eventDate 
                      ? formatTime(event.eventDetails.eventDate) 
                      : "TBA"}
                  </span>
                </div>
              </div>

              <div className="meta-card">
                <span className="meta-icon">📍</span>
                <div className="meta-content">
                  <span className="meta-label">Venue</span>
                  <span className="meta-value">
                    {event.eventDetails?.venue || "TBA"}
                  </span>
                </div>
              </div>

              <div className="meta-card">
                <span className="meta-icon">💰</span>
                <div className="meta-content">
                  <span className="meta-label">Registration Fee</span>
                  <span className="meta-value">
                    {event.eventDetails?.registrationFee 
                      ? `₹${event.eventDetails.registrationFee}` 
                      : "Free"}
                  </span>
                </div>
              </div>
            </div>

            {/* Registration Action */}
            {event.eventDetails?.registrationRequired && (
              <div className="registration-section">
                <button 
                  onClick={handleRegister} 
                  disabled={registering}
                  className="register-button"
                >
                  {registering 
                    ? "Processing..." 
                    : hasExternalLink 
                      ? "Register on Organizer's Site →" 
                      : isLoggedIn 
                        ? "Register Now" 
                        : "Login to Register"}
                </button>
                
                {hasExternalLink && (
                  <p className="external-link-note">
                    <span className="info-icon">ℹ️</span>
                    Registration will be handled by the event organizer
                  </p>
                )}

                {!isLoggedIn && (
                  <p className="login-prompt-text">
                    <span className="info-icon">🔒</span>
                    You need to login first to register for this event
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Event Details Section */}
        <div className="event-body">
          <div className="event-description-section">
            <h2>About This Event</h2>
            <p className="event-description">{event.content}</p>
          </div>

          {/* Organizer Information */}
          {event.author && (
            <div className="organizer-section">
              <h3>Organized By</h3>
              <div className="organizer-card">
                <img 
                  src={event.author.avatar || `https://ui-avatars.com/api/?name=${event.author.name || 'Organizer'}&background=4f46e5&color=fff`}
                  alt={event.author.name}
                  className="organizer-avatar"
                />
                <div className="organizer-info">
                  <h4>{event.author.name || event.author.username}</h4>
                  <p>{event.author.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Details */}
          {event.eventDetails?.maxParticipants && (
            <div className="additional-info">
              <h3>Additional Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Maximum Participants:</span>
                  <span className="info-value">{event.eventDetails.maxParticipants}</span>
                </div>
                {event.eventDetails.registrationDeadline && (
                  <div className="info-item">
                    <span className="info-label">Registration Deadline:</span>
                    <span className="info-value">
                      {formatDate(event.eventDetails.registrationDeadline)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
