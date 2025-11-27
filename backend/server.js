// ====== IMPORTS ======
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const twilioClient = require("twilio")(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

// ====== APP SETUP ======
const app = express();
app.use(cors());
app.use(express.json());

// ====== SWAGGER CONFIG ======
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Smart Energy Usage API",
      version: "1.0.0",
      description: "API documentation for Smart Energy System"
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 5000}` }]
  },
  apis: ["./server.js"]
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ====== MONGO CONNECT ======
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err.message));

// ====== MONGOOSE USER MODEL ======
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String
});
const User = mongoose.model("User", userSchema);

// ====== IN_MEMORY USAGE STORE ======
let usageStore = [];

// ====== SEND EMAIL ALERT ======
async function sendEmailAlert(reason, power, toEmail) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Smart Energy Monitor" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "⚠️ Energy Usage Alert",
      text: `Anomaly Detected!\nReason: ${reason}\nPower: ${power}W`
    });

    console.log("📧 Email sent to:", toEmail);
  } catch (err) {
    console.log("Email error:", err.message);
  }
}

// ====== SEND SMS ALERT ======
async function sendSMSAlert(reason, power, toPhone) {
  try {
    await twilioClient.messages.create({
      body: `⚠️ Energy Alert: ${reason} | Power: ${power}W`,
      from: process.env.TWILIO_PHONE,
      to: toPhone
    });
    console.log("📱 SMS sent to:", toPhone);
  } catch (err) {
    console.log("SMS error:", err.message);
  }
}

// ====== AUTH MIDDLEWARE ======
function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).send({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).send({ message: "Invalid token" });
  }
}

// =====================================================
// ==================== AUTH ROUTES ====================
// =====================================================

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: User Signup
 */
app.post("/signup", async (req, res) => {
  const { name, email, phone, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists)
    return res.status(400).send({ message: "Email already exists" });

  const hash = await bcrypt.hash(password, 10);

  const user = new User({
    name,
    email,
    phone,
    password: hash
  });

  await user.save();
  res.send({ message: "Signup successful" });
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User Login
 */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).send({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(400).send({ message: "Wrong password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.send({
    message: "Login successful",
    token,
    user: { name: user.name, email: user.email, phone: user.phone }
  });
});

// =====================================================
// ================= SMART METER LIVE ==================
// =====================================================

/**
 * @swagger
 * /smartmeter/live:
 *   get:
 *     summary: Get simulated live meter reading
 */
app.get("/smartmeter/live", async (req, res) => {
  const power = Math.floor(Math.random() * 400) + 200;
  const time = new Date().toLocaleTimeString();

  usageStore.push({ time, power });
  if (usageStore.length > 200) usageStore.shift();

  // ANOMALY DETECTION
  let anomaly = false;
  let reason = "";

  const last = usageStore.slice(-20);
  if (last.length > 5) {
    const mean = last.reduce((a, b) => a + b.power, 0) / last.length;
    const variance =
      last.reduce((a, b) => a + Math.pow(b.power - mean, 2), 0) /
      last.length;
    const stdDev = Math.sqrt(variance);

    const prev = last[last.length - 2].power;

    if (power > mean + 2 * stdDev) {
      anomaly = true;
      reason = "Sudden spike detected";
    }
    if (power - prev > 150) {
      anomaly = true;
      reason = "Sharp increase in usage";
    }
    if (power > 700) {
      anomaly = true;
      reason = "High usage threshold exceeded";
    }
  }

  // ALERT IF ANOMALY
  if (anomaly) {
    const user = await User.findOne();
    if (user) {
      sendEmailAlert(reason, power, user.email);
      sendSMSAlert(reason, power, user.phone);
    }
  }

  res.send({
    time,
    power,
    voltage: 230,
    current: (power / 230).toFixed(2),
    anomaly,
    reason
  });
});

// =====================================================
// ===================== PREDICT ========================
// =====================================================

app.get("/predict", (req, res) => {
  if (usageStore.length < 5)
    return res.send({ predictedBill: 0 });

  const last = usageStore.slice(-20);
  const avg = last.reduce((a, b) => a + b.power, 0) / last.length;

  const unitsPerMonth = (avg / 1000) * 24 * 30;
  const bill = unitsPerMonth * 7;

  res.send({
    avgPower: avg.toFixed(2),
    unitsPerMonth: unitsPerMonth.toFixed(2),
    predictedBill: bill.toFixed(2)
  });
});

// =====================================================
// ===================== ECO SCORE ======================
// =====================================================

app.get("/ecoscore", (req, res) => {
  if (usageStore.length < 5)
    return res.send({ ecoScore: 50 });

  const last = usageStore.slice(-20);
  const avg = last.reduce((a, b) => a + b.power, 0) / last.length;
  const spikes = last.filter((x) => x.power > avg * 1.5).length;
  const units = (avg / 1000) * 24 * 30;

  let score = 100 - avg / 10 - spikes * 2 - units / 50;
  if (score < 0) score = 0;

  res.send({
    ecoScore: Math.floor(score),
    avgPower: avg,
    spikes,
    predictedBill: units * 7
  });
});

// =====================================================
// ============== DEMO ALERT TRIGGER ROUTE =============
// =====================================================

app.get("/trigger-alert", async (req, res) => {
  const reason = "Demo alert triggered manually";
  const power = 999;

  const user = await User.findOne();

  if (user) {
    sendEmailAlert(reason, power, user.email);
    sendSMSAlert(reason, power, user.phone);
  }

  res.send({ message: "Demo alert sent!" });
});

// =====================================================
// ==================== START SERVER ===================
// =====================================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🔥 Backend running at http://localhost:${PORT}`)
);
