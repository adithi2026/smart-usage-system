import React, { useEffect, useState } from "react";
import { getJSON } from "../services/api";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getJSON("/leaderboard").then(setRows);
  }, []);

  return (
    <div className="container">
      <h2>Energy Efficiency Leaderboard</h2>

      <div className="card">
        <table style={{ width: "100%", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#e5e7eb" }}>
              <th>Name</th>
              <th>Email</th>
              <th>Eco Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.name}</td>
                <td>{r.email}</td>
                <td><strong>{r.ecoScore}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
