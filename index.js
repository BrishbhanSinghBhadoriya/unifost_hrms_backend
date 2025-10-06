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

// Middleware
app.use(cors({
	origin: "https://unifost-hrms-frontend-typescript.vercel.app",  // ✅ allow your frontend domain
	credentials: true, // if using cookies or auth headers
  }));
// Routes
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
