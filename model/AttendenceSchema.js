import mongoose from "mongoose";
const AttendanceSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    employeeName: String,
    date: { type: Date, required: true },
    checkIn: String,
    checkOut: String,
    hoursWorked: Number,
    status: { type: String, enum: ["Present", "Absent", "Leave", "Holiday"], default: "Present" }
  });
  const Attendance = mongoose.model("Attendance", AttendanceSchema);
  export default Attendance;