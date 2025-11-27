import cors from "cors";
app.use(cors());

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Data Schema
const UsageSchema = new mongoose.Schema({
  time: String,
  power: Number
});
const Usage = mongoose.model("Usage", UsageSchema);

// POST data (Simulated or IoT input)
app.post("/usage", async (req, res) => {
  const data = new Usage(req.body);
  await data.save();
  res.send({ message: "Data stored" });
});

// GET data for dashboard
app.get("/usage", async (req, res) => {
  const data = await Usage.find().sort({ _id: -1 }).limit(20);
  res.send(data.reverse());
});
app.get("/predict", async (req, res) => {
  const data = await Usage.find().sort({ _id: 1 });

  if (data.length < 5) {
    return res.send({ message: "Not enough data", predictedBill: 0 });
  }

  // Calculate average power usage of last 10 readings
  const last = data.slice(-10);
  
  const avgPower = last.reduce((sum, item) => sum + item.power, 0) / last.length;

  // Convert power to Units (kWh)
  const unitsPerHour = avgPower / 1000;
  const unitsPerMonth = unitsPerHour * 24 * 30;

  const pricePerUnit = 7; // ₹7 per kWh
  const predictedBill = unitsPerMonth * pricePerUnit;

  res.send({
    avgPower: avgPower.toFixed(2),
    unitsPerMonth: unitsPerMonth.toFixed(2),
    predictedBill: predictedBill.toFixed(2)
  });
});


app.listen(5000, () => console.log("Server running on port 5000"));
