import User from "../models/User.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";

/**
 * SIGN UP
 */
export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Signup successful",
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * SIGN IN
 */
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
