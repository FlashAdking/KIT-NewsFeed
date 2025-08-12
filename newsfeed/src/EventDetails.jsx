import React from "react";
import { useLocation } from "react-router-dom";

const EventDetails = () => {
  const { state } = useLocation();
  console.log(state); // Check if event data is coming through
  const event = state?.event;

  if (!event) {
    return <p>No event details found</p>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Event Details</h2>
      <p><strong>Title:</strong> {event.title}</p>
      <p><strong>Time:</strong> {event.time}</p>
      <p><strong>Date:</strong> {event.date}</p>
      <p><strong>Type:</strong> {event.type}</p>
      <img src={event.poster || "https://via.placeholder.com/300x150"} alt="Event Poster" />
    </div>
  );
};

export default EventDetails;
