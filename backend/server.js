require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded images

const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";

// MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1:27017/moveDB", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Admin Login Credentials
const ADMIN_CREDENTIALS = {
  email: "imshruti470@gmail.com",
  password: bcrypt.hashSync("123", 10),
};

// Visitor Schema with photo and status field
const visitorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  contact: { type: String, required: true },
  purpose: { type: String, required: true },
  hostEmployee: { type: String, required: true },
  company: String,
  photo: String, // Stores file path
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
});

const Visitor = mongoose.model("Visitor", visitorSchema);

// 🔹 Admin Login Route
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;
  if (email !== ADMIN_CREDENTIALS.email || !bcrypt.compareSync(password, ADMIN_CREDENTIALS.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" });
  res.json({ token });
});

// 🔹 Middleware to Verify JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(403).json({ error: "Access denied" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], SECRET_KEY);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// 🔹 Multer Storage for Image Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads")); // Ensure path is correct
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Allow only images
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage, 
  fileFilter, 
  limits: { fileSize: 5 * 1024 * 1024 } // Max 5MB file size
});

// 🔹 Register a New Visitor with Photo
app.post("/api/visitors", upload.single("photo"), async (req, res) => {
  try {
    console.log("📸 Uploaded File:", req.file); // Debug log
    console.log("📄 Form Data:", req.body); // Debug log

    const { fullName, contact, purpose, hostEmployee, company } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null; // Save correct file path

    if (!fullName || !contact || !purpose || !hostEmployee) {
      return res.status(400).json({ error: "All required fields must be filled." });
    }

    const newVisitor = new Visitor({ fullName, contact, purpose, hostEmployee, company, photo });
    await newVisitor.save();

    io.emit("visitorAdded", newVisitor); // 🔔 Send real-time update

    res.status(201).json({ message: "Visitor registered successfully!", visitor: newVisitor });
  } catch (error) {
    console.error("Error registering visitor:", error);
    res.status(500).json({ error: "Failed to register visitor" });
  }
});

// 🔹 Get All Pending Visitors (Protected)
app.get("/api/visitors/pending", verifyToken, async (req, res) => {
  try {
    const pendingVisitors = await Visitor.find({ status: "pending" });

    // Append full server URL to photo path for frontend
    const visitorsWithFullPhotoUrl = pendingVisitors.map((visitor) => ({
      ...visitor._doc,
      photo: visitor.photo ? `http://localhost:5000${visitor.photo}` : null,
    }));

    res.json(visitorsWithFullPhotoUrl);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pending visitors" });
  }
});

// 🔹 Approve or Reject a Visitor (Protected)
app.put("/api/visitors/:id/status", verifyToken, async (req, res) => {
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const visitor = await Visitor.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!visitor) return res.status(404).json({ error: "Visitor not found" });

    io.emit("visitorStatusUpdated", visitor); // 🔔 Send real-time update

    res.json({ message: `Visitor ${status} successfully!`, visitor });
  } catch (err) {
    res.status(500).json({ error: "Failed to update visitor status" });
  }
});

// 🔹 Real-time Connection (Socket.io)
io.on("connection", (socket) => {
  console.log("📡 A client connected");
  socket.on("disconnect", () => {
    console.log("❌ A client disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
