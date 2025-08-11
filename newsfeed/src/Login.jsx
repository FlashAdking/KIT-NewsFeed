import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage('✅ Login successful!');
        console.log('Token:', result.data.token);
        console.log('User:', result.data.user);

        // Optional: Store token
        // localStorage.setItem('token', result.data.token);
        // window.location.href = "/dashboard"; // optional redirect
      } else {
        setMessage('❌ Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage('❌ Server error');
    }
  };

  return (
    <div style={styles.wrapper}>
    <div style={styles.container}>
      <h2 style={styles.title}>New’s Feed</h2>

      <form onSubmit={handleLogin} style={styles.form}>
        <label htmlFor="email" style={styles.label}>Name/Email</label>
        <input
          type="text"
          id="email"
          value={email}
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <label htmlFor="password" style={styles.label}>Password</label>
        <input
          type="password"
          id="password"
          value={password}
          placeholder="Enter password"
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button type="submit" style={styles.button}>LOGIN</button>
        <p><button onClick={() => alert('Forgot password clicked')} style={styles.linkButton}>
  Forget password?
</button>
</p>
      </form>

      <div style={styles.separator}>
       
        <span style={styles.orText}>----------------------------- Or Login With -----------------------------</span>
        
      </div>

      <div style={styles.googleLogin}>
 <img style={styles.img}
  src='https://img.icons8.com/color/48/000000/google-logo.png'
    alt="google login"
    width="30"
  />

</div>



      <div style={styles.newUser}>
        <span style={{ color: 'blue' }}>New User ?</span>{' '}


<Link to="/register" style={styles.linkButton}>
  Create an account
</Link>


      </div>

      {message && <p style={styles.message}>{message}</p>}
    </div>
    </div>
  );
}

const styles = {
  wrapper: {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  backgroundColor: '#f8f9fa', // optional: soft background
},

  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#fefefe',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    width: '90%',
  },
  title: {
    color: '#4b004f',
    fontWeight: 'bold',
    fontFamily:'Arial, sans-serif',
    fontSize: '2.5em',
    
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '20px',
     textAlign: 'center',
    
  },
  label: {
    textAlign: 'left',
    fontWeight: '500',
    fontSize: '1em',
  },
  input: {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc'
  },
  button: {
    backgroundColor: '#000',
    color: '#fff',
    padding: '10px',
    border: 'none',
    borderRadius: '100px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1em',
    transition: 'background-color 0.3s',
    marginTop: '10px'

  },
  forgot: {
    fontSize: '0.85em',
    textDecoration: 'none',
    color: '#333'
  },
  separator: {
    margin: '20px 0',
    display: 'flex',
    alignItems: 'center'
  },
  orText: {
    margin: '0 10px',
    fontSize: '0.9em',
    color: '#555'
  },
  hr: {
    flex: 1,
    height: '1px',
    backgroundColor: '#ccc',
    border: 'none'
  },
  googleLogin: {
    marginBottom: '15px'
  },
  newUser: {
    fontSize: '0.9em',
    marginBottom: '10px'
  },
  message: {
    marginTop: '15px',
    fontWeight: 'bold'
  },
  linkButton: {
  background: 'none',
  border: 'none',
  color: 'blue',
  textDecoration: 'underline',
  cursor: 'pointer',
  padding: 0,
  fontSize: '0.85em'
},
img: {
  width: '30px', /* Specifies the width of the image */
  height: 'auto',/* Maintains the aspect ratio when the width changes */
  borderRadius: '5px', /* Adds rounded corners to the image */
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', /* Adds a subtle shadow effect */
}


};

export default Login;
