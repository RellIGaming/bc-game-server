import mongoose from "mongoose";

const depositBonusSchema = new mongoose.Schema(
  {
    percentage: {
      type: Number,
      required: true,
      default: 100,
    },
    paymentMethods: [
      {
        type: String, // image URL
      },
    ],
    cryptos: [
      {
        type: String, // image URL
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("DepositBonus", depositBonusSchema);
