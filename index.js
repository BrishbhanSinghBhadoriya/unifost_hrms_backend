import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import hrRouter from "./routes/hrRoutes.js";

import cors from "cors";

const app = express();
dotenv.config();

// ✅ CORS Middleware (first)
app.use(cors({
	origin: "https://unifost-hrms-frontend-typescript.vercel.app", 
	credentials: true, 
}));

// ✅ Body Parser Middleware (CRITICAL - must come before routes)
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// ✅ Routes (after body parsers)
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/hr", hrRouter);

app.get('/', (req, res) => {
	res.send("Hello World by hrms ");
});

// Start server with fallback port
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

// Connect to database
connectDB();