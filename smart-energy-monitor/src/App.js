import React, { useState } from "react";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Leaderboard from "./components/Leaderboard";
import Recommendations from "./components/Recommendations";
import "./App.css";

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [view, setView] = useState(user ? "dashboard" : "login");

  return (
    <div>

      {/* ⭐ THIS IS WHERE THE NAVBAR GOES ⭐ */}
      <div className="navbar">
        {!user && <button onClick={() => setView("login")}>Login</button>}
        {!user && <button onClick={() => setView("signup")}>Signup</button>}
        {user && <button onClick={() => setView("dashboard")}>Dashboard</button>}
        {user && <button onClick={() => setView("leaderboard")}>Leaderboard</button>}
        {user && <button onClick={() => setView("recommendations")}>Recommendations</button>}
        {user && (
          <button
            onClick={() => {
              localStorage.clear();
              setUser(null);
              setView("login");
            }}
          >
            Logout
          </button>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      {view === "signup" && <Signup onSigned={() => setView("login")} />}
      {view === "login" && <Login onLogged={(u) => { setUser(u); setView("dashboard"); }} />}
      {view === "dashboard" && user && <Dashboard />}
      {view === "leaderboard" && user && <Leaderboard />}
      {view === "recommendations" && user && <Recommendations />}

    </div>
  );
}

export default App;
