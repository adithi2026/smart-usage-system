const axios = require("axios");

const endpoint = process.env.ENDPOINT || "http://localhost:5000/usage";

setInterval(async () => {
  try {
    const payload = {
      time: new Date().toLocaleTimeString(),
      // simulate power around 200-700
      power: Math.floor(Math.random() * 500) + 200
    };
    await axios.post(endpoint, payload);
    console.log("posted", payload);
  } catch (err) {
    console.error("Simulate post error:", err.message);
  }
}, 2000);
