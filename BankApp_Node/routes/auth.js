const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const safe = (u) => {
  const { password, ...rest } = u.toObject();
  return rest;
};

async function generateAccountNumber() {
  while (true) {
    const num = String(Math.floor(1000000000 + Math.random() * 9000000000));
    if (!(await User.exists({ accountNumber: num }))) return num;
  }
}

async function register(req, res, role) {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required" });
  if (password.length < 6)
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  if (
    role === "admin" &&
    (!process.env.ADMIN_CODE || req.body.adminCode !== process.env.ADMIN_CODE)
  )
    return res.status(403).json({ message: "Invalid admin access code" });
  if (await User.findOne({ email: String(email).toLowerCase() }))
    return res.status(400).json({ message: "Email already registered" });

  const data = {
    name: String(name).trim(),
    email,
    password: await bcrypt.hash(password, 10),
    role,
  };
  if (role === "user") data.accountNumber = await generateAccountNumber();
  else data.balance = 0;
  const user = await User.create(data);
  res.status(201).json({ token: sign(user._id), user: safe(user) });
}

async function login(req, res, role) {
  const user = await User.findOne({
    email: String(req.body.email || "").toLowerCase(),
  });
  if (!user || !(await bcrypt.compare(req.body.password || "", user.password)))
    return res.status(400).json({ message: "Incorrect email or password" });
  if (user.role !== role)
    return res.status(403).json({
      message:
        role === "admin"
          ? "This is not an admin account"
          : "Admins sign in through the admin portal",
    });
  if (!user.active)
    return res.status(403).json({ message: "This account has been suspended" });
  res.json({ token: sign(user._id), user: safe(user) });
}

router.post("/register", (req, res) => register(req, res, "user"));
router.post("/login", (req, res) => login(req, res, "user"));
router.post("/admin/register", (req, res) => register(req, res, "admin"));
router.post("/admin/login", (req, res) => login(req, res, "admin"));

router.get("/me", protect, (req, res) => res.json({ user: req.user }));

router.put("/profile", protect, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  if (!name || !email)
    return res.status(400).json({ message: "Name and email are required" });
  if (email !== req.user.email && (await User.exists({ email })))
    return res.status(400).json({ message: "That email is already in use" });
  req.user.name = name;
  req.user.email = email;
  req.user.phone = String(req.body.phone || "")
    .trim()
    .slice(0, 20);
  await req.user.save();
  res.json({ user: req.user });
});

router.put("/password", protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6)
    return res
      .status(400)
      .json({ message: "New password must be at least 6 characters" });
  const user = await User.findById(req.user._id);
  if (!(await bcrypt.compare(currentPassword || "", user.password)))
    return res.status(400).json({ message: "Current password is incorrect" });
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: "Password changed" });
});

module.exports = router;
