import EmployeeLeave from "../model/EmployeeLeaveSchema.js";

// helper: parse multiple date formats
const parseDateFlexible = (value) => {
	if (!value) return null;
	if (value instanceof Date) return value;
	if (typeof value !== "string") return new Date(value);
	// trim
	const v = value.trim();
	// dd-mm-yyyy
	const dm = v.match(/^([0-3]?\d)[-\/](0?[1-9]|1[0-2])[-\/]((?:19|20)?\d\d)$/);
	if (dm) {
		const d = parseInt(dm[1], 10);
		const m = parseInt(dm[2], 10) - 1;
		let y = parseInt(dm[3], 10);
		if (y < 100) y += 2000; 
		return new Date(y, m, d);
	}
	// yyyy-mm-dd or ISO
	const iso = new Date(v);
	if (!isNaN(iso.getTime())) return iso;
	return null;
};

const normalizeDuration = (val) => {
	if (!val) return "multiple_days";
	const s = String(val).toLowerCase();
	if (s.includes("half")) return "half_day";
	if (s.includes("full")) return "full_day";
	if (s.includes("multiple") || s.includes("multi") || s.includes("days")) return "multiple_days";
	return s === "half_day" || s === "full_day" || s === "multiple_days" ? s : "multiple_days";
};

// Create a leave request (self - any logged-in user, including HR)
export const createLeave = async (req, res) => {
	try {
		const userId = req.user && req.user._id;
		console.log(req.user);
		const role=req.user.role
		const employeeName = req.user && req.user.name;

		if (!userId) {
			return res.status(401).json({ status: "error", message: "Authentication required" });
		}

		const b = req.body || {};
		// accept multiple aliases coming from UI labels
		const leaveType = b.leaveType || b.type || b.leave_type || b.leave || b["Leave Type"]; 
		const reason = b.reason || b.note || b.notes || b["Reason"];
		const startRaw = b.startDate || b.start_date || b.start || b.fromDate || b.from || b["Start Date"];
		const endRaw = b.endDate || b.end_date || b.end || b.toDate || b.to || b["End Date"]; 
		const durationType = normalizeDuration(b.durationType || b.duration || b["Duration"]);

		const startDate = parseDateFlexible(startRaw);
		const endDate = parseDateFlexible(endRaw || startRaw);

		const missing = [];
		if (!leaveType) missing.push("leaveType");
		if (!reason) missing.push("reason");
		if (!startDate) missing.push("startDate");
		if (!endDate) missing.push("endDate");
		if (missing.length) {
			return res.status(400).json({ status: "error", message: `Missing/invalid fields: ${missing.join(", ")}` });
		}

		const doc = await EmployeeLeave.create({
			employeeId: userId,
			employeeName: employeeName,
			employeeRole:role,
			leaveType,
			reason,
			startDate,
			endDate,
			durationType
		});

		return res.status(201).json({ status: "success", message: "Leave request created", leave: doc });
	} catch (error) {
		console.error("createLeave error:", error);
		return res.status(500).json({ status: "error", message: "Failed to create leave", error: error.message });
	}
};

// Get leaves for logged-in user
export const myLeaves = async (req, res) => {
	try {
		const userId = req.user && req.user._id;
		
		console.log(req.user);
		
		if (!userId) {
			return res.status(401).json({ status: "error", message: "Authentication required" });
		}
		const leaves = await EmployeeLeave.find({ employeeId: userId }).sort({ createdAt: -1 });
		return res.status(200).json({ status: "success", leaves });
	} catch (error) {
		console.error("myLeaves error:", error);
		return res.status(500).json({ status: "error", message: "Failed to fetch leaves", error: error.message });
	}
};

// Admin: list all leaves
export const listAllLeaves = async (req, res) => {
	try {
		const requester = req.user;
		if(req.role=='hr')
		{
		if (!requester || requester.role !== "admin") {
			return res.status(403).json({ status: "error", message: "Admin only" });
		}
	    }

		const leaves = await EmployeeLeave.find().populate("employeeId", "username name employeeId department").sort({ createdAt: -1 });
		return res.status(200).json({ status: "success", leaves });
	} catch (error) {
		console.error("listAllLeaves error:", error);
		return res.status(500).json({ status: "error", message: "Failed to fetch leaves", error: error.message });
	}
};

export const approveLeave = async (req, res) => {
	try {
		const requester = req.user;
		if (!requester || !["admin", "manager", "hr"].includes(requester.role)) {
			return res.status(403).json({ status: "error", message: "Only Admin, Manager or HR allowed" });
		  }
		  
		const { id } = req.params;
		const leave = await EmployeeLeave.findByIdAndUpdate(id, { status: "approved" }, { new: true });
		return res.status(200).json({ status: "success", leave });
	} catch (error) {
		console.error("approveLeave error:", error);
		return res.status(500).json({ status: "error", message: "Failed to approve leave", error: error.message });
	}
};
export const rejectLeave = async (req, res) => {
	try {
		const requester = req.user;
		if (!requester || !["admin", "manager", "hr"].includes(requester.role)) {
			return res.status(403).json({ status: "error", message: "Only Admin, Manager or HR allowed" });
		  }
		const { id } = req.params;
		const leave = await EmployeeLeave.findByIdAndUpdate(id, { status: "rejected" }, { new: true });
		return res.status(200).json({ status: "success", leave });
	} catch (error) {
		console.error("rejectLeave error:", error);
		return res.status(500).json({ status: "error", message: "Failed to reject leave", error: error.message });
	}
};
// export const hrLeaves=async(req,res)=>{
// 	try {
// 		const userId = req.user && req.user._id;
// 		if (!userId) {
// 			return res.status(401).json({ status: "error", message: "Authentication required" });
// 		}
// 		const 


		
// 	} catch (error) {
		
// 	}
// }
