// src/Profile.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

function Profile({ userData, setUserData }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear token or user data from localStorage/session
    localStorage.removeItem('token');
    setUserData(null);
    navigate('/');
  };

  if (!userData) {
    return <p>Loading profile...</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Welcome, {userData.fullName}!</h2>
      <div style={styles.info}>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>College:</strong> {userData.collegeName}</p>
      </div>
      <button onClick={handleLogout} style={styles.button}>Logout</button>
    </div>
  );
}

const styles = {
  container: {
    width: '400px',
    margin: '50px auto',
    padding: '30px',
    border: '1px solid #ccc',
    borderRadius: '10px',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    marginBottom: '20px',
  },
  info: {
    marginBottom: '20px',
    textAlign: 'left',
  },
  button: {
    padding: '10px 20px',
    fontWeight: 'bold',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  }
};

export default Profile;
