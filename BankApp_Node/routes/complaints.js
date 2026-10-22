const router = require("express").Router();
const Complaint = require("../models/Complaint");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

async function load(req, res) {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    res.status(404).json({ message: "Complaint not found" });
    return null;
  }
  const c = await Complaint.findById(req.params.id).populate(
    "user",
    "name email accountNumber",
  );
  const mine = c && c.user && c.user._id.equals(req.user._id);
  if (!c || (req.user.role !== "admin" && !mine)) {
    res.status(404).json({ message: "Complaint not found" });
    return null;
  }
  return c;
}

// Customer raises a complaint
router.post("/", async (req, res) => {
  if (req.user.role === "admin")
    return res.status(403).json({ message: "Admins cannot raise complaints" });
  const subject = String(req.body.subject || "")
    .trim()
    .slice(0, 100);
  const message = String(req.body.message || "")
    .trim()
    .slice(0, 2000);
  if (!subject || !message)
    return res
      .status(400)
      .json({ message: "Subject and message are required" });
  const complaint = await Complaint.create({
    user: req.user._id,
    subject,
    message,
  });
  res.status(201).json({ complaint });
});

// Customers see their own, admins see all (optional ?status=)
router.get("/", async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { user: req.user._id };
  if (["open", "responded", "resolved"].includes(req.query.status))
    filter.status = req.query.status;
  const complaints = await Complaint.find(filter)
    .sort({ updatedAt: -1 })
    .populate("user", "name email");
  res.json({ complaints });
});

router.get("/:id", async (req, res) => {
  const c = await load(req, res);
  if (c) res.json({ complaint: c });
});

router.post("/:id/reply", async (req, res) => {
  const c = await load(req, res);
  if (!c) return;
  if (c.status === "resolved")
    return res.status(400).json({ message: "This complaint is resolved" });
  const message = String(req.body.message || "")
    .trim()
    .slice(0, 2000);
  if (!message) return res.status(400).json({ message: "Write a reply first" });
  const admin = req.user.role === "admin";
  c.replies.push({
    from: admin ? "admin" : "user",
    name: req.user.name,
    message,
  });
  c.status = admin ? "responded" : "open";
  await c.save();
  res.json({ complaint: c });
});

router.patch("/:id/resolve", adminOnly, async (req, res) => {
  const c = await load(req, res);
  if (!c) return;
  c.status = "resolved";
  c.resolvedAt = new Date();
  await c.save();
  res.json({ complaint: c });
});

module.exports = router;
