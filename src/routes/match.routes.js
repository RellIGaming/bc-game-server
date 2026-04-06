import express from "express";
import { getMatches ,getAllMatches,createMatch} from "../controllers/match.controller.js";

const router = express.Router();


router.get("/single", getMatches);
router.get('/all', getAllMatches)
router.post('/create', createMatch)

export default router;