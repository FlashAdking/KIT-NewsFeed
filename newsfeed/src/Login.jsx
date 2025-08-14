import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage('Login successful! Redirecting...');
        console.log('Token:', result.data.token);
        console.log('User:', result.data.user);

        // Store token and user data
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('userData', JSON.stringify(result.data.user));

        // Redirect to intended page or home
        const redirectTo = location.state?.redirectTo || '/';
        const eventTitle = location.state?.eventTitle;
        
        if (eventTitle) {
          setMessage(`Login successful! Redirecting to ${eventTitle}...`);
        }

        setTimeout(() => {
          navigate(redirectTo);
        }, 1500);

      } else {
        setMessage(`${result.message || 'Invalid credentials'}`);
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const redirectMessage = location.state?.message;

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Left Panel - Login Form */}
        <div style={styles.leftPanel}>
          <div style={styles.formContainer}>
            <h2 style={styles.title}>Welcome Back</h2>
            <p style={styles.subtitle}>Sign in to your EventEase account</p>
            
            {redirectMessage && (
              <div style={styles.redirectMessage}>
                {redirectMessage}
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
                  onClick={() => alert('Forgot password feature coming soon!')} 
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
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                disabled={loading}
              >
                {loading ? 'SIGNING IN...' : 'SIGN IN'}
              </button>
            </form>

            <div style={styles.divider}>
              <span style={styles.dividerText}>Or continue with</span>
            </div>

            <button style={styles.googleButton} type="button">
              <img 
                style={styles.googleIcon}
                src='https://img.icons8.com/color/48/000000/google-logo.png'
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
                Back to Events
              </Link>
            </div>

            {message && (
              <div style={{
                ...styles.message,
                color: message.includes('successful') ? '#059669' : '#dc2626',
                backgroundColor: message.includes('successful') ? '#f0fdf4' : '#fef2f2',
                borderColor: message.includes('successful') ? '#22c55e' : '#ef4444',
              }}>
                {message}
              </div>
            )}
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
            <p>Sign in to access your personalized event dashboard and continue discovering amazing opportunities.</p>
            
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

          {/* <div style={styles.statsSection}>
            <div style={styles.stat}>
              <div style={styles.statNumber}>10K+</div>
              <div style={styles.statLabel}>Active Students</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNumber}>500+</div>
              <div style={styles.statLabel}>Events Monthly</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNumber}>50+</div>
              <div style={styles.statLabel}>Partner Colleges</div>
            </div>
          </div> */}
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
    background: "linear-gradient(135deg, #edf3f2ff 0%, #764ba2 100%)", // Professional gradient
    padding: "1rem",
  },
  container: {
    display: "flex",
    width: "100%",
    maxWidth: "1100px",
    minHeight: "700px",
    borderRadius: "24px",
    boxShadow: "0 25px 80px rgba(71, 85, 105, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(20px)",
    overflow: "hidden",
  },

  // Left Panel Styles (Login Form)
  leftPanel: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "2rem",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
  },
  formContainer: {
    width: "100%",
    maxWidth: "400px",
    margin: "0 auto",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "0.5rem",
    textAlign: "center",
  },
  subtitle: {
    color: "#64748b",
    fontSize: "1rem",
    marginBottom: "2rem",
    textAlign: "center",
  },
  redirectMessage: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    border: "1px solid #bfdbfe",
    fontSize: "0.9rem",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    marginBottom: "2rem",
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
    padding: "0.875rem",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    fontSize: "1rem",
    transition: "all 0.3s ease",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  passwordContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  passwordInput: {
    padding: "0.875rem",
    paddingRight: "4rem",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    fontSize: "1rem",
    transition: "all 0.3s ease",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    width: "100%",
  },
  eyeButton: {
    position: "absolute",
    right: "0.75rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    color: "#64748b",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    transition: "color 0.3s ease",
    fontWeight: "500",
  },
  forgotPassword: {
    textAlign: "right",
    marginTop: "-0.5rem",
  },
  forgotButton: {
    background: "none",
    border: "none",
    color: "#3730a3",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  button: {
    padding: "1rem 2rem",
    background: "linear-gradient(135deg, #3730a3, #4338ca)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "1.1rem",
    marginTop: "0.5rem",
    transition: "all 0.3s ease",
  },
  divider: {
    textAlign: "center",
    margin: "1.5rem 0",
    position: "relative",
  },
  dividerText: {
    fontSize: "0.85rem",
    color: "#64748b",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    padding: "0 1rem",
    position: "relative",
    zIndex: 1,
  },
  googleButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    width: "100%",
    padding: "0.875rem",
    backgroundColor: "white",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "500",
    transition: "all 0.3s ease",
    marginBottom: "1.5rem",
  },
  googleIcon: {
    width: "20px",
    height: "20px",
  },
  registerLink: {
    textAlign: "center",
    fontSize: "0.95rem",
    color: "#64748b",
    marginBottom: "1rem",
  },
  backHome: {
    textAlign: "center",
    marginBottom: "1rem",
  },
  backLink: {
    color: "#64748b",
    textDecoration: "none",
    fontSize: "0.9rem",
    transition: "color 0.3s ease",
  },
  link: {
    color: "#3730a3",
    textDecoration: "none",
    fontWeight: "600",
  },
  message: {
    padding: "1rem",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "500",
    textAlign: "center",
    border: "1px solid",
    marginTop: "1rem",
  },

  // Right Panel Styles (Branding)
  rightPanel: {
    flex: "1",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "3rem 2rem",
    textAlign: "center",
    position: "relative",
  },
  logoSection: {
    marginBottom: "2rem",
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
    border: "2px solid rgba(255, 255, 255, 0.3)",
  },
  brandTitle: {
    fontSize: "2.5rem",
    fontWeight: "700",
    margin: "1rem 0 0.5rem 0",
    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)",
  },
  brandSubtitle: {
    fontSize: "1.1rem",
    opacity: "0.9",
    fontWeight: "500",
  },
  welcomeText: {
    maxWidth: "300px",
    marginBottom: "2rem",
  },
  features: {
    marginTop: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.875rem",
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "0.95rem",
    opacity: "0.9",
  },
  featureIcon: {
    fontSize: "1.1rem",
  },
  statsSection: {
    display: "flex",
    justifyContent: "space-around",
    width: "100%",
    maxWidth: "350px",
    marginTop: "2rem",
  },
  stat: {
    textAlign: "center",
  },
  statNumber: {
    fontSize: "1.5rem",
    fontWeight: "700",
    marginBottom: "0.25rem",
  },
  statLabel: {
    fontSize: "0.8rem",
    opacity: "0.8",
  },

  // Responsive Design
  "@media (max-width: 768px)": {
    container: {
      flexDirection: "column-reverse",
      minHeight: "auto",
    },
    leftPanel: {
      padding: "2rem 1rem",
    },
    rightPanel: {
      padding: "2rem 1rem",
      minHeight: "300px",
    },
  },
};

export default Login;
