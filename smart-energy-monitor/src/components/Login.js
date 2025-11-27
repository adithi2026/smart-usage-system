import React, { useState } from "react";
import { postJSON } from "../services/api";

export default function Login({ onLogged }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    const res = await postJSON("/login", form);
    if (res.token) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      onLogged && onLogged(res.user);
    } else {
      setMsg(res.message || "Login failed");
    }
  }

  return (
    <div className="authBox">
      <h3>Login</h3>
      <form onSubmit={submit}>
        <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
        <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
        <button type="submit">Login</button>
      </form>
      <div className="msg">{msg}</div>
    </div>
  );
}
