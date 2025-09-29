import mongoose from "mongoose";
import moment from "moment-timezone";
const AttendanceSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    employeeName: String,
    profilePhoto: { type: String, default: null }, // URL or path to profile photo
    date: { type: Date, required: true },
    // Use Date for checkIn to keep type consistent with checkOut
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    hoursWorked: { type: Number, default: 0 },
    status: { type: String, enum: ["present", "absent", "leave", "holiday","late"], default: "present" }
  });

// Ensure single attendance document per employee per calendar day
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Normalize date to start-of-day on save (guard against time components)
AttendanceSchema.pre("save", function(next) {
  if (this.date instanceof Date && !isNaN(this.date.getTime())) {
    // Normalize to start-of-day in IST to keep per-day uniqueness consistent with app logic
    const istStart = moment(this.date).tz("Asia/Kolkata").startOf("day").toDate();
    this.date = istStart;
  }
  next();
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
// Ensure IST-friendly fields in API responses
AttendanceSchema.set("toJSON", {
  virtuals: true,
  transform: function(doc, ret) {
    try {
      if (ret.date) {
        ret.dateIST = moment(ret.date).tz("Asia/Kolkata").format();
      }
      if (ret.checkIn) {
        ret.checkInIST = moment(ret.checkIn).tz("Asia/Kolkata").format();
      }
      if (ret.checkOut) {
        ret.checkOutIST = moment(ret.checkOut).tz("Asia/Kolkata").format();
      }
    } catch (e) {}
    return ret;
  }
});

const Attendance = mongoose.model("Attendance", AttendanceSchema);
  export default Attendance;