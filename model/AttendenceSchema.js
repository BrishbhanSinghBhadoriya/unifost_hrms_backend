import mongoose from "mongoose";
const AttendanceSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    employeeName: String,
    profilePhoto: { type: String, default: null }, // URL or path to profile photo
    date: { type: Date, required: true },
    checkIn: { type: String, default: null },
    checkOut: { type: String, default: null },
    hoursWorked: { type: Number, default: 0 },
    status: { type: String, enum: ["present", "absent", "leave", "holiday","late"], default: "present" }
  });

// Auto-populate employeeId with selected fields on common queries
const employeeSelect = "name email profilePicture employeeId department designation";
function autopopulateEmployee(next) {
  this.populate("employeeId", employeeSelect);
  next();
}

AttendanceSchema.pre("find", autopopulateEmployee);
AttendanceSchema.pre("findOne", autopopulateEmployee);
AttendanceSchema.pre("findById", autopopulateEmployee);
AttendanceSchema.pre("findOneAndUpdate", function(next) {
  this.populate("employeeId", employeeSelect);
  next();
});
  const Attendance = mongoose.model("Attendance", AttendanceSchema);
  export default Attendance;