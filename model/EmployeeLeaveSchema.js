import mongoose from "mongoose";

const EmployeeLeaveSchema = new mongoose.Schema({
	employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	employeeName: { type: String, required: true },
	employeeRole:{type: String, required: true},
	leaveType: { type: String, enum: ["sick", "casual", "earned", "unpaid", "maternity", "paternity", "comp_off", "other"], required: true },
	reason: { type: String, required: true, trim: true },
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
	durationType: { type: String, enum: ["full_day", "half_day", "multiple_days"], default: "multiple_days" },
	totalDays: { type: Number, required: true, min: 0.5 },
	status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending" },
	approverNote: { type: String },
}, { timestamps: true });

// Ensure endDate >= startDate
EmployeeLeaveSchema.pre("validate", function(next) {
	if (this.startDate && this.endDate && this.endDate < this.startDate) {
		return next(new Error("End date cannot be earlier than start date"));
	}
	// Compute totalDays if not provided
	if (this.startDate && this.endDate && !this.totalDays) {
		const msInDay = 1000 * 60 * 60 * 24;
		const start = new Date(this.startDate);
		const end = new Date(this.endDate);
		const diff = Math.floor((end.setHours(0,0,0,0) - start.setHours(0,0,0,0)) / msInDay) + 1;
		this.totalDays = this.durationType === "half_day" ? 0.5 : Math.max(diff, 1);
	}
	next();
});

const EmployeeLeave = mongoose.model("EmployeeLeave", EmployeeLeaveSchema);
export default EmployeeLeave;