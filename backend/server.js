require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const http = require("http");
const socketIo = require("socket.io");

// Initialize Express & Server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT"],
  },
});

// Load Environment Variables
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/visitor-management";

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Database Connection
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ DB Connection Error:", err));

// ==========================
// 📌 Schema Definitions
// ==========================

// Employee Schema
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Employee = mongoose.model("Employee", employeeSchema);

// Visitor Schema
const visitorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  contact: { type: String, required: true },
  purpose: { type: String, required: true },
  hostEmployee: { type: String, required: true },
  company: { type: String },
  timeSlot: {
    type: String,
    required: true,
    enum: [
      "9:00 AM - 11:00 AM",
      "11:00 AM - 1:00 PM",
      "2:00 PM - 4:00 PM",
      "4:00 PM - 6:00 PM",
    ],
  },
  status: { type: String, default: "pending" },
  checkInTime: { type: Date, default: null }, // ✅ Added check-in time
  checkOutTime: { type: Date, default: null }, // ✅ Added check-out time
  photo: { type: String },
});

const Visitor = mongoose.model("Visitor", visitorSchema);

// ==========================
// 📌 Utility Functions
// ==========================

// Email Sender Function
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = (to, subject, text) => {
  transporter.sendMail(
    { from: process.env.EMAIL_USER, to, subject, text },
    (err, info) => {
      if (err) console.error("❌ Email Error:", err);
      else console.log("📧 Email Sent:", info.response);
    }
  );
};

