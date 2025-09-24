import { register, login, logout, getUserProfile } from "../controller/authController.js";
import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { updateEmployee,getDashboardData } from "../controller/employeeController.js";
import { enforceLoginRestrictions } from "../middleware/loginRestrictions.js";



const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login",enforceLoginRestrictions, login);

// Protected routes (require authentication)
router.post("/logout", authenticateToken, logout);
router.get("/profile", authenticateToken, getUserProfile);
router.put("/employee/:id", authenticateToken, updateEmployee);
router.get("/getDashboard",authenticateToken,getDashboardData)

export default router;
