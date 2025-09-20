import mongoose from "mongoose";
const AttendanceSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    employeeName: String,
    profilePhoto: { type: String, default: null }, // URL or path to profile photo
    date: { type: Date, required: true },
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    hoursWorked: { type: Number, default: 0 },
    status: { type: String, enum: ["present", "absent", "leave", "holiday"], default: "present" }
  });
  const Attendance = mongoose.model("Attendance", AttendanceSchema);
  export default Attendance;