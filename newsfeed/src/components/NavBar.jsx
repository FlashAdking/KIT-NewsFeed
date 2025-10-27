import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import "../css/EventPage.css";


const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

const NavBar = ({ 
  searchTerm = "",
  onSearchChange,
  showSearch = true,
  showFilters = true,
  onFilterClick,
  activeFiltersCount = 0,
  isLoggedIn = false,
  userProfile = null,
  onLogout,
  variant = "full" // "full" or "simple"
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    setMenuOpen((open) => !open);
  };

  const getDisplayName = (u) => {
    if (!u) return "User";
    return u.username || u.fullName || (u.email ? u.email.split("@")[0] : "User");
  };

  const handleMenuItemClick = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleLogoutClick = () => {
    setMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  // Simple navbar for detail pages (no search/filter)
  if (variant === "simple") {
    return (
      <nav className="navbar navbar-simple">
        <div className="navbar-brand" onClick={() => navigate("/")}>
          <div className="brand-logo">E</div>
          <div className="brand-text">
            <h1>EventEase</h1>
            <span>Discover • Connect • Participate</span>
          </div>
        </div>

        <div className="navbar-spacer"></div>

        <div className="navbar-actions">
          {isLoggedIn && userProfile ? (
            <div className="profile-wrapper" ref={dropdownRef}>
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
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      getDisplayName(userProfile)
                    )}&background=4f46e5&color=fff`
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
                <div
                  id="profile-menu"
                  className="profile-dropdown-menu"
                  role="menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  {userProfile.role === 'admin' ? (
                    <>
                      <button
                        role="menuitem"
                        className="dropdown-menu-item admin-dashboard-item"
                        onClick={() => handleMenuItemClick("/admin")}
                      >
                        <span className="dropdown-menu-icon">⚙️</span>
                        <span>Admin Dashboard</span>
                      </button>
                      <div className="dropdown-menu-divider"></div>
                      <button
                        role="menuitem"
                        className="dropdown-menu-item dropdown-menu-danger"
                        onClick={handleLogoutClick}
                      >
                        <span className="dropdown-menu-icon">🚪</span>
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        role="menuitem"
                        className="dropdown-menu-item"
                        onClick={() => handleMenuItemClick("/profile")}
                      >
                        <span className="dropdown-menu-icon">👤</span>
                        <span>My Profile</span>
                      </button>
                      
                      <div className="dropdown-menu-divider"></div>
                      <button
                        role="menuitem"
                        className="dropdown-menu-item dropdown-menu-danger"
                        onClick={handleLogoutClick}
                      >
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
              <span className="dropdown-menu-icon">👤</span>
              <span>Login</span>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Full navbar with search and filters (for main events page)
  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate("/")}>
        <div className="brand-logo">E</div>
        <div className="brand-text">
          <h1>EventEase</h1>
          <span>Discover • Connect • Participate</span>
        </div>
      </div>

      {showSearch && (
        <div className="navbar-search">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search events..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
            <button className="search-btn">🔍</button>
          </div>
          {showFilters && (
            <button className="filter-btn" onClick={onFilterClick}>
              <span className="filter-icon">⚙</span>
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="filter-badge">{activeFiltersCount}</span>
              )}
            </button>
          )}
        </div>
      )}

      <div className="navbar-actions">
        {isLoggedIn && userProfile ? (
          <div className="profile-wrapper">
            <button
              className="profile-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              {/* ✅ Profile Image */}
              {userProfile.profilePicture ? (
                <img
                  src={`${API_BASE}${userProfile.profilePicture}`}
                  alt={userProfile.fullName}
                  className="avatar-img"
                  onError={(e) => {
                    // Fallback to first letter
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="avatar-placeholder">
                  {userProfile.fullName?.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Hidden fallback */}
              <div className="avatar-placeholder" style={{ display: 'none' }}>
                {userProfile.fullName?.charAt(0).toUpperCase()}
              </div>

              <div className="profile-name">
                <span>{userProfile.fullName}</span>
                {userProfile.role === 'admin' && (
                  <span className="admin-badge-nav">
                    {userProfile.adminProfile?.adminLevel === 'super' 
                      ? 'Admin' 
                      : 'Moderator'}
                  </span>
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div
                className="profile-dropdown-menu"
                role="menu"
                onClick={(e) => e.stopPropagation()}
              >
                {userProfile.role === 'admin' ? (
                  <>
                    {/* Admin Dashboard Link */}
                    <button
                      role="menuitem"
                      className="dropdown-menu-item admin-dashboard-item"
                      onClick={() => handleMenuItemClick("/admin")}
                    >
                      <span className="dropdown-menu-icon">
                        {userProfile.adminProfile?.adminLevel === 'super' ? '⚙️' : '📝'}
                      </span>
                      <span>
                        {userProfile.adminProfile?.adminLevel === 'super' 
                          ? 'Admin Dashboard' 
                          : 'Moderation'}
                      </span>
                    </button>

                    {/* Post moderators also see Profile */}
                    {userProfile.adminProfile?.adminLevel !== 'super' && (
                      <button
                        role="menuitem"
                        className="dropdown-menu-item"
                        onClick={() => handleMenuItemClick("/profile")}
                      >
                        <span className="dropdown-menu-icon">👤</span>
                        <span>My Profile</span>
                      </button>
                    )}

                    <div className="dropdown-menu-divider"></div>
                    <button
                      role="menuitem"
                      className="dropdown-menu-item dropdown-menu-danger"
                      onClick={handleLogoutClick}
                    >
                      <span className="dropdown-menu-icon">🚪</span>
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      role="menuitem"
                      className="dropdown-menu-item"
                      onClick={() => handleMenuItemClick("/profile")}
                    >
                      <span className="dropdown-menu-icon">👤</span>
                      <span>My Profile</span>
                    </button>
                    
                    <div className="dropdown-menu-divider"></div>
                    <button
                      role="menuitem"
                      className="dropdown-menu-item dropdown-menu-danger"
                      onClick={handleLogoutClick}
                    >
                      <span className="dropdown-menu-icon">🚪</span>
                      <span>Logout</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <button className="login-prompt" onClick={() => navigate('/login')}>
            <div className="guest-avatar">👤</div>
            <span>Login</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
