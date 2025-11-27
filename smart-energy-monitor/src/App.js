import React, { useState } from "react";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [view, setView] = useState(user ? "dashboard" : "login");

  return (
    <div className="container">
      <h2>⚡ Smart Energy Usage Monitor</h2>
      <div style={{marginBottom:16}}>
        {!user && <button onClick={() => setView("login")}>Login</button>}
        {!user && <button onClick={() => setView("signup")}>Signup</button>}
        {user && <button onClick={() => { localStorage.clear(); setUser(null); setView("login");}}>Logout</button>}
      </div>

      {view === "signup" && <Signup onSigned={() => setView("login")} />}
      {view === "login" && <Login onLogged={(u) => { setUser(u); setView("dashboard"); }} />}
      {view === "dashboard" && user && <Dashboard />}
      {!user && view === "dashboard" && <div>Please login to view dashboard.</div>}
      {/* <p className="note">Demo app — simulated smart meter readings</p> */}
    </div>
  );
}

export default App;
