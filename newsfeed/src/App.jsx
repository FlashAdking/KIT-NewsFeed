// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import EventsPage from './EventsPage';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<EventsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
