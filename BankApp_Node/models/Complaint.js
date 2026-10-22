const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    from: { type: String, enum: ["user", "admin"], required: true },
    name: String,
    message: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const complaintSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "responded", "resolved"],
      default: "open",
    },
    replies: [replySchema],
    resolvedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Complaint", complaintSchema);
