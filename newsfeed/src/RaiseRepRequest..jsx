import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './components/ToastProvider';
import NavBar from './components/NavBar';
import './css/RaiseRepRequest.css';

function RaiseRepRequest() {
  const [clubs, setClubs] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const [formData, setFormData] = useState({
    isNewClub: false,          // Toggle for new club
    clubId: '',
    newClubName: '',           // For new club name
    newClubType: '',           // For new club type
    newClubDepartment: '',     // For new club department
    fullName: '',
    email: '',
    department: '',
    semester: '',
    clubPosition: '',
    officialEmail: '',
    officialPhone: '',
    statement: '',
    supportingDocUrl: '',
  });

  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const API_BASE = 'http://localhost:8080';

  useEffect(() => {
    checkAuthStatus();
    checkEligibility();
    fetchAvailableClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    const cache = localStorage.getItem('userData');

    if (token && cache) {
      setIsLoggedIn(true);
      const userData = JSON.parse(cache);
      setUserProfile(userData);

      setFormData(prev => ({
        ...prev,
        fullName: userData.fullName || '',
        email: userData.email || '',
        department: userData.department || '',
      }));
    } else {
      showError('Please login to continue');
      navigate('/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setUserProfile(null);
    navigate('/login');
  };

  const checkEligibility = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showError('Please login to continue');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE}/api/club-representative/eligibility`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Eligibility result:', result.data);

        setEligibility(result.data);

        if (!result.data.canRequest) {
          showError(result.data.reason || 'You are not eligible');
          navigate('/profile');
        }
      } else {
        showError('Failed to check eligibility');
        navigate('/profile');
      }
    } catch (error) {
      console.error('Eligibility check error:', error);
      showError('Failed to check eligibility');
      navigate('/profile');
    }
  };

  // Update the fetchAvailableClubs function
  const fetchAvailableClubs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/club-representative/clubs/available`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        const fetchedClubs = result.data?.clubs || [];

        // ✅ Add hardcoded clubs as fallback
        const defaultClubs = [
          { _id: 'walk-with-world', clubName: 'Walk with World' },
          { _id: 'rotary-club', clubName: 'Rotary Club' },
          { _id: 'acads', clubName: 'ACADS' },
          { _id: 'aura', clubName: 'AURA' },
          { _id: 'mavericks', clubName: "Maverick's" }
        ];

        // Combine fetched clubs with default clubs (avoid duplicates)
        const allClubs = [...fetchedClubs];
        defaultClubs.forEach(defaultClub => {
          if (!allClubs.find(c => c.clubName === defaultClub.clubName)) {
            allClubs.push(defaultClub);
          }
        });

        setClubs(allClubs);
      }
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
      // ✅ If fetch fails, use default clubs
      setClubs([
        { _id: 'walk-with-world', clubName: 'Walk with World' },
        { _id: 'rotary-club', clubName: 'Rotary Club' },
        { _id: 'acads', clubName: 'ACADS' },
        { _id: 'aura', clubName: 'AURA' },
        { _id: 'mavericks', clubName: "Maverick's" }
      ]);
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.isNewClub && !formData.clubId) {
      showError('Please select a club');
      return;
    }

    if (formData.isNewClub && (!formData.newClubName || !formData.newClubType)) {
      showError('Please provide club name and type');
      return;
    }

    if (!formData.clubPosition) {
      showError('Please select a position');
      return;
    }

    if (formData.statement.length < 50) {
      showError('Statement must be at least 50 characters');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');

      // Build payload based on new vs existing club
      const payload = {
        // For existing club
        ...(formData.clubId && { clubId: formData.clubId }),

        // For new club
        ...(formData.isNewClub && {
          clubName: formData.newClubName,
          clubType: formData.newClubType,
          department: formData.newClubDepartment || 'General'
        }),

        // Common fields
        clubPosition: formData.clubPosition,
        officialEmail: formData.officialEmail,
        officialPhone: formData.officialPhone,
        statement: formData.statement,
        supportingDocUrl: formData.supportingDocUrl
      };

      const response = await fetch(`${API_BASE}/api/club-representative/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data.newClubCreated) {
          showSuccess('New club registered and application submitted! Waiting for admin approval.');
        } else {
          showSuccess('Application submitted successfully! Waiting for admin approval.');
        }
        navigate('/profile');
      } else {
        const error = await response.json();
        showError(error.message || 'Failed to submit application');
      }
    } catch (error) {
      showError('Network error. Please try again');
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
          <p>{eligibility?.reason || 'You are not eligible to become a club representative'}</p>
          <button onClick={() => navigate('/profile')} className="back-btn-rep">
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
          <button className="back-btn-rep" onClick={() => navigate('/profile')}>
            ← Back to Profile
          </button>

          <div className="rep-request-header">
            <h1>Apply for Club Representative</h1>
            <p>Submit your application to become an official representative for a club</p>
          </div>

          <form onSubmit={handleSubmit} className="rep-request-form">
            {/* Club Selection */}
            <div className="form-section">
              <h3>Club Information</h3>

              {/* Toggle between existing and new club */}
              <div className="form-group">
                <label>Club Registration Type *</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="clubTypeSelect"
                      value="existing"
                      checked={formData.isNewClub === false}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        isNewClub: false,
                        clubId: '',
                        newClubName: '',
                        newClubType: '',
                        newClubDepartment: ''
                      }))}
                    />
                    <span>Select Existing Club</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="clubTypeSelect"
                      value="new"
                      checked={formData.isNewClub === true}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        isNewClub: true,
                        clubId: ''
                      }))}
                    />
                    <span>Register New Club</span>
                  </label>
                </div>
              </div>

              {/* Existing Club Selection */}
              {!formData.isNewClub ? (
                <div className="form-group">
                  <label>Select Club *</label>
                  <select
                    name="clubId"
                    value={formData.clubId}
                    onChange={handleInputChange}
                    required={!formData.isNewClub}
                  >
                    <option value="">Choose a club</option>
                    {clubs.map((club) => (
                      <option key={club._id} value={club._id}>
                        {club.clubName}
                      </option>
                    ))}
                  </select>
                  {clubs.length === 0 && (
                    <small className="text-info">No clubs available. You can register a new club instead.</small>
                  )}
                </div>
              ) : (
                /* New Club Registration */
                <>
                  <div className="form-group">
                    <label>New Club Name *</label>
                    <input
                      type="text"
                      name="newClubName"
                      value={formData.newClubName}
                      onChange={handleInputChange}
                      placeholder="Enter club name (e.g., Walk with World)"
                      required={formData.isNewClub}
                    />
                  </div>

                  <div className="form-group">
                    <label>Club Type *</label>
                    <select
                      name="newClubType"
                      value={formData.newClubType}
                      onChange={handleInputChange}
                      required={formData.isNewClub}
                    >
                      <option value="">Select club type</option>
                      <option value="academic">Academic</option>
                      <option value="cultural">Cultural</option>
                      <option value="sports">Sports</option>
                      <option value="technical">Technical</option>
                      <option value="social">Social</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Club Department (Optional)</label>
                    <input
                      type="text"
                      name="newClubDepartment"
                      value={formData.newClubDepartment}
                      onChange={handleInputChange}
                      placeholder="e.g., Computer Science, General"
                    />
                    <small>Leave blank for college-wide clubs</small>
                  </div>
                </>
              )}

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
                  <label>Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Semester *</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
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

            {/* Statement */}
            <div className="form-section">
              <h3>Statement of Purpose</h3>
              <div className="form-group">
                <label>Why do you want to be a club representative? *</label>
                <textarea
                  name="statement"
                  value={formData.statement}
                  onChange={handleInputChange}
                  placeholder="Describe your motivation, relevant experience, and how you plan to contribute to the club... (minimum 50 characters)"
                  rows="6"
                  required
                  minLength={50}
                />
                <small className={formData.statement.length >= 50 ? 'text-success' : ''}>
                  {formData.statement.length} / 50 minimum characters
                </small>
              </div>
            </div>

            {/* Supporting Documents */}
            <div className="form-section">
              <h3>Supporting Documents (Optional)</h3>
              <div className="form-group">
                <label>Document URL</label>
                <input
                  type="url"
                  name="supportingDocUrl"
                  value={formData.supportingDocUrl}
                  onChange={handleInputChange}
                  placeholder="https://drive.google.com/... (Google Drive, Dropbox, etc.)"
                />
                <small>Upload any supporting documents (certificates, recommendations, etc.)</small>
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-actions-rep">
              <button
                type="button"
                className="cancel-btn-rep"
                onClick={() => navigate('/profile')}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn-rep"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default RaiseRepRequest;
