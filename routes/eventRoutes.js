
const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const upload = require("../middlewares/upload");
const auth = require("../middlewares/auth");

// POST /api/events — Create new event (with image upload)
router.post("/", auth, upload.single("bannerImage"), async (req, res) => {
  try {
    const { title, description, date } = req.body;

    const event = new Event({
      title,
      description,
      date,
      bannerImage: req.file ? req.file.path : null,
      postedBy: req.user.id,
    });

    await event.save();
    res.status(201).json({ message: "Event created successfully", event });

  } catch (error) {
    console.error("Error uploading event:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
