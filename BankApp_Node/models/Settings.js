const mongoose = require("mongoose");

const featureSchema = new mongoose.Schema(
  { title: String, text: String },
  { _id: false },
);

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "site", unique: true },
    headline: { type: String, default: "Banking that stays out of your way" },
    subtext: {
      type: String,
      default:
        "Open an account in a minute, get your account number instantly, and send money to anyone on Trust Bank.",
    },
    primaryButton: { type: String, default: "Open an account" },
    alignment: { type: String, enum: ["left", "center"], default: "left" },
    sectionOrder: {
      type: String,
      enum: ["hero-first", "features-first"],
      default: "hero-first",
    },
    showFeatures: { type: Boolean, default: true },
    features: {
      type: [featureSchema],
      default: [
        {
          title: "Instant account number",
          text: "Get your own account number the moment you register.",
        },
        {
          title: "Send money in seconds",
          text: "Transfer to any Trust Bank account with one form.",
        },
        {
          title: "Every transaction recorded",
          text: "Check your full history and open any transaction for details.",
        },
      ],
    },
    bgLight: { type: String, default: "#f3f6f4" },
    bgDark: { type: String, default: "#0f171d" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Settings", settingsSchema);
