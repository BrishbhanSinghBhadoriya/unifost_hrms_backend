import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { createLeave, myLeaves, listAllLeaves,  approveLeave, rejectLeave, myLeaveBalance, allLeaveBalances } from "../controller/leaveController.js";

const router = express.Router();

router.post("/", authenticateToken, createLeave);
router.get("/me", authenticateToken, myLeaves);
router.get("/balance/me", authenticateToken, myLeaveBalance);
router.get("/balance", authenticateToken, allLeaveBalances);

// Admin/HR view all leaves
router.get("/", authenticateToken, listAllLeaves);
router.put('/approveLeave/:id',authenticateToken,approveLeave)
router.put('/rejectLeave/:id',authenticateToken,rejectLeave)

export default router;
