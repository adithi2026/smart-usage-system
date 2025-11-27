import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";
import "./App.css";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function App() {
  const [usage, setUsage] = useState([]);
  const [alertMsg, setAlertMsg] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  // fetch usage periodically
  useEffect(() => {
    let mounted = true;

    async function fetchUsage() {
      try {
        const res = await fetch(`${BACKEND}/usage?n=20`);
        if (!res.ok) throw new Error("Network response not ok");
        const data = await res.json();
        if (!mounted) return;
        setUsage(data);
        setError(null);

        // latest power check
        if (data.length) {
          const latest = data[data.length - 1];
          if (latest.power > 650) setAlertMsg("⚠️ Very high energy usage detected!");
          else if (latest.power > 500) setAlertMsg("⚠️ High energy usage detected!");
          else setAlertMsg("");
        }
      } catch (err) {
        console.error("Fetch usage error:", err.message);
        setError("Unable to fetch data from backend.");
        // fallback: local mock data to keep UI alive
        setUsage(prev => {
          if (prev.length) return prev;
          return [
            { time: "10:00", power: 300 },
            { time: "10:30", power: 420 },
            { time: "11:00", power: 500 }
          ];
        });
      }
    }

    // initial + periodic
    fetchUsage();
    const iv = setInterval(fetchUsage, 3000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  // fetch prediction whenever usage updates
  useEffect(() => {
    let mounted = true;
    async function fetchPred() {
      try {
        const res = await fetch(`${BACKEND}/predict`);
        if (!res.ok) throw new Error("Prediction fetch failed");
        const data = await res.json();
        if (mounted) setPrediction(data);
      } catch (err) {
        console.error("Predict error:", err.message);
      }
    }
    fetchPred();
    return () => { mounted = false; };
  }, [usage]);

  return (
    <div className="container">
      <h2>⚡ Smart Energy Usage Monitor</h2>

      {error && <div className="alert error">{error}</div>}
      {alertMsg && <div className="alert">{alertMsg}</div>}

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={usage}>
            <CartesianGrid stroke="#eee" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="power" stroke="#4f46e5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {prediction && (
        <div className="predictionBox">
          <h3>💡 Estimated Monthly Bill</h3>
          <p><strong>₹ {prediction.predictedBill}</strong></p>
          <p style={{ fontSize: 12, color: "#555" }}>
            Avg power: {prediction.avgPower} W • Units/month: {prediction.unitsPerMonth}
          </p>
        </div>
      )}

      <p className="note">Live Monitoring • Eco-Friendly Living 🌱</p>
    </div>
  );
}

export default App;
