import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import BlacklistToken from "../models/BlacklistToken.js";

export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  const blacklisted = await BlacklistToken.findOne({ token });
  if (blacklisted)
    return res.status(401).json({ message: "Token expired" });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id).select("-password");

  if (!req.user)
    return res.status(401).json({ message: "User not found" });

  next();
};
