import express from "express";
import { daily, weekly, biggest } from '../controllers/leaderboard.controller.js';

const router = express.Router();
router.get('/daily', daily);
router.get('/weekly', weekly);
router.get('/biggest', biggest);

export default router;