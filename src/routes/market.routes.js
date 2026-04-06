import express from "express";
import { suspendMarket } from '../controllers/market.controller.js'
const router = express.Router();


router.patch('/:marketId/suspend', suspendMarket)

export default router;