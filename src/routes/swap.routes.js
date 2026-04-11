import express from "express";
import { getSwapBalance , swapCrypto, getSwapRate} from "../controllers/swap.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/balance", protect, getSwapBalance);
router.post("/crypto", protect, swapCrypto);
router.get("/rate", protect, getSwapRate);

export default router;