// ==========================
// 📌 Authentication Middleware
// ==========================
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log("Decoded Token:", decoded); // 🔍 Debugging
    req.user = decoded;

    if (!req.user || !req.user.name) {
      return res.status(401).json({ error: "Unauthorized: Employee name missing in token" });
    }

    next();
  } catch (error) {
    console.error("JWT Error:", error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// ==========================
// 📌  updatde status
// ==========================

// Update Visitor Status
app.put("/api/visitors/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["pending", "approved", "rejected", "checked-in", "checked-out"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // Find visitor
    const visitor = await Visitor.findById(id);
    if (!visitor) {
      return res.status(404).json({ error: "Visitor not found" });
    }

    // Preserve check-in and check-out times permanently
    let updateFields = { status };
    if (status === "checked-in") {
      updateFields.checkInTime = visitor.checkInTime || new Date(); // Keep old check-in time if already set
    }
    if (status === "checked-out") {
      updateFields.checkOutTime = visitor.checkOutTime || new Date(); // Keep old check-out time if already set
    }

    // Update visitor
    const updatedVisitor = await Visitor.findByIdAndUpdate(id, updateFields, { new: true });

    console.log(`✅ Visitor status updated: ${updatedVisitor.fullName} is now ${status}`);

    // Ensure email field is correct
    const visitorEmail = visitor.email || visitor.contact; // Assuming `email` is correct, fallback to `contact`

    // Send email notification to visitor
    const mailOptions = {
      from: "soumyadipojha635@gmail.com",
      to: visitorEmail,
      subject: `Visitor Status Update: ${status}`,
      text: `Dear ${visitor.fullName},\n\nYour visit status has been updated to "${status}".\n\nDetails:\n- Purpose: ${visitor.purpose}\n- Host: ${visitor.hostEmployee}\n- Time Slot: ${visitor.timeSlot}\n- Check-In: ${updatedVisitor.checkInTime ? updatedVisitor.checkInTime : "Not yet"}\n- Check-Out: ${updatedVisitor.checkOutTime ? updatedVisitor.checkOutTime : "Not yet"}\n\nThank you for visiting!\n\nBest regards,\nVisitor Management Team`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("❌ Error sending email:", err);
      } else {
        console.log("✅ Email sent successfully:", info.response);
      }
    });

    res.json({
      message: "Status updated successfully",
      visitor: updatedVisitor,
    });

  } catch (error) {
    console.error("❌ Error updating visitor status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// 📌 Employee Authentication Routes
// ==========================

// Employee Registration
app.post("/api/employees/register", async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    // Check for existing employee
    const existingEmployee = await Employee.findOne({
      $or: [{ email }, { username }],
    });
    if (existingEmployee) {
      return res
        .status(400)
        .json({ error: "Email or username already registered" });
    }

    // Hash password & Save employee
    const hashedPassword = await bcrypt.hash(password, 10);
    const newEmployee = new Employee({
      name,
      email,
      username,
      password: hashedPassword,
    });
    await newEmployee.save();

    res.status(201).json({ message: "Employee registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Employee Login
app.post("/api/employee/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const employee = await Employee.findOne({ username });

    if (!employee || !(await bcrypt.compare(password, employee.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: employee._id, name: employee.name, email: employee.email },
      SECRET_KEY,
      {
        expiresIn: "2h",
      }
    );

    res.json({
      token,
      employee: { name: employee.name, email: employee.email },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Fetch Employees
app.get("/api/employees", async (req, res) => {
  try {
    const employees = await Employee.find({}, "name");
    res.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Error fetching employees" });
  }
});

// ==========================
// 📌 Visitor Management Routes
// ==========================

// File Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Register Visitor
app.post("/api/visitors", upload.single("photo"), async (req, res) => {
  try {
    console.log("🔹 Visitor Registration Request Received");
    console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);

    const { fullName, contact, purpose, hostEmployee, company, timeSlot } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    if (!fullName || !contact || !purpose || !hostEmployee || !timeSlot) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ error: "All required fields must be filled." });
    }

    // Save the visitor first
    const newVisitor = new Visitor({
      fullName,
      contact,
      purpose,
      hostEmployee,
      company,
      status: "pending",
      timeSlot,
      photo,
    });

    const savedVisitor = await newVisitor.save();
    console.log("✅ Visitor Saved:", savedVisitor);

    // 🔹 Find the host employee's email
    const host = await Employee.findOne({ name: hostEmployee });

    // ❗ Check if host exists
    if (!host) {
      console.error("❌ Host employee not found.");
      return res.status(404).json({ error: `Host employee '${hostEmployee}' not found.` });
    }

    console.log("📧 Sending Email to:", host.email);

    // Email options
    const mailOptions = {
      from: "your-email@gmail.com",
      to: host.email,
      subject: "New Visitor Registered",
      text: `Hello ${hostEmployee},\n\nA new visitor has been registered.\n\nName: ${fullName}\nContact: ${contact}\nPurpose: ${purpose}\nTime Slot: ${timeSlot}\nCompany: ${company || "N/A"}\n\nPlease check your dashboard for more details.\n\nBest regards,\nVisitor Management System`,
    };

    // Send email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("❌ Error sending email:", err);
      } else {
        console.log("✅ Email sent successfully:", info.response);
      }
    });

    res.status(201).json({ message: "Visitor registered successfully!", visitor: savedVisitor });

  } catch (error) {
    console.error("❌ Error registering visitor:", error);
    res.status(500).json({ error: "Failed to register visitor" });
  }
});


// Fetch Visitors (Only for Logged-in Employee)
// Fetch Visitors (Only for Logged-in Employee)
app.get("/api/visitors", authMiddleware, async (req, res) => {
  try {
    console.log("Authenticated User:", req.user); // 🔍 Debugging
    const visitors = await Visitor.find({ hostEmployee: req.user.name });

    console.log("Visitors Found:", visitors.length); // 🔍 Debugging

    if (!visitors.length) {
      return res.status(404).json({ message: "No visitors found for this employee" });
    }

    res.json(visitors);
  } catch (error) {
    console.error("Error fetching visitors:", error);
    res.status(500).json({ error: "Failed to fetch visitors" });
  }
});

// // admiin login
// const adminLogin = (req, res) => {
//   const { username, password } = req.body;

//   const ADMIN_USERNAME = "admin123";
//   const ADMIN_PASSWORD = "securepassword";

//   if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
//     const token = jwt.sign({ role: "admin" }, SECRET_KEY, { expiresIn: "4h" });
//     res.json({ token, message: "Admin logged in successfully" });
//   } else {
//     res.status(401).json({ error: "Invalid admin credentials" });
//   }
// };
// // get all employee
// const getAllEmployees = async (req, res) => {
//   try {
//     const employees = await Employee.find({}, "name email");
//     res.json(employees);
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching employees" });
//   }
// };


// Start Server
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);