const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let alerts = [];

app.post("/alert", (req, res) => {
    alerts.push(req.body);
    res.json({message:"Alert Received"});
});

app.get("/alerts", (req, res) => {
    res.json(alerts);
});

app.listen(5000, () => console.log("Server running on port 5000"));
