require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/account", require("./routes/account"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/complaints", require("./routes/complaints"));
app.use("/api/settings", require("./routes/settings"));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((e) => console.error("MongoDB connection failed:", e.message));
