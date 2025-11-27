import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { getJSON } from "../services/api";

export default function Dashboard() {
  const [usage, setUsage] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [eco, setEco] = useState(null);
  const [alert, setAlert] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    let x = true;
    async function loadLive() {
      const d = await getJSON("/smartmeter/live", token);
      if (!x) return;

      setUsage(prev => [...prev.slice(-19), { time: d.time, power: d.power }]);
      if (d.anomaly) setAlert("🚨 " + d.reason);
      else setAlert("");
    }

    loadLive();
    const iv = setInterval(loadLive, 2000);
    return () => { x = false; clearInterval(iv); };
  }, []);

  useEffect(() => {
    async function loadDetails() {
      setPrediction(await getJSON("/predict"));
      setEco(await getJSON("/ecoscore"));
    }
    loadDetails();
  }, [usage]);

  return (
    <div className="container">
      <h2>Real-Time Energy Dashboard</h2>

      {alert && <div className="alertBox">{alert}</div>}

      <div className="card">
        <h3>🔌 Live Power Usage</h3>
        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer>
            <LineChart data={usage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="power" stroke="#4f46e5" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3> Estimated Monthly Bill</h3>
        {prediction && (
          <p style={{ fontSize: 22 }}>
            <strong>₹ {prediction.predictedBill}</strong>  
            <span style={{ fontSize: 14, marginLeft: 10 }}>
              (Avg: {prediction.avgPower}W • Units: {prediction.unitsPerMonth})
            </span>
          </p>
        )}
      </div>

      <div className="card">
        <h3>Eco Score</h3>
        {eco && (
          <p style={{ fontSize: 30, fontWeight: 700, color: "#16a34a" }}>
            {eco.ecoScore} / 100
          </p>
        )}
      </div>
    </div>
  );
}
