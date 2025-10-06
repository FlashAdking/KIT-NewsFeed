// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import { ToastProvider } from './components/ToastProvider';  
import EventsPage from './EventsPage';
import Profile from './Profile';  
import AdminDashboard from './AdminDashboard';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<EventsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
