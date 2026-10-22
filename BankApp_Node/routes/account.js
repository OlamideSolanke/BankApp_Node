const router = require("express").Router();
const User = require("../models/User");
const Tx = require("../models/Transaction");
const { protect, userOnly } = require("../middleware/auth");

router.use(protect, userOnly);

const makeRef = () =>
  "TXN" + Date.now() + Math.floor(Math.random() * 900 + 100);
const parseAmount = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};

// Send money to another user
router.post("/transfer", async (req, res) => {
  const amount = parseAmount(req.body.amount);
  if (!amount) return res.status(400).json({ message: "Enter a valid amount" });

  const to = await User.findOne({
    accountNumber: String(req.body.accountNumber || "").trim(),
  });
  if (!to || !to.active)
    return res.status(404).json({ message: "Recipient account not found" });
  if (to.id === req.user.id)
    return res
      .status(400)
      .json({ message: "You cannot send money to yourself" });

  // Debit only if the balance is enough (atomic check)
  const sender = await User.findOneAndUpdate(
    { _id: req.user._id, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true },
  );
  if (!sender) return res.status(400).json({ message: "Insufficient balance" });

  try {
    await User.updateOne({ _id: to._id }, { $inc: { balance: amount } });
  } catch (e) {
    await User.updateOne({ _id: sender._id }, { $inc: { balance: amount } }); // refund
    return res
      .status(500)
      .json({ message: "Transfer failed, you were not charged" });
  }

  const tx = await Tx.create({
    reference: makeRef(),
    type: "transfer",
    from: sender._id,
    to: to._id,
    amount,
    note: req.body.note || "",
  });
  res.status(201).json({ transaction: tx, balance: sender.balance });
});

// Withdraw
router.post("/withdraw", async (req, res) => {
  const amount = parseAmount(req.body.amount);
  if (!amount) return res.status(400).json({ message: "Enter a valid amount" });

  const user = await User.findOneAndUpdate(
    { _id: req.user._id, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true },
  );
  if (!user) return res.status(400).json({ message: "Insufficient balance" });

  const tx = await Tx.create({
    reference: makeRef(),
    type: "withdrawal",
    from: user._id,
    amount,
  });
  res.status(201).json({ transaction: tx, balance: user.balance });
});

// History (newest first)
router.get("/transactions", async (req, res) => {
  const list = await Tx.find({
    $or: [{ from: req.user._id }, { to: req.user._id }],
  })
    .sort({ createdAt: -1 })
    .populate("from to", "name accountNumber");
  res.json({ transactions: list });
});

// Single transaction
router.get("/transactions/:id", async (req, res) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(404).json({ message: "Transaction not found" });
  const tx = await Tx.findById(req.params.id).populate(
    "from to",
    "name accountNumber",
  );
  const mine =
    tx && [tx.from?._id, tx.to?._id].some((i) => i && i.equals(req.user._id));
 if (!tx || !mine)
  return res.status(404).json({ message: "Transaction not found" });
  res.json({ transaction: tx });
});

module.exports = router;
