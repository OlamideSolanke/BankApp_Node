const mongoose = require("mongoose");

const txSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true },
    type: { type: String, enum: ["transfer", "withdrawal"], required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // empty for withdrawals
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
    status: { type: String, default: "successful" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Transaction", txSchema);
