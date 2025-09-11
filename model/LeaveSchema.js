import mongoose from "mongoose";

const LeaveSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    leaveType: { type: String, enum: ["Casual", "Sick", "Earned", "Maternity"] },
    role:{type:String,required},
    startDate: Date,
    endDate: Date,
    reason: String,
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }
  });
  const Leave = mongoose.model("Leave", LeaveSchema);
  export default Leave;
