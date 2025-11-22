import React, { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function App() {
  const [alerts, setAlerts] = useState([]);

  function playAlertSound() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.connect(ctx.destination);
    oscillator.start();
    setTimeout(() => oscillator.stop(), 800);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      axios.get("http://localhost:5000/alerts")
        .then((res) => {
          if (res.data.length > alerts.length) {
            const latest = res.data[res.data.length - 1];
            if (latest.severity === "High") {
              playAlertSound();
            }
          }
          setAlerts(res.data);
        });
    }, 2000);

    return () => clearInterval(interval);
  }, [alerts]);

  const getColor = (sev) => {
    if (sev === "High") return "#ff4d4d";
    if (sev === "Medium") return "#ffcc00";
    return "#32cd32";
  };

  return (
    <div style={{
      padding: 20,
      background: "#001f3f",
      color: "white",
      minHeight: "100vh"
    }}>
      <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
        🚨 Smart Accident Detection Dashboard
      </h1>
      <h3 style={{ marginBottom: "20px", opacity: 0.8 }}>
        AI-Powered Public Safety System
      </h3>

      <MapContainer
        center={[12.97, 77.59]}
        zoom={12}
        style={{ height: "55vh", borderRadius: "10px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {alerts.map((a, i) => (
          <Marker key={i} position={[12.97, 77.59]}>
            <Popup>
              <b>Severity:</b> {a.severity}
              <br />
              <b>Time:</b> {a.time}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <h2 style={{ marginTop: 20 }}>📌 Live Alerts</h2>

      {alerts.map((a, i) => (
        <div
          key={i}
          style={{
            background: getColor(a.severity),
            padding: "12px",
            margin: "10px 0",
            borderRadius: "8px",
            color: a.severity === "High" ? "#fff" : "#000",
            fontWeight: "bold",
            fontSize: "16px",
            border: "2px solid white",
          }}
        >
          ⚠ {a.severity} | ⏱ {a.time} | 📍 {a.location}
        </div>
      ))}
    </div>
  );
}
