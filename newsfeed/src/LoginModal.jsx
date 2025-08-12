import React from 'react';
import { Link } from 'react-router-dom';

function LoginModal({ isOpen, onClose }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    // ... (same login logic as in your Login component)
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, width: 400 }}>
        <h2 style={styles.title}>New’s Feed</h2>
        <form onSubmit={handleLogin} style={styles.form}>
          {/* ... (same form as in your Login component) */}
        </form>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// Use same styles as in your Login component
const styles = { /* ... */ };

export default LoginModal;
