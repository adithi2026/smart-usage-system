import React, { useState, useEffect } from "react";
import { getJSON } from "../services/api";

export default function Recommendations() {
  const [list, setList] = useState([]);

  useEffect(() => {
    getJSON("/recommendations").then((d) => setList(d.recommendations || []));
  }, []);

  return (
    <div className="container">
      <h2>Energy-Saving Recommendations</h2>

      <div className="card">
        <ul className="recommendList">
          {list.map((item, i) => (
            <li key={i}> {item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
