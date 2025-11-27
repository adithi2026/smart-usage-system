# ⚡ Smart Energy Usage Monitoring System  
Real-time energy monitoring system with smart meter simulation, anomaly detection, SMS/email alerts, eco-score, predictive billing, and user authentication.

---

## 🚀 Features

### 🔐 Authentication
- User Signup & Login (JWT-based)
- Stores user phone + email
- Auto fetches user contacts for alerts

### ⚡ Real-Time Energy Monitoring
- Smart meter simulated live readings
- Updates every 2 seconds
- Stored in memory (fast demo)

### 🚨 Anomaly Detection (AI Logic)
Detects:
- Sudden spikes (using 2σ standard deviation)
- Sharp increases in consumption
- High threshold violations

Triggers:
- ⚠️ Email alerts (Nodemailer)
- 📱 SMS alerts (Twilio)

### 🧠 Energy Intelligence
- Bill prediction (monthly)
- Eco Score (0–100)
- Usage analytics (last 20–30 readings)

### 📊 Dashboard (React)
- Live line chart (Recharts)
- Alerts & warnings
- Eco score block
- Bill prediction card

### 📘 API Documentation
- Full Swagger UI at:  
  👉 **`http://localhost:5000/api-docs`**

---

## 🏗️ Tech Stack

### **Frontend (React - CRA)**
- React.js  
- Recharts  
- JWT  
- Fetch (REST API)

### **Backend**
- Node.js  
- Express  
- MongoDB (local or Atlas)  
- Mongoose  
- JWT Authentication  
- Nodemailer  
- Twilio  
- Swagger UI

---

## 📁 Project Structure

smart-usage-system/
│
├── backend/
│ ├── server.js
│ ├── .env
│ ├── package.json
│ └── simulateData.js (optional)
│
└── smart-energy-monitor/ (React App)
├── src/
│ ├── components/
│ │ ├── Login.js
│ │ ├── Signup.js
│ │ └── Dashboard.js
│ ├── services/api.js
│ ├── App.js
│ └── App.css
└── package.json
---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/adithi2026/smart-usage-system.git
cd smart-usage-system