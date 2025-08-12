import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from './LoginModal';

function EventsPage() {
  const [todaysEvents, setTodaysEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventType, setEventType] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const data = {
      today: [
        { id: 1, title: "Coding Event", time: "10:00 AM", date: new Date().toISOString().split('T')[0], type: "Hackathon", poster: null },
      ],
      upcoming: [
        { id: 2, title: "Agriculture Expo", time: "10:00 AM", date: "2025-08-20", type: "Agriculture", poster: null },
      ]
    };
    setTodaysEvents(data.today || []);
    setUpcomingEvents(data.upcoming || []);
  }, []);

  const filterEvents = (events) => {
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (eventType === "" || event.type === eventType)
    );
  };

  const handlePostEvent = (newEvent) => {
    const isToday = (date) => {
      const today = new Date();
      const eventDate = new Date(date);
      return (
        eventDate.getDate() === today.getDate() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getFullYear() === today.getFullYear()
      );
    };

    if (isToday(newEvent.date)) {
      setTodaysEvents([...todaysEvents, newEvent]);
    } else {
      setUpcomingEvents([...upcomingEvents, newEvent]);
    }
    setShowPostForm(false);
  };

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
        setIsLoggedIn(true);
        setShowLoginModal(false);
        console.log('Token:', result.data.token);
        console.log('User:', result.data.user);
      } else {
        setMessage('❌ Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage('❌ Server error');
    }
  };

  const handleEventClick = (event) => {
    navigate(`/event/${event.id}`, { state: { event } });
  };

  return (
    <>
      <div>
        {/* Navbar */}
        <nav className="navbar">
          <div className="navbar-title">EventEase-News Feed</div>
          <div className="navbar-search-filter">
            <input
              type="text"
              placeholder="Search..."
              className="search-bar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="filter-dropdown"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="">Filter</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Workshop">Workshop</option>
              <option value="Webinar">Webinar</option>
              <option value="Networking">Networking</option>
              <option value="Concerts">Concerts</option>
              <option value="Exhibitions">Exhibitions</option>
            </select>
          </div>
          <div className="navbar-links">
            <button type="button" className="link-button">
              Profile
            </button>
          </div>
        </nav>

        {/* styles */}
        <style>
          {`
          .events-page {
            padding: 20px;
          }

          .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
            background-color: #5e5b5bff;
            color: #fff;
            height: 60px;
          }

          .navbar-title {
            font-size: 2.5em;
            font-weight: bold;
            color: #fff;
          }

          .navbar-search-filter {
            display: flex;
            gap: 10px;
            align-items: center;
            
          }

          .navbar-search-filter .search-bar {
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 5px;
            width: 250px;
            height: 30px;
          }

          .navbar-search-filter .filter-dropdown {
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 5px;
          }

          .navbar-links button {
            background: none;
            border: none;
            color: #fff;
            margin-left: 20px;
            cursor: pointer;
            font-size: 1.5em;
          }

          .scroll-row {
            display: flex;
            gap: 20px;
            overflow-x: auto;
            padding-bottom: 10px;
          }

          .event-card {
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 20px;
            width: 450px; /* Increased card size */
            cursor: pointer;
          }

          .event-card img {
            width: 100%;
            height: auto;
            border-radius: 10px;
            max-height: 150px; /* Limit height for better layout */
            object-fit: cover;
          }

          .event-card h3 {
            margin-top: 10px;
            font-size: 1.5em;
            color: #333;

          }

          .event-card button {
            background-color: #000;
            color: #fff;
            padding: 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1em;
            transition: background-color 0.3s;
          }
            h2{
            font-size: 2em;
            margin-bottom: 20px;}
          `}
        </style>

        <div className="events-page">
          {/* Today's Events */}
          <section style={{ marginTop: '40px' }}>
            <h2>Today's Events</h2>
            <div className="scroll-row">
              {filterEvents(todaysEvents).length > 0 ? (
                filterEvents(todaysEvents).map((event, index) => (
                  <div key={index} className="event-card" onClick={() => handleEventClick(event)}>
                    <img src={event.poster || "https://via.placeholder.com/300x150"} alt="Event Poster" />
                    <h3>{event.title}</h3>
                    <p>{event.time}</p>
                  </div>
                ))
              ) : (
                <p>No events today</p>
              )}
            </div>
          </section>

          {/* Upcoming Events */}
            <section style={{ marginTop: '80px' }}>
            <h2 >Upcoming Events</h2>
            <div className="scroll-row">
              {filterEvents(upcomingEvents).length > 0 ? (
                filterEvents(upcomingEvents).map((event, index) => (
                  <div key={index} className="event-card" onClick={() => handleEventClick(event)}>
                    <img src={event.poster || "https://via.placeholder.com/300x150"} alt="Event Poster" />
                    <h3>{event.title}</h3>
                    <p>{event.time}</p>
                    <p>{event.date}</p>
                  </div>
                ))
              ) : (
                <p>No upcoming events</p>
              )}
            </div>
          </section>
        </div>

        <LoginModal 
          isOpen={showLoginModal} 
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          handleLogin={handleLogin}
          message={message}
        />
      </div>
    </>
  );
}

export default EventsPage;
