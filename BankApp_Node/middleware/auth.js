const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
    if (!token) return res.status(401).json({ message: "Please log in" });
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id).select("-password");
    if (!user || !user.active)
      return res.status(401).json({ message: "Account unavailable" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Session expired, please log in again" });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admins only" });
  next();
};

exports.userOnly = (req, res, next) => {
  if (req.user.role !== "user")
    return res.status(403).json({ message: "Customer accounts only" });
  next();
};
