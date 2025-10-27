import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from './components/ToastProvider';

function Register() {
  const [loading, setLoading] = useState(false);
  const [collegeList, setCollegeList] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    collegeName: "",
    role: "student",
  });
  
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  useEffect(() => {
    fetch("/college-list.json")
      .then((res) => res.json())
      .then((data) => setCollegeList(data))
      .catch((err) => {
        console.error("College fetch error:", err);
        showWarning("Could not load college list. You can still type your college name.");
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const clearForm = () => {
    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      collegeName: "",
      role: "student",
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.fullName.trim()) {
      showError("Please enter your full name");
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      showError("Please enter your email address");
      setLoading(false);
      return;
    }

    if (!formData.collegeName || formData.collegeName === "") {
      showError("Please select a college");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      showError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const registrationData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        collegeName: formData.collegeName.trim(),
        role: formData.role || "student",
      };

      console.log("📤 Registration data:", registrationData);

      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();
      console.log("📥 Registration response:", result);

      if (response.ok && result.success) {
        showSuccess("Registration successful! Redirecting to login...");

        if (result.data && result.data.token) {
          localStorage.setItem('token', result.data.token);
          localStorage.setItem('userData', JSON.stringify(result.data.user));
        }

        clearForm();
        setTimeout(() => {
          navigate("/login", {
            state: {
              message: "Account created successfully! Please login to continue."
            }
          });
        }, 2000);
      } else {
        console.error("❌ Registration failed:", result);

        if (result.details && Array.isArray(result.details)) {
          const errorMessages = result.details.map(error =>
            `${error.path || 'Field'}: ${error.msg}`
          ).join(", ");
          showError(`Validation failed: ${errorMessages}`);
        } else if (result.error) {
          if (result.error.includes('email already exists') || result.error.includes('email') && result.error.includes('exists')) {
            showError("This email is already registered. Try logging in instead.");
          } else if (result.error.includes('username already taken') || result.error.includes('username') && result.error.includes('exists')) {
            showError("Username is already taken. Please choose a different one.");
          } else {
            showError(result.error);
          }
        } else {
          showError(result.message || "Registration failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("💥 Registration error:", err);
      showError("Network error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          {/* Left Panel - Logo & Branding */}
          <div style={styles.leftPanel}>
            <div style={styles.logoSection}>
              <div style={styles.brandLogo}>
                <div style={styles.logoIcon}>E</div>
              </div>
              <h1 style={styles.brandTitle}>EventEase</h1>
              <p style={styles.brandSubtitle}>Discover • Connect • Participate</p>
            </div>

            <div style={styles.welcomeText}>
              <h2 style={styles.welcomeTitle}>Welcome to EventEase!</h2>
              <p style={styles.welcomeDesc}>
                Join thousands of students discovering amazing events, hackathons,
                workshops, and opportunities at your college.
              </p>

              <div style={styles.features}>
                <div style={styles.feature}>
                  <span style={styles.featureIcon}>🎯</span>
                  <span>Discover Events</span>
                </div>
                <div style={styles.feature}>
                  <span style={styles.featureIcon}>🎫</span>
                  <span>Easy Registration</span>
                </div>
                <div style={styles.feature}>
                  <span style={styles.featureIcon}>🤝</span>
                  <span>Connect with Peers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Registration Form */}
          <div style={styles.rightPanel}>
            <div style={styles.formContainer}>
              <div style={styles.headerSection}>
                <h2 style={styles.title}>Create Account</h2>
                <p style={styles.subtitle}>Join EventEase to get started</p>
              </div>

              <div style={styles.formWrapper}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Full Name</label>
                  <input
                    placeholder="John Doe"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    disabled={loading}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    placeholder="john@example.com"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    disabled={loading}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>College Name</label>
                  <select
                    name="collegeName"
                    value={formData.collegeName}
                    onChange={handleChange}
                    style={styles.select}
                    required
                    disabled={loading}
                  >
                    <option value="">-- Select College --</option>
                    {collegeList.map((college, index) => (
                      <option key={index} value={college}>
                        {college}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Password</label>
                  <div style={styles.passwordContainer}>
                    <input
                      placeholder="Minimum 6 characters"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      style={styles.passwordInput}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      style={styles.eyeButton}
                      disabled={loading}
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  {formData.password && (
                    <div
                      style={{
                        ...styles.passwordFeedback,
                        color:
                          formData.password.length >= 6 ? "#059669" : "#dc2626",
                      }}
                    >
                      {formData.password.length >= 6
                        ? "✅ Strong password"
                        : `⚠️ ${6 - formData.password.length
                        } more characters needed`}
                    </div>
                  )}
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Confirm Password</label>
                  <div style={styles.passwordContainer}>
                    <input
                      placeholder="Re-enter your password"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      style={styles.passwordInput}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      style={styles.eyeButton}
                      disabled={loading}
                    >
                      {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <div
                      style={{
                        ...styles.passwordFeedback,
                        color:
                          formData.password === formData.confirmPassword
                            ? "#059669"
                            : "#dc2626",
                      }}
                    >
                      {formData.password === formData.confirmPassword
                        ? "✅ Passwords match"
                        : "❌ Passwords do not match"}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRegister}
                  style={{
                    ...styles.button,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </div>

              <div style={styles.divider}>
                <div style={styles.dividerLine}></div>
                <span style={styles.dividerText}>Or continue with</span>
                <div style={styles.dividerLine}></div>
              </div>

              {/* <button
                style={styles.googleButton}
                type="button"
                disabled={loading}
                onClick={() => alert("Google login coming soon!")}
              >
                <img
                  style={styles.googleIcon}
                  src="https://img.icons8.com/color/48/000000/google-logo.png"
                  alt="google login"
                />
                <span>Continue with Google</span>
              </button> */}

              <div style={styles.loginLink}>
                Already have an account?{" "}
                <a href="/login" style={styles.link}>
                  Sign In
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const styles = {
    wrapper: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #afbaf1 0%, #bea9d3 100%)",
      padding: "2rem 1rem",
    },
    container: {
      display: "flex",
      width: "100%",
      maxWidth: "1100px",
      minHeight: "700px",
      borderRadius: "24px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      backgroundColor: "white",
      overflow: "hidden",
    },
    leftPanel: {
      flex: "1",
      background: "linear-gradient(135deg, #343b58ff 0%, #764ba2 100%)",
      color: "white",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "3rem 2.5rem",
      textAlign: "center",
      position: "relative",
    },
    logoSection: {
      marginBottom: "3rem",
    },
    brandLogo: {
      marginBottom: "1.5rem",
    },
    logoIcon: {
      width: "80px",
      height: "80px",
      background: "rgba(255, 255, 255, 0.2)",
      borderRadius: "20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "2.5rem",
      fontWeight: "700",
      margin: "0 auto",
      backdropFilter: "blur(10px)",
    },
    brandTitle: {
      fontSize: "2.8rem",
      fontWeight: "800",
      margin: "1rem 0 0.5rem 0",
      textShadow: "2px 2px 8px rgba(0, 0, 0, 0.2)",
      letterSpacing: "-0.5px",
    },
    brandSubtitle: {
      fontSize: "1.15rem",
      opacity: "0.95",
      fontWeight: "500",
      letterSpacing: "2px",
    },
    welcomeText: {
      maxWidth: "350px",
    },
    welcomeTitle: {
      fontSize: "1.75rem",
      fontWeight: "700",
      marginBottom: "1rem",
    },
    welcomeDesc: {
      fontSize: "1rem",
      lineHeight: "1.6",
      opacity: "0.9",
      marginBottom: "2rem",
    },
    features: {
      marginTop: "2rem",
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      alignItems: "flex-start",
      textAlign: "left",
    },
    feature: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      fontSize: "1.05rem",
      background: "rgba(255, 255, 255, 0.1)",
      padding: "0.75rem 1.25rem",
      borderRadius: "12px",
      width: "100%",
      backdropFilter: "blur(10px)",
    },
    featureIcon: {
      fontSize: "1.5rem",
    },
    rightPanel: {
      flex: "1",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "3rem 2.5rem",
      overflowY: "auto",
      background: "#fafafa",
    },
    formContainer: {
      width: "100%",
      maxWidth: "420px",
      margin: "0 auto",
    },
    headerSection: {
      marginBottom: "2.5rem",
      textAlign: "center",
    },
    title: {
      fontSize: "2.2rem",
      fontWeight: "800",
      color: "#1e293b",
      marginBottom: "0.5rem",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    subtitle: {
      color: "#64748b",
      fontSize: "1rem",
    },
    formWrapper: {
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      marginBottom: "1.75rem",
    },
    inputGroup: {
      display: "flex",
      flexDirection: "column",
    },
    label: {
      fontWeight: "600",
      fontSize: "0.9rem",
      color: "#374151",
      marginBottom: "0.5rem",
    },
    input: {
      padding: "0.95rem 1rem",
      borderRadius: "12px",
      border: "2px solid #e2e8f0",
      fontSize: "0.95rem",
      transition: "all 0.3s ease",
      backgroundColor: "white",
      outline: "none",
    },
    select: {
      padding: "0.95rem 1rem",
      borderRadius: "12px",
      border: "2px solid #e2e8f0",
      fontSize: "0.95rem",
      transition: "all 0.3s ease",
      backgroundColor: "white",
      cursor: "pointer",
      outline: "none",
    },
    passwordContainer: {
      position: "relative",
      display: "flex",
      alignItems: "center",
    },
    passwordInput: {
      padding: "0.95rem 1rem",
      paddingRight: "3.5rem",
      borderRadius: "12px",
      border: "2px solid #e2e8f0",
      fontSize: "0.95rem",
      transition: "all 0.3s ease",
      backgroundColor: "white",
      width: "100%",
      outline: "none",
    },
    eyeButton: {
      position: "absolute",
      right: "1rem",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "1.2rem",
      padding: "0.25rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    passwordFeedback: {
      marginTop: "0.5rem",
      fontSize: "0.85rem",
      fontWeight: "500",
    },
    button: {
      padding: "1rem",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "1.05rem",
      marginTop: "0.75rem",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
    },
    divider: {
      display: "flex",
      alignItems: "center",
      margin: "1.75rem 0",
      gap: "1rem",
    },
    dividerLine: {
      flex: 1,
      height: "1px",
      background: "#e2e8f0",
    },
    dividerText: {
      fontSize: "0.85rem",
      color: "#64748b",
      fontWeight: "500",
    },
    googleButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.75rem",
      width: "100%",
      padding: "0.95rem",
      backgroundColor: "white",
      border: "2px solid #e2e8f0",
      borderRadius: "12px",
      cursor: "pointer",
      fontSize: "1rem",
      fontWeight: "600",
      transition: "all 0.3s ease",
      marginBottom: "1.75rem",
    },
    googleIcon: {
      width: "24px",
      height: "24px",
      fontSize: "1.3rem",
      fontWeight: "700",
      color: "#4285f4",
    },
    loginLink: {
      textAlign: "center",
      fontSize: "0.95rem",
      color: "#64748b",
    },
    link: {
      color: "#667eea",
      textDecoration: "none",
      fontWeight: "700",
      transition: "color 0.3s ease",
    },
  };

  export default Register;
