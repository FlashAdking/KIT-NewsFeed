import React, { useState } from "react";

function PosterPost({ onPostEvent }) {
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    eventType: "",
    venue: "",
    instruction: "",
    poster: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "poster") {
      const file = files[0];
      if (file && file.size > 2 * 1024 * 1024) {
        alert("Please upload an image under 2MB.");
        return;
      }
      setFormData({ ...formData, poster: file });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  
  const handleSubmit = (e) => {
  e.preventDefault();
  console.log("Form submitted:", formData);
  console.log("onPostEvent prop:", onPostEvent);
  onPostEvent(formData);
};

  return (
    <>
      {/* Google Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* CSS Styling */}
      
<style>{`
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: 'Poppins', sans-serif;
    background-color: #fdecfbff;
  }

  .news-form-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .navbar {
    background-color: #ffffff;
    padding: 18px 40px;
    width: 100%;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .navbar-title {
    font-size: 26px;
    font-weight: 700;
  }

  .link-button {
    background: none;
    border: none;
    color: #000;
    margin-left: 20px;
    font-weight: 600;
    font-size: 18px;
    cursor: pointer;
    transition: color 0.3s ease;
  }

  .link-button:hover {
    color: #007bff;
  }

  .news-form {
    background-color: #c4daeeff;
    padding: 50px;
    margin-top: 40px;
    width: 600px;
    border-radius: 20px;
    box-shadow: 0 12px 35px rgba(0,0,0,0.08);
    max-width: 95%;
    height: '500px';
  }

  .form-group {
    margin-bottom: 25px;
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    font-weight: 600;
    margin-bottom: 8px;
    color: #2c3e50;
    font-size: 30px;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    padding: 14px;
    border: 1px solid #ccc;
    border-radius: 10px;
    font-size: 16px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    width: 100%;
  }

  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 0 3px rgba(0,123,255,0.2);
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: 20px;
  }

  .row .form-group {
    flex: 1;
  }

  .file-upload {
    background-color: #f9f9f9;
    padding: 25px;
    text-align: center;
    border: 2px dashed #007bff;
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.3s;
    font-size: 16px;
  }

  .file-upload:hover {
    background-color: #f1f9ff;
  }

  .file-label {
    cursor: pointer;
    font-weight: 600;
    color: #007bff;
    font-size: 18px;
  }

  .submit-btn {
    background: linear-gradient(45deg, #040008ff, #2a5375ff);
    color: white;
    padding: 15px 35px;
    border: none;
    border-radius: 20px;
    font-weight: 700;
    font-size: 30px;
    cursor: pointer;
    display: block;
    margin: 30px auto 0;
    transition: transform 0.2s ease, background 0.3s ease;
  }

  .submit-btn:hover {
    transform: scale(1.05);
    background: linear-gradient(45deg, #0056b3, #0094cc);
  }
`}</style>


      {/* Form UI */}
      <div className="news-form-container">
        

<form className="news-form" onSubmit={handleSubmit}>
  <div className="form-group">
    <label>Title:</label>
    <input type="text" name="title" onChange={handleChange} />
  </div>

  <div className="row">
    <div className="form-group">
      <label>Date:</label>
      <input type="date" name="date" onChange={handleChange} />
    </div>
    <div className="form-group">
      <label>Time:</label>
      <input type="time" name="time" onChange={handleChange} />
    </div>
  </div>

  <div className="form-group">
    <label>Event Type:</label>
    <select name="eventType" onChange={handleChange}>
      <option value="">Select Event Type</option>
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

  <div className="form-group">
    <label>Venue:</label>
    <input type="text" name="venue" onChange={handleChange} />
  </div>

  <div className="form-group">
    <label>Instruction:</label>
    <textarea
      name="instruction"
      rows="3"
      onChange={handleChange}
    ></textarea>
  </div>

  <div className="form-group file-upload">
    <label className="file-label">
      + Add Poster
      <input
        type="file"
        name="poster"
        accept="image/*"
        onChange={handleChange}
        hidden
      />
    </label>
  </div>

  <button type="submit" className="submit-btn">
    Submit
  </button>
</form>
      </div>
    </>
  );
}

export default PosterPost;
