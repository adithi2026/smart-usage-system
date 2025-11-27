import React, { useState } from "react";
import { postJSON } from "../services/api";

export default function Signup({ onSigned }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    const res = await postJSON("/signup", form);
    setMsg(res.message || res.error || JSON.stringify(res));
    if (res.message === "Signup successful") {
      onSigned && onSigned();
    }
  }
  return (
    <div className="authBox">
      <h3>Signup</h3>
      <form onSubmit={submit}>
        <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
        <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
        <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
        <button type="submit">Sign up</button>
      </form>
      <div className="msg">{msg}</div>
    </div>
  );
}
