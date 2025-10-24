import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "./components/ToastProvider";

function CreatePost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    categoryId: "",
    postType: "event",
    eventDetails: {
      eventDate: "",
      eventTime: "",
      venue: "",
      maxParticipants: "",
    },
    registrationLink: "",
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchPost(id);
    }
    // eslint-disable-next-line
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/categories");
      const result = await response.json();
      if (result.success) {
        setCategories(result.data?.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchPost = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/posts/${postId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        const post = result.data?.post || result.post;
        setFormData({
          title: post.title,
          content: post.content,
          categoryId: post.categoryId?._id || post.categoryId,
          postType: post.postType,
          eventDetails: post.eventDetails || {},
          registrationLink: post.registrationLink || "",
        });

        if (post.imageUrl) {
          setImagePreview(post.imageUrl);
        }
      }
    } catch (error) {
      showError("Failed to load post");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("eventDetails.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        eventDetails: {
          ...prev.eventDetails,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError("File size should be less than 5MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const url = id
        ? `http://localhost:8080/api/posts/${id}`
        : "http://localhost:8080/api/posts";

      const method = id ? "PUT" : "POST";

      // Create FormData to handle file upload
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("content", formData.content);
      submitData.append("categoryId", formData.categoryId);
      submitData.append("postType", formData.postType);

      if (formData.postType === "event") {
        submitData.append(
          "eventDetails",
          JSON.stringify(formData.eventDetails)
        );
        if (formData.registrationLink) {
          submitData.append("registrationLink", formData.registrationLink);
        }
      }

      if (imageFile) {
        submitData.append("image", imageFile);
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(
          id ? "Post updated successfully!" : "Post created successfully!"
        );
        navigate("/profile");
      } else {
        showError(result.message || "Failed to save post");
      }
    } catch (error) {
      showError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate("/profile")}>
            ← Back
          </button>
          <div style={styles.headerText}>
            <h1 style={styles.title}>{id ? "Edit Post" : "Create New Post"}</h1>
            <p style={styles.subtitle}>
              Share your event or announcement with the community
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.formContainer}>
          {/* Image Upload Section */}
          <div style={styles.imageSection}>
            <label style={styles.sectionLabel}>📷 Post Image / Poster</label>

            {!imagePreview ? (
              <label style={styles.uploadArea}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={styles.fileInput}
                />
                <div style={styles.uploadIcon}>⬆️</div>
                <p style={styles.uploadText}>
                  Click to upload or drag and drop
                </p>
                <p style={styles.uploadHint}>PNG, JPG, GIF up to 5MB</p>
              </label>
            ) : (
              <div style={styles.imagePreviewContainer}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={styles.imagePreview}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  style={styles.removeImageBtn}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div style={styles.section}>
            <label style={styles.sectionLabel}>📝 Basic Information</label>

            <div style={styles.formGroup}>
              <label style={styles.label}>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a catchy title for your post"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description *</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Provide detailed information about your post..."
                required
                rows="5"
                style={styles.textarea}
              />
            </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Post Type *</label>
                <select
                  name="postType"
                  value={formData.postType}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="event">📅 Event</option>
                  <option value="announcement">📢 Announcement</option>
                  <option value="news">📰 News</option>
                  <option value="general">💬 General</option>
                </select>
              </div>
            </div>
          

          {/* Event Details - Show only when postType is 'event' */}
          {formData.postType === "event" && (
            <div style={styles.section}>
              <label style={styles.sectionLabel}>📅 Event Details</label>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>📅 Event Date *</label>
                  <input
                    type="date"
                    name="eventDetails.eventDate"
                    value={formData.eventDetails.eventDate}
                    onChange={handleChange}
                    style={styles.input}
                    required={formData.postType === "event"}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>🕐 Event Time</label>
                  <input
                    type="time"
                    name="eventDetails.eventTime"
                    value={formData.eventDetails.eventTime}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>📍 Venue</label>
                  <input
                    type="text"
                    name="eventDetails.venue"
                    value={formData.eventDetails.venue}
                    onChange={handleChange}
                    placeholder="Event location or online link"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>👥 Max Participants</label>
                  <input
                    type="number"
                    name="eventDetails.maxParticipants"
                    value={formData.eventDetails.maxParticipants}
                    onChange={handleChange}
                    placeholder="Leave empty for unlimited"
                    style={styles.input}
                    min="1"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>🔗 Registration Link</label>
                <input
                  type="url"
                  name="registrationLink"
                  value={formData.registrationLink}
                  onChange={handleChange}
                  placeholder="https://example.com/register"
                  style={styles.input}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={styles.actions}>
            <button
              type="button"
              style={styles.cancelBtn}
              onClick={() => navigate("/profile")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Saving..." : id ? "Update Post" : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #afbaf1 0%, #bea9d3 100%)",
    padding: "20px",
  },
  wrapper: {
    maxWidth: "900px",
    margin: "0 auto",
    background: "white",
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
  },
  header: {
    display: "flex",
    alignItems: "middle",
    gap: "20px",
    marginBottom: "40px",
  },
  backBtn: {
    padding: "12px 20px",
    background: "#f3f4f6",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "15px",
    transition: "all 0.2s ease",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1f2937",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "18px",
    color: "#6b7280",
    margin: 0,
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  section: {
    background: "#f9fafb",
    padding: "24px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  sectionLabel: {
    display: "flex",
    alignItems: "center",
    fontSize: "22px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "20px",
    gap: "8px",
  },
  imageSection: {
    background: "#f9fafb",
    padding: "24px",
    borderRadius: "12px",
    border: "2px dashed #d1d5db",
  },
  uploadArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    background: "white",
    border: "2px dashed #d1d5db",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  fileInput: {
    display: "none",
  },
  uploadIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },
  uploadText: {
    marginTop: "12px",
    fontSize: "16px",
    fontWeight: "500",
    color: "#374151",
  },
  uploadHint: {
    marginTop: "4px",
    fontSize: "14px",
    color: "#9ca3af",
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: "12px",
    overflow: "hidden",
    background: "white",
  },
  imagePreview: {
    width: "100%",
    height: "auto",
    maxHeight: "400px",
    objectFit: "contain",
    display: "block",
  },
  removeImageBtn: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "rgba(239, 68, 68, 0.9)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "20px",
    fontWeight: "bold",
    transition: "all 0.2s ease",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    fontSize: "18px",
    fontWeight: "600",
    color: "#374151",
    gap: "6px",
  },
  input: {
    padding: "12px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "15px",
    transition: "all 0.2s ease",
    outline: "none",
  },
  textarea: {
    padding: "12px 15px",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "15px",
    fontFamily: "inherit",
    resize: "vertical",
    transition: "all 0.2s ease",
    outline: "none",
  },
  select: {
    padding: "12px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "15px",
    background: "white",
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
  },
  actions: {
    display: "flex",
    gap: "16px",
    marginTop: "8px",
  },
  cancelBtn: {
    flex: 1,
    padding: "16px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  submitBtn: {
    flex: 1,
    padding: "16px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};

export default CreatePost;
