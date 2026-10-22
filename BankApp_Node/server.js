require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

// Connect once and reuse the connection between requests
let connecting = null;
const connectDB = () => {
  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGO_URI)
      .then((m) => {
        console.log("MongoDB connected");
        return m;
      })
      .catch((e) => {
        connecting = null;
        throw e;
      });
  }
  return connecting;
};

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    console.error("MongoDB connection failed:", e.message);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/account", require("./routes/account"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/complaints", require("./routes/complaints"));
app.use("/api/settings", require("./routes/settings"));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

module.exports = app;

// Only listen when run directly (npm run dev), not on Vercel
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  connectDB().catch(() => {});
}
