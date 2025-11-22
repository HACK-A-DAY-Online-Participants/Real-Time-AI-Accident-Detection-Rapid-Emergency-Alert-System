const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let alerts = [];

app.post("/alert", (req, res) => {
    const alert = {
        ...req.body,
        time: new Date().toLocaleTimeString(),
    };
    alerts.push(alert);
    console.log("🚨 New Alert Received:", alert);
    res.status(200).send({ message: "Alert Received" });
});

app.get("/alerts", (req, res) => {
    res.json(alerts);
});

app.listen(5000, () => console.log("Backend running on port 5000"));
