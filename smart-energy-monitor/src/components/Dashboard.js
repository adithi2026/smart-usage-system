import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { getJSON } from "../services/api";

export default function Dashboard() {
  const [usage, setUsage] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [eco, setEco] = useState(null);
  const [alert, setAlert] = useState("");
  const token = localStorage.getItem("token");

  // Poll live smartmeter endpoint
  useEffect(() => {
    let mounted = true;
    async function fetchLive() {
      try {
        const data = await getJSON("/smartmeter/live", token);
        if (!mounted) return;
        setUsage(prev => [...prev.slice(-19), { time: data.time, power: data.power, anomaly: data.anomaly }]);
        if (data.anomaly) setAlert(`🚨 ${data.reason}`);
        else if (data.power > 650) setAlert("⚠️ Very high energy usage");
        else if (data.power > 500) setAlert("⚠️ High energy usage");
        else setAlert("");
      } catch (err) {
        console.error("live fetch err", err);
      }
    }
    // immediate + poll
    fetchLive();
    const iv = setInterval(fetchLive, 2000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  useEffect(() => {
    async function fetchExtras() {
      try {
        const p = await getJSON("/predict", token);
        setPrediction(p);
        const e = await getJSON("/ecoscore", token);
        setEco(e);
      } catch (err) {
        console.error(err);
      }
    }
    fetchExtras();
  }, [usage]);

  return (
    <div>
      <h3>Dashboard</h3>
      {alert && <div className="alert">{alert}</div>}

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
        <div className="smallBox">
          <h4>Estimated Monthly Bill</h4>
          <div>₹ {prediction.predictedBill}</div>
          <div style={{fontSize:12}}>Avg: {prediction.avgPower}W • Units: {prediction.unitsPerMonth}</div>
        </div>
      )}

      {eco && (
        <div className="smallBox">
          <h4>Eco Score</h4>
          <div style={{fontSize:28, fontWeight:700}}>{eco.ecoScore}/100</div>
          <div style={{fontSize:12}}>Avg: {eco.avgPower}W • Spikes: {eco.spikes}</div>
        </div>
      )}
      <button
  onClick={() => fetch("http://localhost:5000/trigger-alert")}
  style={{ padding: "8px", margin: "10px", background: "#dc2626", color:"#fff", borderRadius:"6px" }}
>
  🚨 Trigger Demo Alert
</button>

    </div>
  );
}
