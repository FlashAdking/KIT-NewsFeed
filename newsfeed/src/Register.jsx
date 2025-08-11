import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    collegeName: "",
  });

  const [message, setMessage] = useState("");
  const [collegeList, setCollegeList] = useState([]);

  useEffect(() => {
  fetch("/kolhapur-colleges.json")
    .then((res) => res.json())
    .then((data) => setCollegeList(data))
    .catch((err) => console.error("Failed to load colleges:", err));
}, []);

  useEffect(() => {
    // Simulating API call — you can replace with actual fetch
    fetch("/college-list.json")
      .then((res) => res.json())
      .then((data) => setCollegeList(data))
      .catch((err) => console.error("College fetch error:", err));
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return setMessage("❌ Passwords do not match");
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage("✅ Registered successfully!");
        // Optional: redirect or store token
      } else {
        setMessage("❌ Registration failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error");
    }
  };

return (
  <>
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h2 style={styles.title}>New’s Feed</h2>
        <form onSubmit={handleRegister} style={styles.form}>
          <label style={styles.label}>Full Name:</label>
          <input
            placeholder="Enter your full name"
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <label style={styles.label}>Email:</label>
          <input
            placeholder="Enter your email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <label style={styles.label}>College Name:</label>
          <select
            name="collegeName"
            value={formData.collegeName}
            onChange={handleChange}
            style={styles.input}
            required
          >
            <option value="">-- Select College --</option>
            {collegeList.map((college, index) => (
              <option key={index} value={college}>
                {college}
              </option>
            ))}
          </select>

          <label style={styles.label}>Password:</label>
          <input
            placeholder="Enter your password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <label style={styles.label}>Confirm Password:</label>
          <input
            placeholder="Confirm your password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            style={styles.input}
            required
          />

          <button type="submit" style={styles.button}>
            Create Account
          </button>
        </form>

        <div style={styles.separator}>
          <span style={styles.orText}>
            ------------------- Or Sign in with -------------------
          </span>
        </div>

        <div style={styles.googleLogin}>
          <img
            style={styles.img}
            src="https://img.icons8.com/color/48/000000/google-logo.png"
            alt="Google"
          />
        </div>

        <div style={styles.newUser}>
          Already have an Account?{" "}
          <Link to="/" style={styles.linkButton}>
            Log in
          </Link>
        </div>

        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  </>
);
}

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f8f9fa",
  },
  container: {
    maxWidth: "400px",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#fefefe",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    width: "100%",
  },
  title: {
    color: "#4b004f",
    fontWeight: "bold",
    fontSize: "2.5em",
    fontFamily: "Arial, sans-serif",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginTop: "20px",
    textAlign: "center",
  },
  label: {
    textAlign: "left",
    fontWeight: "500",
    fontSize: "1em",
  },
  input: {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  button: {
    backgroundColor: "#000000ff",
    color: "#fff",
    padding: "10px",
    border: "none",
    borderRadius: "100px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "1em",
  },
  separator: {
    margin: "20px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  orText: {
    fontSize: "0.9em",
    color: "#555",
  },
  googleLogin: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "15px",
    cursor: "pointer",
    background: "#fff",
    padding: "8px",
    borderRadius: "5px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  newUser: {
    fontSize: "0.9em",
    marginBottom: "10px",
  },
  message: {
    marginTop: "15px",
    fontWeight: "bold",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "blue",
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
    fontSize: "0.85em",
  },
  img: {
    width: "30px",
    height: "auto",
    borderRadius: "5px",
  },
};

export default Register;
