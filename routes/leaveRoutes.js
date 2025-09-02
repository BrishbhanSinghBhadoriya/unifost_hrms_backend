import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { createLeave, myLeaves, listAllLeaves } from "../controller/leaveController.js";

const router = express.Router();

// Create leave (logged-in users)
router.post("/", authenticateToken, createLeave);

// My leaves (logged-in users)
router.get("/me", authenticateToken, myLeaves);

// Admin/HR view all leaves
router.get("/", authenticateToken, listAllLeaves);

export default router;
