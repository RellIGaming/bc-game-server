import User from "../models/User.model.js";
import bcrypt from "bcryptjs";
import WalletTransaction from "../models/WalletTransaction.js";

/* ================= GET ALL USERS ================= */
export const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
};

/* ================= CREATE USER ================= */
export const createUser = async (req, res) => {
  const { username, email, password, role } = req.body;

  const exists = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (exists)
    return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    role: role || "user",
  });

  res.status(201).json({
    message: "User created",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

/* ================= UPDATE USER ================= */
export const updateUser = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(userId, req.body, {
    new: true,
  }).select("-password");

  if (!user)
    return res.status(404).json({ message: "User not found" });

  res.json({ message: "User updated", user });
};

/* ================= DELETE USER ================= */
export const deleteUser = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndDelete(userId);
  if (!user)
    return res.status(404).json({ message: "User not found" });

  res.json({ message: "User deleted" });
};

/* ================= CHANGE ROLE ================= */
export const changeUserRole = async (req, res) => {
  const { userId, role } = req.body;

  const validRoles = ["user", "affiliate", "agent", "admin"];
  if (!validRoles.includes(role))
    return res.status(400).json({ message: "Invalid role" });

  const user = await User.findById(userId);
  if (!user)
    return res.status(404).json({ message: "User not found" });

  user.role = role;
  await user.save();

  res.json({
    message: "Role updated",
    user: { id: user._id, role: user.role },
  });
};

/* ================= ADMIN CREDIT / DEBIT ================= */
export const adminWalletUpdate = async (req, res) => {
  const { userId, amount, type } = req.body;

  const user = await User.findById(userId);
  if (!user)
    return res.status(404).json({ message: "User not found" });

  if (type === "credit") {
    user.balance += amount;
  } else if (type === "debit") {
    if (user.balance < amount)
      return res.status(400).json({ message: "Insufficient balance" });
    user.balance -= amount;
  } else {
    return res.status(400).json({ message: "Invalid transaction type" });
  }

  await user.save();

  await WalletTransaction.create({
    user: user._id,
    amount,
    type,
    balanceAfter: user.balance,
    reason: "admin-adjustment",
  });

  res.json({
    message: `Wallet ${type}ed`,
    balance: user.balance,
  });
};
