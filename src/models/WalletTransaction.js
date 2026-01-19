// models/WalletTransaction.js
import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    reason: {
      type: String, // deposit, bet, win, admin-credit, withdraw
    },
    reference: {
      type: String, // gameId / orderId / txId
    },
  },
  { timestamps: true }
);

export default mongoose.model("WalletTransaction", walletTransactionSchema);
