import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useToast } from "./components/ToastProvider";
import NavBar from "./components/NavBar";
import "./css/EventDetails.css";

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
  const [loading, setLoading] = useState(!loc.state?.event);
  const [registering, setRegistering] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (event) return;

    const fetchEventData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { "Content-Type": "application/json" };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE}/api/posts/${id}`, { headers });
        if (!res.ok) throw new Error(res.statusText || res.status);
        const json = await res.json();

        const e = json.data?.post || json.data || json;
        setEvent(e);
      } catch (err) {
        showError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // External registration link
    if (event.registrationLink) {
      window.open(event.registrationLink, "_blank");
      showInfo("Redirected to organizer's registration page");
      return;
    }

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
        // Refresh event data to update registration stats
        const refreshRes = await fetch(`${API_BASE}/api/posts/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (refreshRes.ok) {
          const json = await refreshRes.json();
          setEvent(json.data?.post || json.data || json);
        }
      } else if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        setIsLoggedIn(false);
        setUserProfile(null);
        showInfo("Session expired. Please login again");
        navigate("/login");
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
          variant="simple"
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
          variant="simple"
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

  // ✅ ADD THIS - Handles both image formats
  const getImages = () => {
    if (event.imageUrl) {
      // New format: single imageUrl
      return [{ url: `${API_BASE}${event.imageUrl}`, type: 'image' }];
    }

    if (event.media) {
      // Old format: media array
      return event.media.filter(m => m.type === 'image') || [];
    }

    return [];
  };

  const images = getImages();
  const documents = event.media?.filter(m => m.type === 'document') || [];
  const mainImage = images[selectedImage]?.url || "https://via.placeholder.com/800x400?text=Event";
  const hasExternalLink = !!event.registrationLink;


  const isEventPast = event.eventDetails?.eventDate
    ? new Date(event.eventDetails.eventDate) < new Date()
    : false;

  const isRegistrationOpen = event.eventDetails?.registrationDeadline
    ? new Date(event.eventDetails.registrationDeadline) > new Date()
    : true;

  const spotsRemaining = event.eventDetails?.maxParticipants
    ? event.eventDetails.maxParticipants - (event.registrationStats?.totalRegistered || 0)
    : null;

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
          {/* Image Gallery */}
          <div className="event-media-section">
            <div className="event-main-image">
              <img src={mainImage} alt={event.title} />
            </div>

            {images.length > 1 && (
              <div className="image-thumbnails">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.url}
                    alt={`${event.title} ${idx + 1}`}
                    className={selectedImage === idx ? 'active' : ''}
                    onClick={() => setSelectedImage(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Event Header Info */}
          <div className="event-header-content">
            <div className="event-type-badge">
              {event.postType.charAt(0).toUpperCase() + event.postType.slice(1)}
            </div>

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

              {event.eventDetails?.maxParticipants && (
                <div className="meta-card">
                  <span className="meta-icon">👥</span>
                  <div className="meta-content">
                    <span className="meta-label">Capacity</span>
                    <span className="meta-value">
                      {event.registrationStats?.totalRegistered || 0} / {event.eventDetails.maxParticipants}
                    </span>
                  </div>
                </div>
              )}

              {event.eventDetails?.registrationDeadline && (
                <div className="meta-card">
                  <span className="meta-icon">⏳</span>
                  <div className="meta-content">
                    <span className="meta-label">Registration Deadline</span>
                    <span className="meta-value">
                      {formatDate(event.eventDetails.registrationDeadline)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Registration Section */}
            {(event.eventDetails?.registrationRequired || event.registrationLink) && !isEventPast && (
              <div className="registration-section">
                {!isRegistrationOpen ? (
                  <div className="registration-closed">
                    <p>❌ Registration Closed</p>
                    <span>Registration deadline has passed</span>
                  </div>
                ) : spotsRemaining !== null && spotsRemaining <= 0 ? (
                  <div className="registration-full">
                    <p>🎫 Event Full</p>
                    {event.eventDetails?.allowWaitlist && (
                      <button className="waitlist-button" onClick={handleRegister}>
                        Join Waitlist ({event.registrationStats?.waitlistCount || 0})
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleRegister}
                      disabled={registering}
                      className="register-button"
                    >
                      {registering
                        ? "Processing..."
                        : isLoggedIn
                          ? "Register Now"
                          : "Login to Register"}
                    </button>

                    {spotsRemaining !== null && spotsRemaining <= 10 && (
                      <p className="spots-warning">
                        ⚠️ Only {spotsRemaining} spots remaining!
                      </p>
                    )}

                    {/* {hasExternalLink && (
                      <p className="external-link-note">
                        <span className="info-icon">ℹ️</span>
                        Registration handled by organizer
                      </p>
                    )} */}

                    {!isLoggedIn && (
                      <p className="login-prompt-text">
                        <span className="info-icon">🔒</span>
                        Login required to register
                      </p>
                    )}

                    {event.eventDetails?.requiresApproval && (
                      <p className="approval-note">
                        <span className="info-icon">✓</span>
                        Registration requires organizer approval
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Event Body */}
        <div className="event-body">
          {/* Main Description */}
          <div className="event-description-section">
            <h2>About This Event</h2>
            <p className="event-description">{event.content}</p>

            {event.eventDetails?.description && (
              <>
                <h3>Additional Details</h3>
                <p className="event-additional-description">
                  {event.eventDetails.description}
                </p>
              </>
            )}
          </div>

          {/* Instructions */}
          {event.eventDetails?.instructions && (
            <div className="event-instructions-section">
              <h3>📋 Instructions</h3>
              <div className="instructions-content">
                {event.eventDetails.instructions}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {(event.eventDetails?.contactInfo?.email || event.eventDetails?.contactInfo?.phone) && (
            <div className="contact-section">
              <h3>📞 Contact Information</h3>
              <div className="contact-grid">
                {event.eventDetails.contactInfo.email && (
                  <div className="contact-item">
                    <span className="contact-label">Email:</span>
                    <a href={`mailto:${event.eventDetails.contactInfo.email}`} className="contact-value">
                      {event.eventDetails.contactInfo.email}
                    </a>
                  </div>
                )}
                {event.eventDetails.contactInfo.phone && (
                  <div className="contact-item">
                    <span className="contact-label">Phone:</span>
                    <a href={`tel:${event.eventDetails.contactInfo.phone}`} className="contact-value">
                      {event.eventDetails.contactInfo.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents */}
          {documents.length > 0 && (
            <div className="documents-section">
              <h3>📄 Documents</h3>
              <div className="documents-list">
                {documents.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="document-item"
                  >
                    <span className="doc-icon">📎</span>
                    <span className="doc-name">{doc.filename || `Document ${idx + 1}`}</span>
                    {doc.size && (
                      <span className="doc-size">
                        {(doc.size / 1024).toFixed(2)} KB
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}


          {/* Organizer Information */}
          <div className="organizer-section">
            <h3>🎯 Organized By</h3>
            <div className="organizer-card">
              <div className="organizer-type-badge">
                {event.authorType.charAt(0).toUpperCase() + event.authorType.slice(1)}
              </div>
              <div className="organizer-info">
                <h4>{event.clubId?.name || event.createdBy?.name || "Event Organizer"}</h4>
                <p className="organizer-meta">
                  Published on {formatDate(event.publishedAt || event.createdAt)}
                </p>
                {event.views > 0 && (
                  <p className="view-count">👁️ {event.views} views</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
