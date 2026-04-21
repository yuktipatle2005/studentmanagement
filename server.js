const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");

const app = express();   // 🔥 THIS WAS MISSING

app.use(cors());
app.use(bodyParser.json());

/* ---------------- ADD SCHOOL ---------------- */
app.post("/addSchool", (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  if (!name || !address || latitude == null || longitude == null) {
    return res.status(400).json({ error: "All fields required" });
  }

  const sql = "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)";

  db.query(sql, [name, address, latitude, longitude], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "School added", id: result.insertId });
  });
});

/* ---------------- SERVER ---------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* ---------------- DISTANCE FUNCTION ---------------- */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/* ---------------- LIST SCHOOLS ---------------- */
app.get("/listSchools", (req, res) => {
  const userLat = parseFloat(req.query.latitude);
  const userLon = parseFloat(req.query.longitude);

  if (isNaN(userLat) || isNaN(userLon)) {
    return res.status(400).json({ error: "Invalid location" });
  }

  db.query("SELECT * FROM schools", (err, data) => {
    if (err) return res.status(500).json(err);

    const result = data.map((school) => {
      const distance = getDistance(
        userLat,
        userLon,
        school.latitude,
        school.longitude
      );
      return { ...school, distance };
    });

    result.sort((a, b) => a.distance - b.distance);

    res.json(result);
  });
});