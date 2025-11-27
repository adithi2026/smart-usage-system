// backend/simulateData.js
const axios = require("axios");
const endpoint = process.env.ENDPOINT || "http://localhost:5000/usage";

setInterval(async () => {
  try {
    const payload = {
      time: new Date().toLocaleTimeString(),
      power: Math.floor(Math.random() * 600) + 100
    };
    await axios.post(endpoint, payload);
    console.log("posted", payload);
  } catch (err) {
    console.error("post error", err.message);
  }
}, 2000);
