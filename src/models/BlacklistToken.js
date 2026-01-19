// models/BlacklistToken.js
import mongoose from "mongoose";

export default mongoose.model(
  "BlacklistToken",
  new mongoose.Schema({ token: String })
);
