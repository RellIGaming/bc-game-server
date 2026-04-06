import express from "express";
import { getToken } from "../controllers/token.controller.js";

const router = express.Router();

router.get("/", getToken);

export default router;