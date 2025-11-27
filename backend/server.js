// ================== IMPORTS ==================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const twilioClient = require("twilio")(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

const app = express();
app.use(cors());
app.use(express.json());

// ================== SWAGGER ==================
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Smart Energy Usage API",
      version: "1.0.0",
      description: "Backend for Smart Energy Monitoring System"
    },
    servers: [{ url: "http://localhost:5000" }]
  },
  apis: ["./server.js"]
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ================== DB CONNECTION ==================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err.message));

// ================== USER MODEL ==================
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String
});
const User = mongoose.model("User", userSchema);

// ================== MEMORY USAGE DATA ==================
let usageStore = [];

// ================== EMAIL ALERT ==================
async function sendEmailAlert(reason, power, email) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      to: email,
      from: process.env.EMAIL_USER,
      subject: "⚠️ Energy Alert",
      text: `Anomaly detected:\n${reason}\nPower: ${power}W`
    });
    console.log("📧 Email sent");
  } catch (e) {
    console.log("Email error:", e.message);
  }
}

// ================== SMS ALERT ==================
async function sendSMSAlert(reason, power, phone) {
  try {
    await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE,
      to: phone,
      body: `⚠️ Energy Alert: ${reason} | ${power}W`
    });
    console.log("📱 SMS sent");
  } catch (e) {
    console.log("SMS error:", e.message);
  }
}

// ================== AUTH MIDDLEWARE ==================
function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).send({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).send({ message: "Invalid token" });
  }
}

// ================== SIGNUP ==================
app.post("/signup", async (req, res) => {
  const { name, email, phone, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).send({ message: "Email already in use" });

  const hash = await bcrypt.hash(password, 10);

  const user = new User({ name, email, phone, password: hash });
  await user.save();

  res.send({ message: "Signup successful" });
});

// ================== LOGIN ==================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).send({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).send({ message: "Wrong password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.send({
    message: "Login successful",
    token,
    user: {
      name: user.name,
      email: user.email,
      phone: user.phone
    }
  });
});

// ================== LIVE SMART METER ==================
app.get("/smartmeter/live", async (req, res) => {
  const power = Math.floor(Math.random() * 400) + 200;
  const time = new Date().toLocaleTimeString();

  usageStore.push({ time, power });
  if (usageStore.length > 200) usageStore.shift();

  // ===== ANOMALY DETECTION =====
  let anomaly = false;
  let reason = "";

  const last = usageStore.slice(-20);
  if (last.length > 5) {
    const avg = last.reduce((a, b) => a + b.power, 0) / last.length;
    const variance =
      last.reduce((a, b) => a + (b.power - avg) ** 2, 0) / last.length;
    const stdDev = Math.sqrt(variance);
    const prev = last[last.length - 2].power;

    if (power > avg + 2 * stdDev) {
      anomaly = true;
      reason = "Sudden spike detected";
    }
    if (power - prev > 150) {
      anomaly = true;
      reason = "Sharp usage increase";
    }
    if (power > 650) {
      anomaly = true;
      reason = "High consumption threshold exceeded";
    }
  }

  // ===== SEND ALERTS =====
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
    anomaly,
    reason,
    voltage: 230,
    current: (power / 230).toFixed(2)
  });
});

// ================== PREDICTION ==================
app.get("/predict", (req, res) => {
  if (usageStore.length < 5)
    return res.send({ predictedBill: 0 });

  const last = usageStore.slice(-20);
  const avg = last.reduce((a, b) => a + b.power, 0) / last.length;

  const units = (avg / 1000) * 24 * 30;
  const bill = units * 7;

  res.send({
    avgPower: avg.toFixed(2),
    unitsPerMonth: units.toFixed(2),
    predictedBill: bill.toFixed(2)
  });
});

// ================== ECO SCORE ==================
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

// ================== RECOMMENDATIONS ==================
app.get("/recommendations", (req, res) => {
  if (usageStore.length < 10) {
    return res.send({
      recommendations: ["Collecting data… come back soon!"]
    });
  }

  const last = usageStore.slice(-20);
  const avg = last.reduce((a, b) => a + b.power, 0) / last.length;
  const spikes = last.filter((x) => x.power > avg * 1.5).length;
  const units = (avg / 1000) * 24 * 30;
  const bill = units * 7;

  let recs = [];

  if (avg > 500)
    recs.push("Reduce heavy appliance usage (AC, induction, heater).");

  if (spikes > 5)
    recs.push("Too many spikes — avoid running multiple devices together.");

  if (bill > 1500)
    recs.push("High monthly bill predicted — consider efficient appliances.");

  recs.push("Turn off appliances when leaving the room.");
  recs.push("Use LED bulbs and energy-saving devices.");

  res.send({ recommendations: recs });
});

// ================== LEADERBOARD ==================
app.get("/leaderboard", async (req, res) => {
  const users = await User.find().select("-password");

  const leaderboard = users.map((u) => {
    const ecoScore = Math.floor(Math.random() * 50) + 50;
    return {
      name: u.name,
      email: u.email,
      ecoScore
    };
  });

  leaderboard.sort((a, b) => b.ecoScore - a.ecoScore);

  res.send(leaderboard);
});

// ================== DEMO ALERT ==================
app.get("/trigger-alert", async (req, res) => {
  const user = await User.findOne();
  if (user) {
    sendEmailAlert("Demo alert", 999, user.email);
    sendSMSAlert("Demo alert", 999, user.phone);
  }
  res.send({ message: "Demo alert sent!" });
});

// ================== START SERVER ==================
app.listen(5000, () => console.log("🔥 Backend running on 5000"));
