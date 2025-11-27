// simple API helper
const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export async function postJSON(path, body, token) {
  const res = await fetch(`${BACKEND}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

export async function getJSON(path, token) {
  const res = await fetch(`${BACKEND}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}
