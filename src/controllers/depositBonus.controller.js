import DepositBonus from "../models/DepositBonus.js";

/* ================= USER ================= */
export const getActiveDepositBonus = async (req, res) => {
  const bonus = await DepositBonus.findOne({ isActive: true });
  res.json(bonus);
};

/* ================= ADMIN ================= */
export const createDepositBonus = async (req, res) => {
  const bonus = await DepositBonus.create(req.body);
  res.status(201).json(bonus);
};

export const getAllDepositBonus = async (req, res) => {
  const bonuses = await DepositBonus.find().sort({ createdAt: -1 });
  res.json(bonuses);
};

export const updateDepositBonus = async (req, res) => {
  const bonus = await DepositBonus.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(bonus);
};

export const deleteDepositBonus = async (req, res) => {
  await DepositBonus.findByIdAndDelete(req.params.id);
  res.json({ message: "Deposit bonus deleted" });
};
