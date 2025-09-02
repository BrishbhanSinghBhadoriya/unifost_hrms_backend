import mongoose from "mongoose";
import dotenv from "dotenv";

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/unifost-hrms";
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.log("MongoDB connection error:", error.message);
        console.log("Server will continue without database connection");
    }
};

export default connectDB;
