const router = require("express").Router();
const Settings = require("../models/Settings");
const { protect, adminOnly } = require("../middleware/auth");

const getSettings = async () =>
  (await Settings.findOne({ key: "site" })) ||
  (await Settings.create({ key: "site" }));

// Public: the landing page needs this before login
router.get("/", async (req, res) => {
  res.json({ settings: await getSettings() });
});

// Admin only
router.put("/", protect, adminOnly, async (req, res) => {
  const b = req.body;
  const hex = /^#[0-9a-fA-F]{6}$/;
  if (!hex.test(b.bgLight) || !hex.test(b.bgDark))
    return res.status(400).json({ message: "Colours must look like #aabbcc" });
  if (
    !["left", "center"].includes(b.alignment) ||
    !["hero-first", "features-first"].includes(b.sectionOrder)
  )
    return res.status(400).json({ message: "Invalid layout option" });
  if (!String(b.headline || "").trim())
    return res.status(400).json({ message: "Headline cannot be empty" });

  const s = await getSettings();
  s.headline = String(b.headline).slice(0, 120);
  s.subtext = String(b.subtext || "").slice(0, 300);
  s.primaryButton = String(b.primaryButton || "Open an account").slice(0, 30);
  s.alignment = b.alignment;
  s.sectionOrder = b.sectionOrder;
  s.showFeatures = !!b.showFeatures;
  s.features = (b.features || []).slice(0, 3).map((f) => ({
    title: String(f.title || "").slice(0, 60),
    text: String(f.text || "").slice(0, 160),
  }));
  s.bgLight = b.bgLight;
  s.bgDark = b.bgDark;
  await s.save();
  res.json({ settings: s });
});

module.exports = router;
