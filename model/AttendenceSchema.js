import mongoose from "mongoose";
const AttendanceSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    date: { type: Date, required: true },
    checkIn: Date,
    checkOut: Date,
    hoursWorked: Number,
    status: { type: String, enum: ["Present", "Absent", "Leave", "Holiday"], default: "Present" }
  });
  const Attendance = mongoose.model("Attendance", AttendanceSchema);
  export default Attendance;