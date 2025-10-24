import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./components/ToastProvider";
import NavBar from "./components/NavBar";
import "./css/RaiseRepRequest.css";

function RaiseRepRequest() {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const [formData, setFormData] = useState({
    clubName: "",
    clubType: "", // ✅ Added
    collegeName: "",
    fullName: "",
    email: "",
    clubPosition: "",
    officialEmail: "",
    officialPhone: "",
    recommendationLetterUrl: "",
  });

  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const API_BASE = "http://localhost:8080";

  useEffect(() => {
    checkAuthStatus();
    checkEligibility();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");
    const cache = localStorage.getItem("userData");

    if (token && cache) {
      setIsLoggedIn(true);
      const userData = JSON.parse(cache);
      setUserProfile(userData);

      setFormData((prev) => ({
        ...prev,
        fullName: userData.fullName || "",
        email: userData.email || "",
      }));
    } else {
      showError("Please login to continue");
      navigate("/login");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setIsLoggedIn(false);
    setUserProfile(null);
    navigate("/login");
  };

  const checkEligibility = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login to continue");
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/club-representative/eligibility`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setEligibility(result.data);

        if (!result.data.canRequest) {
          showError(result.data.reason || "You are not eligible");
          navigate("/profile");
        }
      } else {
        showError("Failed to check eligibility");
        navigate("/profile");
      }
    } catch (error) {
      console.error("Eligibility check error:", error);
      showError("Failed to check eligibility");
      navigate("/profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clubName) {
      showError("Please enter club name");
      return;
    }

    if (!formData.clubType) {
      // ✅ Added
      showError("Please select club type");
      return;
    }

    if (!formData.collegeName) {
      showError("Please enter college name");
      return;
    }

    if (!formData.clubPosition) {
      showError("Please select a position");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const payload = {
        clubName: formData.clubName,
        clubType: formData.clubType, // ✅ Added
        collegeName: formData.collegeName,
        clubPosition: formData.clubPosition,
        officialEmail: formData.officialEmail,
        officialPhone: formData.officialPhone,
        recommendationLetterUrl: formData.recommendationLetterUrl,
      };

      const response = await fetch(
        `${API_BASE}/api/club-representative/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        showSuccess(
          "Application submitted successfully! Waiting for admin approval."
        );
        navigate("/profile");
      } else {
        const error = await response.json();
        showError(error.message || "Failed to submit application");
      }
    } catch (error) {
      showError("Network error. Please try again");
    } finally {
      setSubmitting(false);
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
        <div className="rep-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </>
    );
  }

  if (eligibility && !eligibility.canRequest) {
    return (
      <>
        <NavBar
          variant="simple"
          isLoggedIn={isLoggedIn}
          userProfile={userProfile}
          onLogout={handleLogout}
        />
        <div className="rep-ineligible">
          <div className="ineligible-icon">⚠️</div>
          <h2>Not Eligible</h2>
          <p>
            {eligibility?.reason ||
              "You are not eligible to become a club representative"}
          </p>
          <button onClick={() => navigate("/profile")} className="back-btn-rep">
            Back to Profile
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar
        variant="simple"
        isLoggedIn={isLoggedIn}
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      <div className="rep-request-container">
        <div className="rep-request-wrapper">
          <button className="back-btn-rep" onClick={() => navigate("/profile")}>
            ← Back to Profile
          </button>

          <div className="rep-request-header">
            <h1>Apply for Club Representative</h1>
            <p>
              Submit your application to become an official representative for a
              club
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rep-request-form">
            {/* Club Information */}
            <div className="form-section">
              <h3>Club Information</h3>

              <div className="form-group">
                <label>College Name *</label>
                <input
                  type="text"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleInputChange}
                  placeholder="Enter your college name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Club Name *</label>
                <input
                  type="text"
                  name="clubName"
                  value={formData.clubName}
                  onChange={handleInputChange}
                  placeholder="Enter your club name"
                  required
                />
              </div>

              {/* ✅ Added Club Type Dropdown */}
              <div className="form-group">
                <label>Club Type *</label>
                <select
                  name="clubType"
                  value={formData.clubType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Club Type</option>
                  <option value="technical">Technical</option>
                  <option value="cultural">Cultural</option>
                  <option value="sports">Sports</option>
                  <option value="social">Social</option>
                  <option value="entrepreneurship">Entrepreneurship</option>
                  <option value="arts">Arts</option>
                  <option value="literary">Literary</option>
                  <option value="music">Music</option>
                  <option value="dance">Dance</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Personal Information */}
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>Position Applying For *</label>
                  <select
                    name="clubPosition"
                    value={formData.clubPosition}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select position</option>
                    <option value="president">President</option>
                    <option value="vice-president">Vice President</option>
                    <option value="secretary">Secretary</option>
                    <option value="treasurer">Treasurer</option>
                    <option value="coordinator">Coordinator</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Official Contact */}
            <div className="form-section">
              <h3>Official Contact Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Official Email *</label>
                  <input
                    type="email"
                    name="officialEmail"
                    value={formData.officialEmail}
                    onChange={handleInputChange}
                    placeholder="official@example.com"
                    required
                  />
                  <small>Email address for official club communications</small>
                </div>

                <div className="form-group">
                  <label>Official Phone *</label>
                  <input
                    type="tel"
                    name="officialPhone"
                    value={formData.officialPhone}
                    onChange={handleInputChange}
                    placeholder="+91 9876543210"
                    required
                  />
                  <small>Phone number for club-related matters</small>
                </div>
              </div>
            </div>

            {/* Supporting Documents */}
            <div className="form-section">
              <h3>Position Recommendation Letter</h3>
              <div className="form-group">
                <label>Recommendation Letter URL (Optional)</label>
                <input
                  type="url"
                  name="recommendationLetterUrl"
                  value={formData.recommendationLetterUrl}
                  onChange={handleInputChange}
                  placeholder="https://drive.google.com/... (Google Drive, Dropbox, etc.)"
                />
                <small>
                  Upload your position recommendation letter if available
                </small>
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-actions-rep">
              <button
                type="button"
                className="cancel-btn-rep"
                onClick={() => navigate("/profile")}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn-rep"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default RaiseRepRequest;
