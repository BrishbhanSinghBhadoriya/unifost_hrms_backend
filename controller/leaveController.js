import EmployeeLeave from "../model/EmployeeLeaveSchema.js";
import User from "../model/userSchema.js";

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
		const department = req.user && req.user.department;

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

		// Calculate requested days
		const oneDay = 24 * 60 * 60 * 1000;
		let requestedDays = Math.round(Math.abs((endDate - startDate) / oneDay)) + 1;
		if (durationType === "half_day") requestedDays = 0.5;

		// Balance validation for CL, SL, EL only (LOP, FOB skip this check)
		const balanceCheckTypes = ["casual", "sick", "earned"];
		if (balanceCheckTypes.includes(leaveType)) {
			// Fetch user for joining date
			const user = await User.findById(userId).select("joiningDate");
			const asOf = new Date();
			const policy = getPolicyWindow(asOf);
			const doj = user && user.joiningDate ? new Date(user.joiningDate) : null;
			const dojStart = doj ? new Date(doj.getFullYear(), doj.getMonth(), 1) : null;
			const effectiveStart = dojStart ? new Date(Math.max(policy.start.getTime(), dojStart.getTime())) : policy.start;

			// Check 6-month eligibility for SL and EL
			if (leaveType === "sick" || leaveType === "earned") {
				if (!doj) {
					return res.status(400).json({ status: "error", message: "Joining date missing; cannot apply for this leave type." });
				}
				const sixMonthsAfterDOJ = new Date(doj);
				sixMonthsAfterDOJ.setMonth(sixMonthsAfterDOJ.getMonth() + 6);
				if (asOf < sixMonthsAfterDOJ) {
					const leaveTypeName = leaveType === "earned" ? "Earned Leave (EL)" : "Sick Leave (SL)";
					return res.status(400).json({
						status: "error",
						message: `${leaveTypeName} is applicable only after completing 6 months from joining date.`
					});
				}
			}

			// Calculate accrual and used
			const accrual = await computeAccrualForUser(user, asOf, effectiveStart);
			const used = await computeUsedDays(userId, asOf, effectiveStart);
			
			// Check balance
			const remaining = accrual[leaveType] - used[leaveType];
			if (requestedDays > remaining) {
				const typeLabels = { casual: "Casual Leave (CL)", sick: "Sick Leave (SL)", earned: "Earned Leave (EL)" };
				return res.status(400).json({
					status: "error",
					message: `Insufficient ${typeLabels[leaveType]} balance. Available: ${remaining.toFixed(2)} days, Requested: ${requestedDays} days.`,
					meta: { accrued: accrual[leaveType], used: used[leaveType], remaining, requested: requestedDays }
				});
			}
		}

		const doc = await EmployeeLeave.create({
			employeeId: userId,
			employeeName: employeeName,
			employeeRole:role,
			department:department,
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
	  const requester = req.user; // comes from verifyToken middleware
  
	  if (!requester) {
		return res.status(401).json({ status: "error", message: "Unauthorized" });
	  }
  
	  let query = {};
  
	  // 🔹 Role-based filter logic
	  if (requester.role === "manager") {
		// Manager → sirf apne department ke leaves
		query.department = requester.department;
	  }
	  else if (requester.role === "hr") {
		// HR → sabhi departments dekh sakti hai (no filter)
		query = {};
	  }
	  else if (requester.role === "admin") {
		// Admin → sab kuch dekh sakta hai
		query = {};
	  }
	  else {
		// Normal employee → sirf apne leaves dekhe
		query.employeeId = requester._id;
	  }
  
	  // 🔹 Fetch leaves according to role-based filter
	  const leaves = await EmployeeLeave.find(query)
		.populate("employeeId", "username name employeeId department")
		.sort({ createdAt: -1 });
  
	  return res.status(200).json({
		status: "success",
		leaves,
		message: "Leaves fetched successfully",
	  });
  
	} catch (error) {
	  console.error("listAllLeaves error:", error);
	  return res.status(500).json({
		status: "error",
		message: "Failed to fetch leaves",
		error: error.message,
	  });
	}
  };
  
