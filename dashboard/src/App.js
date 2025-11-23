import React, { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function App() {
  const [alerts, setAlerts] = useState([]);

  function playAlertSound() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    setTimeout(() => osc.stop(), 1000);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      axios.get("http://localhost:5000/alerts")
        .then(res => {
          if (res.data.length > alerts.length) {
            const latest = res.data[res.data.length - 1];
            if (latest.severity === "High") playAlertSound();
          }
          setAlerts(res.data);
        })
        .catch(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, [alerts]);

  const getColor = sev => {
    if (sev === "High") return "#ff4d4d";
    if (sev === "Medium") return "#ffcc00";
    return "#32cd32";
  };

  const validAlerts = alerts.filter(a =>
    a.lat !== undefined &&
    a.lng !== undefined &&
    !isNaN(parseFloat(a.lat)) &&
    !isNaN(parseFloat(a.lng))
  );

  return (
    <div style={{
      padding: 20,
      background: "#0d1b2a",
      color: "white",
      minHeight: "100vh",
      fontFamily: "Segoe UI"
    }}>
      <h1 style={{ fontSize: "34px", marginBottom: 12 }}>
        🚨 Smart Accident Detection Dashboard
      </h1>
      <p style={{ opacity: 0.8, marginBottom: 18 }}>
        AI-Powered Real-Time Public Safety System
      </p>

      {alerts.length > 0 && alerts[alerts.length - 1].severity === "High" && (
        <div style={{
          background: "red",
          color: "white",
          padding: 12,
          borderRadius: 10,
          fontWeight: "bold",
          marginBottom: 12,
          animation: "blink 1s infinite"
        }}>
          🔴 HIGH SEVERITY ACCIDENT DETECTED — ALERT SENT TO SERVER
        </div>
      )}

      <style>{`@keyframes blink { 50% { opacity: 0.3; } }`}</style>

      {/* 🌍 Map */}
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={14}
        style={{ height: "55vh", borderRadius: 10, marginBottom: 20 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {validAlerts.map((a, i) => (
          <Marker key={i} position={[parseFloat(a.lat), parseFloat(a.lng)]}>
            <Popup>
              <b>Severity:</b> {a.severity} <br />
              <b>Time:</b> {a.time}<br />
              <b>Location:</b> {a.location_text || "Unknown"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* 📌 Live Alerts */}
      <h2>📌 Live Alerts</h2>

      {alerts.length === 0 && <p>No alerts yet…</p>}

      {[...alerts].reverse().map((a, i) => (
        <div key={i} style={{
          background: getColor(a.severity),
          padding: "14px",
          margin: "10px 0",
          borderRadius: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: a.severity === "High" ? "#fff" : "#000",
          border: "2px solid #fff3"
        }}>
          <div>
            ⚠ {a.severity} | ⏱ {a.time} <br />
            📍 {a.location_text || "Location Pending"}
          </div>

          <img
            src={a.image || "/placeholder.jpg"}
            alt="snapshot"
            style={{
              width: 80,
              height: 50,
              borderRadius: 6,
              objectFit: "cover",
              border: "2px solid #000"
            }}
          />
        </div>
      ))}
    </div>
  );
}

