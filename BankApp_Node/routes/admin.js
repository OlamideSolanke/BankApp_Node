const router = require("express").Router();
const User = require("../models/User");
const Tx = require("../models/Transaction");
const { protect, adminOnly } = require("../middleware/auth");
const Complaint = require("../models/Complaint");

router.use(protect, adminOnly);

router.get("/users", async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json({ users });
});

router.get("/stats", async (req, res) => {
  const [users, transactions, openComplaints] = await Promise.all([
    User.countDocuments({ role: "user" }),
    Tx.countDocuments(),
    Complaint.countDocuments({ status: "open" }),
  ]);
  res.json({ users, transactions, openComplaints });
});

// Suspend / reactivate
router.patch("/users/:id/toggle", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.id === req.user.id)
    return res.status(400).json({ message: "You cannot suspend yourself" });
  user.active = !user.active;
  await user.save();
  res.json({ message: user.active ? "User reactivated" : "User suspended" });
});

router.delete("/users/:id", async (req, res) => {
  if (req.params.id === req.user.id)
    return res.status(400).json({ message: "You cannot delete yourself" });
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

module.exports = router;