export const approveLeave = async (req, res) => {
	try {
		const requester = req.user;
		if (!requester || !["admin", "manager", "hr"].includes(requester.role)) {
			return res.status(403).json({ status: "error", message: "Only Admin, Manager or HR allowed" });
		  }
		
		const { id } = req.params;
		// Fetch leave first to validate against monthly bucket
		const leaveDoc = await EmployeeLeave.findById(id);
		if (!leaveDoc) {http://localhost:3000/login
			return res.status(404).json({ status: "error", message: "Leave not found" });
		}

		// Apply monthly bucket only for EL/CL/SL -> earned/casual/sick
		const limitedTypes = new Set(["earned", "casual", "sick"]);
		if (limitedTypes.has(leaveDoc.leaveType)) {
			const monthStart = new Date(leaveDoc.startDate);
			monthStart.setDate(1);
			monthStart.setHours(0, 0, 0, 0);
			const monthEnd = new Date(monthStart);
			monthEnd.setMonth(monthEnd.getMonth() + 1);
			monthEnd.setMilliseconds(-1);

			// Enforce policy window: June -> March (disallow April & May)
			const monthIndex = monthStart.getMonth();
			const isWithinJanuaryToDecember = (monthIndex >= 1 && monthIndex <= 12) || (monthIndex >= 1 && monthIndex <= 12);
			if (!isWithinJanuaryToDecember) {
				return res.status(400).json({
					status: "error",
					message: `Leave of type ${leaveDoc.leaveType} is allowed only from January to December as per policy.`
				});
			}

			// 6-month eligibility check for Earned Leave and Sick Leave
		if (leaveDoc.leaveType === "earned" || leaveDoc.leaveType === "sick") {
			const user = await User.findById(leaveDoc.employeeId).select("joiningDate");
			const doj = user && user.joiningDate ? new Date(user.joiningDate) : null;
			if (!doj) {
				return res.status(400).json({ status: "error", message: "Joining date missing; cannot approve this leave type." });
			}
			const sixMonthsAfterDOJ = new Date(doj);
			sixMonthsAfterDOJ.setMonth(sixMonthsAfterDOJ.getMonth() + 6);
			if (monthStart < sixMonthsAfterDOJ) {
				const leaveTypeName = leaveDoc.leaveType === "earned" ? "Earned Leave (EL)" : "Sick Leave (SL)";
				return res.status(400).json({
					status: "error",
					message: `${leaveTypeName} is applicable only after completing 6 months from joining date.`
				});
			}
		}	

			// Sum of approved leaves for same employee and type in the same month
			const existing = await EmployeeLeave.aggregate([
				{
					$match: {
						employeeId: leaveDoc.employeeId,
						leaveType: leaveDoc.leaveType,
						status: "approved",
						startDate: { $gte: monthStart, $lte: monthEnd }
					}
				},
				{ $group: { _id: null, used: { $sum: "$totalDays" } } }
			]);

			const alreadyUsed = existing.length ? existing[0].used : 0;
			const monthlyQuota = 1; 
			const requested = leaveDoc.totalDays || 0;
			const remaining = monthlyQuota - alreadyUsed;
			if (requested > remaining) {
				return res.status(400).json({
					status: "error",
					message: `Monthly quota exceeded for ${leaveDoc.leaveType}. Remaining: ${Math.max(0, remaining)} day(s). Requested: ${requested}.`,
					meta: { quota: monthlyQuota, used: alreadyUsed, remaining }
				});
			}
		}

		const updated = await EmployeeLeave.findByIdAndUpdate(id, { status: "approved" }, { new: true });
		return res.status(200).json({ status: "success", leave: updated });
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

// Helper: determine current policy window (June -> March) for a given date
function getPolicyWindow(date = new Date()) {
    const d = new Date(date);
	console.log("date",d);
    const month = d.getMonth(); 
   console.log("month",month);
    if (month >= 0) {
        
        const year = d.getFullYear();

const start = new Date(year, 0, 1, 0, 0, 0, 0);
const end = new Date(year, 11, 31, 23, 59, 59, 999);

console.log("start", start);
console.log("end", end);
        return { start, end };
    }
   
}

// Helper: count months in window from Jan to Dec (inclusive)
function countWindowMonthsUntil(date = new Date(), effectiveStart = null) {
    const { start } = getPolicyWindow(date);
    const windowStart = effectiveStart ? new Date(effectiveStart) : start;
    // Current month's start date
    const current = new Date(date.getFullYear(), date.getMonth(), 1);
    
    // Count all months from Jan (0) to Dec (11)
    let months = 0;
    const iter = new Date(windowStart);
    iter.setDate(1); // Ensure we start from 1st of the month
    iter.setHours(0, 0, 0, 0);
    
    while (iter <= current) {
        const mi = iter.getMonth();
        // All months from Jan(0) to Dec(11) are valid in new policy
        if (mi >= 0 && mi <= 11) months++;
        iter.setMonth(iter.getMonth() + 1);
    }
    return months;
}

// Helper: compute accrual map for a user as of a date
// NEW POLICY (Jan 2026 - Dec 2026):
// CL: 0.75 per month for ALL employees (max 9/year)
// SL: 0.75 per month ONLY after 6 months completed (max 9/year)
// EL: 7.5 days fixed credit ONLY after 6 months completed
async function computeAccrualForUser(user, asOf = new Date(), effectiveStart = null) {
    const monthsSoFar = countWindowMonthsUntil(asOf, effectiveStart);
    const accrual = { casual: 0, sick: 0, earned: 0 };
    
    // CL: 0.75 per month for ALL employees (max 9)
    accrual.casual = Math.min(monthsSoFar * 0.75, 9);
    
    // Check if 6 months completed from DOJ
    const doj = user && user.joiningDate ? new Date(user.joiningDate) : null;
    let hasSixMonthsCompleted = false;
    
    if (doj) {
        const sixMonthsAfterDOJ = new Date(doj);
        sixMonthsAfterDOJ.setMonth(sixMonthsAfterDOJ.getMonth() + 6);
        hasSixMonthsCompleted = asOf >= sixMonthsAfterDOJ;
    }
    
    if (hasSixMonthsCompleted) {
        // SL: 0.75 per month (max 9) - only after 6 months
        accrual.sick = Math.min(monthsSoFar * 0.75, 9);
        // EL: Fixed 7.5 days - only after 6 months
        accrual.earned = 7.5;
    } else {
        // Employees with < 6 months: NO SL, NO EL
        accrual.sick = 0;
        accrual.earned = 0;
    }
    
    return accrual;
}

// Compute used approved leave days for user in window up to asOf per type
async function computeUsedDays(userId, asOf = new Date(), effectiveStart = null) {
    const { start, end } = getPolicyWindow(asOf);
    // cap end to asOf end of month
    const capEnd = new Date(asOf.getFullYear(), asOf.getMonth() + 1, 0, 23, 59, 59, 999);
    const effectiveEnd = new Date(Math.min(end.getTime(), capEnd.getTime()));
    const windowStart = effectiveStart ? new Date(effectiveStart) : start;
    const rows = await EmployeeLeave.aggregate([
        {
            $match: {
                employeeId: userId,
                status: "approved",
                startDate: { $gte: windowStart, $lte: effectiveEnd },
                leaveType: { $in: ["casual", "sick", "earned"] }
            }
        },
        { $group: { _id: "$leaveType", used: { $sum: "$totalDays" } } }
    ]);
    const used = { casual: 0, sick: 0, earned: 0 };
    for (const r of rows) {
        if (r && r._id && used.hasOwnProperty(r._id)) used[r._id] = r.used || 0;
    }
    return used;
}

export const myLeaveBalance = async (req, res) => {
    try {
        const me = await User.findById(req.user._id).select("name role joiningDate department");
        if (!me) return res.status(404).json({ status: "error", message: "User not found" });

        const asOf = new Date();
        const policy = getPolicyWindow(asOf);
        const dojStart = me.joiningDate ? new Date(new Date(me.joiningDate).getFullYear(), new Date(me.joiningDate).getMonth(), 1) : null;
        const effectiveStart = dojStart ? new Date(Math.max(policy.start.getTime(), dojStart.getTime())) : policy.start;
        const accrual = await computeAccrualForUser(me, asOf, effectiveStart);
        const used = await computeUsedDays(me._id, asOf, effectiveStart);
        const remaining = {
            casual: Math.max(0, accrual.casual - used.casual),
            sick: Math.max(0, accrual.sick - used.sick),
            earned: Math.max(0, accrual.earned - used.earned)
        };
        const window = { start: effectiveStart, end: policy.end };
        return res.status(200).json({
            status: "success",
            user: { id: me._id, name: me.name, role: me.role, department: me.department },
            window,
            accrual,
            used,
            remaining
        });
    } catch (error) {
        console.error("myLeaveBalance error:", error);
        return res.status(500).json({ status: "error", message: "Failed to compute balance", error: error.message });
    }
};

export const allLeaveBalances = async (req, res) => {
    try {
        const requester = req.user;
        if (!requester || !["admin", "manager", "hr"].includes(requester.role)) {
            return res.status(403).json({ status: "error", message: "Only Admin, Manager or HR allowed" });
        }

        // Managers: restrict to their department, HR/Admin: all
        const filter = requester.role === "manager" ? { department: requester.department } : {};
        const users = await User.find(filter).select("name role joiningDate department");
        const asOf = new Date();
        const policy = getPolicyWindow(asOf);

        const results = [];
        for (const u of users) {
            const dojStart = u.joiningDate ? new Date(new Date(u.joiningDate).getFullYear(), new Date(u.joiningDate).getMonth(), 1) : null;
            const effectiveStart = dojStart ? new Date(Math.max(policy.start.getTime(), dojStart.getTime())) : policy.start;
            const [accrual, used] = await Promise.all([
                computeAccrualForUser(u, asOf, effectiveStart),
                computeUsedDays(u._id, asOf, effectiveStart)
            ]);
            results.push({
                user: { id: u._id, name: u.name, role: u.role, department: u.department },
                window: { start: effectiveStart, end: policy.end },
                accrual,
                used,
                remaining: {
                    casual: Math.max(0, accrual.casual - used.casual),
                    sick: Math.max(0, accrual.sick - used.sick),
                    earned: Math.max(0, accrual.earned - used.earned)
                }
            });
        }

        return res.status(200).json({ status: "success", balances: results });
    } catch (error) {
        console.error("allLeaveBalances error:", error);
        return res.status(500).json({ status: "error", message: "Failed to fetch balances", error: error.message });
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
