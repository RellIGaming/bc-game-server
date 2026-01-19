import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    multiplier: { type: String, default: null },
    players: { type: Number, default: 0 },
    image: { type: String, required: true }, // image URL
    category: {
      type: String,
      enum: ["originals", "slots", "live", "sports"],
      default: "originals",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Game", gameSchema);
