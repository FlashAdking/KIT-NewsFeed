import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "./components/ToastProvider";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showInfo } = useToast();

  const API_BASE = "http://localhost:8080";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const token = result.data.token;
        const user = result.data.user;

        // Store token and user data
        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(user));

        showSuccess("Login successful!");

        // ✅ Smart redirect based on role
        if (user.role === "admin") {
          // Admin users go to dashboard
          setTimeout(() => {
            navigate("/admin");
          }, 1000);
          return;
        }

        // For students/regular users
        const { pendingRegistration, from, eventTitle } = location.state || {};

        if (pendingRegistration) {
          // Auto-register for the event they tried to register for
          try {
            const regResp = await fetch(
              `${API_BASE}/api/posts/${pendingRegistration}/register`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (regResp.ok) {
              showSuccess(
                `Successfully registered for ${eventTitle || "the event"}!`
              );
            } else {
              showError(
                "Registration failed. Please try again from events page."
              );
            }
          } catch {
            showError("Network error during registration");
          }

          setTimeout(() => {
            navigate(from || "/");
          }, 1500);
        } else {
          // Normal login - redirect to intended page or home
          const redirectTo = from || location.state?.redirectTo || "/";
          setTimeout(() => {
            navigate(redirectTo);
          }, 1000);
        }
      } else {
        showError(result.error || result.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      showError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const redirectMessage = location.state?.message;
  const eventTitle = location.state?.eventTitle;

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Left Panel - Login Form */}
        <div style={styles.leftPanel}>
          <div style={styles.formContainer}>
            <h2 style={styles.title}>Welcome Back</h2>
            <p style={styles.subtitle}>Sign in to your EventEase account</p>

            {redirectMessage && (
              <div style={styles.redirectMessage}>{redirectMessage}</div>
            )}

            {eventTitle && (
              <div style={styles.eventNotice}>
                <span style={styles.eventIcon}>🎫</span>
                <div>
                  <strong>Registration Pending</strong>
                  <p>Login to register for: {eventTitle}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  placeholder="Enter your email"
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                  disabled={loading}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.passwordContainer}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    placeholder="Enter your password"
                    onChange={(e) => setPassword(e.target.value)}
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
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div style={styles.forgotPassword}>
                <button
                  onClick={() =>
                    showInfo("Forgot password feature coming soon!")
                  }
                  style={styles.forgotButton}
                  type="button"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                style={{
                  ...styles.button,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                disabled={loading}
              >
                {loading ? "SIGNING IN..." : "SIGN IN"}
              </button>
            </form>

            {/* ✅ Admin Login Notice */}
            <div style={styles.adminNotice}>
              <span style={styles.adminIcon}>⚙️</span>
              <span style={styles.adminText}>
                Admins will be redirected to dashboard
              </span>
            </div>

            <div style={styles.divider}>
              <span style={styles.dividerText}>Or continue with</span>
            </div>

            <button
              style={styles.googleButton}
              type="button"
              onClick={() => showInfo("Google login coming soon!")}
            >
              <img
                style={styles.googleIcon}
                src="https://img.icons8.com/color/48/000000/google-logo.png"
                alt="google login"
              />
              <span>Continue with Google</span>
            </button>

            <div style={styles.registerLink}>
              New to EventEase?{" "}
              <Link to="/register" style={styles.link}>
                Create Account
              </Link>
            </div>

            <div style={styles.backHome}>
              <Link to="/" style={styles.backLink}>
                ← Back to Events
              </Link>
            </div>
          </div>
        </div>

        {/* Right Panel - Logo & Branding */}
        <div style={styles.rightPanel}>
          <div style={styles.logoSection}>
            <div style={styles.brandLogo}>
              <div style={styles.logoIcon}>E</div>
            </div>
            <h1 style={styles.brandTitle}>EventEase</h1>
            <p style={styles.brandSubtitle}>Discover • Connect • Participate</p>
          </div>

          <div style={styles.welcomeText}>
            <h2>Welcome Back!</h2>
            <p>
              Sign in to access your personalized event dashboard and continue
              discovering amazing opportunities.
            </p>

            <div style={styles.features}>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>⚡</span>
                <span>Quick Event Registration</span>
              </div>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>📊</span>
                <span>Track Your Events</span>
              </div>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>🎯</span>
                <span>Personalized Recommendations</span>
              </div>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>🏆</span>
                <span>Achievement Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,  #afbaf1 0%, #bea9d3 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  container: {
    display: "flex",
    maxWidth: "1100px",
    width: "100%",
    background: "white",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  },
  leftPanel: {
    flex: "1",
    padding: "3rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  formContainer: {
    maxWidth: "400px",
    width: "100%",
    margin: "0 auto",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "0.5rem",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#6b7280",
    marginBottom: "2rem",
  },
  redirectMessage: {
    padding: "1rem",
    background: "#fef3c7",
    border: "1px solid #fbbf24",
    borderRadius: "8px",
    color: "#92400e",
    marginBottom: "1.5rem",
    fontSize: "0.9rem",
  },
  eventNotice: {
    display: "flex",
    gap: "1rem",
    padding: "1rem",
    background: "#eff6ff",
    border: "1px solid #3b82f6",
    borderRadius: "8px",
    marginBottom: "1.5rem",
  },
  eventIcon: {
    fontSize: "1.5rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    padding: "0.875rem",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "1rem",
    transition: "all 0.2s",
    outline: "none",
  },
  passwordContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  passwordInput: {
    width: "100%",
    padding: "0.875rem",
    paddingRight: "4rem",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "1rem",
    transition: "all 0.2s",
    outline: "none",
  },
  eyeButton: {
    position: "absolute",
    right: "0.75rem",
    background: "none",
    border: "none",
    color: "#6b7280",
    fontSize: "0.875rem",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0.5rem",
  },
  forgotPassword: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "-0.5rem",
  },
  forgotButton: {
    background: "none",
    border: "none",
    color: "#837fc9ff",
    fontSize: "0.875rem",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0",
  },
  button: {
    padding: "1rem",
    background: "linear-gradient(135deg, #5a6aafff 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "1.25rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  adminNotice: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.75rem",
    background: "#f9fafb",
    borderRadius: "8px",
    marginTop: "1rem",
  },
  adminIcon: {
    fontSize: "1rem",
  },
  adminText: {
    fontSize: "0.95rem",
    color: "#6b7280",
    fontWeight: "500",
  },
  // ✅ FIXED: Divider with proper line
  divider: {
    position: "relative",
    textAlign: "center",
    margin: "1.5rem 0",
    height: "1px",
    background: "#e5e7eb",
  },
  dividerText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "white",
    padding: "0 1rem",
    color: "#9ca3af",
    fontSize: "0.95rem",
    whiteSpace: "nowrap",
  },
  // ✅ FIXED: Google button styling
  googleButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    padding: "0.875rem",
    background: "white",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: "600",
    color: "#374151",
    cursor: "pointer",
    transition: "all 0.2s",
    width: "100%",
  },
  googleIcon: {
    width: "24px",
    height: "24px",
  },
  registerLink: {
    textAlign: "center",
    marginTop: "1.5rem",
    fontSize: "0.975rem",
    color: "#000000ff",
  },
  link: {
    color: "#4f46e5",
    fontWeight: "600",
    textDecoration: "none",
  },
  backHome: {
    textAlign: "center",
    marginTop: "1rem",
  },
  backLink: {
    color: "#6b7280",
    fontSize: "0.95rem",
    textDecoration: "none",
    transition: "color 0.2s",
  },
  rightPanel: {
    flex: "1",
    background: "linear-gradient(135deg, #343b58ff 0%, #764ba2 100%)",
    color: "white",
    padding: "3rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  logoSection: {
    textAlign: "center",
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
    fontSize: "3rem",
    fontWeight: "700",
    margin: "0 0 0.5rem 0",
  },
  brandSubtitle: {
    fontSize: "1.125rem",
    opacity: "0.9",
    margin: "0",
  },
  welcomeText: {
    textAlign: "center",
  },
  welcomeTextH2: {
    fontSize: "1.975rem",
    fontWeight: "700",
    marginBottom: "1rem",
  },
  welcomeTextP: {
    fontSize: "1.25rem",
    opacity: "0.9",
    lineHeight: "1.6",
  },
  features: {
    marginTop: "2rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "1rem",
    opacity: "0.95",
  },
  featureIcon: {
    fontSize: "1.75rem",
  },
};

export default Login;
