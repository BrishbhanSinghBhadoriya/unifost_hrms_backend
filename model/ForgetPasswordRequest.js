import mongoose from "mongoose";

const ForgetPasswordRequestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
});
const ForgetPasswordRequest = mongoose.model("ForgetPasswordRequest", ForgetPasswordRequestSchema);
export default ForgetPasswordRequest;