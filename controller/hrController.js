import User from "../model/userSchema.js";
import Leave from "../model/LeaveSchema.js";
import Attendance from "../model/AttendenceSchema.js";
import EmployeeLeave from "../model/EmployeeLeaveSchema.js";


export const getEmployee = async (req, res) => {
    const employee=await User.find()
    console.log(employee);
    res.status(200).json({
        success:true,
        employee,
        message:"employee data fetched successfully"

    })}
export const getEmployeeById = async (req, res) => {
    try {
        const id = req.params.id;

        const getEmployeebyId = await User.findById(id);

        if (!getEmployeebyId) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        return res.status(200).json({
            success: true,
            employee: getEmployeebyId,
            message: "Employee data fetched successfully"
        });

    } catch (error) {
        console.error("getEmployeeById error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch employee by id",
            error: error.message
        });
    }
};
export const getHrDashboardWithAttendance = async (req, res) => {
    try {
      const requester = req.user;
  
      // 🔹 Only HR can access this route
      if (!requester || requester.role !== "hr") {
        return res.status(403).json({
          status: "error",
          message: "Only HR has permission to access this route"
        });
      }
  
      // ================================
      // 1. Employee Stats
      // ================================
      const now = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
      const [employeeCount, newJoinersCount, pendingLeavesCount] =
        await Promise.all([
          User.countDocuments({}),
          User.countDocuments({ joiningDate: { $gte: oneMonthAgo, $lte: now } }),
          EmployeeLeave.countDocuments({ status: "pending" })
        ]);
  
      // ================================
      // 2. Attendance Report (Today or Next Day Fallback)
      // ================================
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
  
      let attendance = await Attendance.find({
        date: { $gte: today, $lt: tomorrow }
      });
  
      if (!attendance || attendance.length === 0) {
        const nextDay = new Date(tomorrow);
        const dayAfterNext = new Date(nextDay);
        dayAfterNext.setDate(dayAfterNext.getDate() + 1);
  
        attendance = await Attendance.find({
          date: { $gte: nextDay, $lt: dayAfterNext }
        });
      }
  
      const presentCount = attendance.filter((a) => a.status === "Present").length;
      const absentCount = attendance.filter((a) => a.status === "Absent").length;
      const lateCount = attendance.filter((a) => a.status === "Late").length;
  
      
      const TEN_DAYS = 10;
      const usersWithDob = await User.find({ dob: { $ne: "" } })
        .select("_id name employeeId department designation dob email profilePicture")
        .lean();
        console.log(usersWithDob);

      // Use UTC-normalized dates to avoid timezone off-by-one issues
      const startOfTodayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

      const upcomingBirthdays = usersWithDob
        .map(u => {
          const raw = u.dob instanceof Date ? u.dob : new Date(u.dob);
          if (isNaN(raw.getTime())) return null;
          const month = raw.getUTCMonth();
          const day = raw.getUTCDate();
          let nextOccurUtc = new Date(Date.UTC(startOfTodayUtc.getUTCFullYear(), month, day));
          if (nextOccurUtc < startOfTodayUtc) {
            nextOccurUtc = new Date(Date.UTC(startOfTodayUtc.getUTCFullYear() + 1, month, day));
          }
          const diffDays = Math.floor((nextOccurUtc - startOfTodayUtc) / 86400000);
          if (diffDays < 0 || diffDays > TEN_DAYS) return null;
          return { ...u, nextBirthday: nextOccurUtc, diffDays };
        })
        .filter(Boolean)
        .sort((a, b) => a.nextBirthday - b.nextBirthday)
        .map(({ nextBirthday, diffDays, ...rest }) => rest);
  
      
      res.status(200).json({
        success: true,
        stats: {
          totalEmployees: employeeCount,
          newJoiners: newJoinersCount,
          pendingLeaves: pendingLeavesCount
        },
        attendanceReport: {
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          records: attendance
        },
        birthdays: upcomingBirthdays,
        message:
          "HR dashboard stats, attendance & birthdays fetched successfully"
      });
    } catch (error) {
      console.error("getHrDashboardWithAttendance error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch HR dashboard stats & attendance",
        error: error.message
      });
    }
  };
    
  export const getUpcomingLeave = async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const upcomingLeaves = await EmployeeLeave.find({
        employeeRole: { $ne: "hr" }   // 👈 sirf HR ko hata diya
      }).sort({ startDate: 1 });
      
      console.log("Total Leaves Found:", upcomingLeaves.length);
  
      res.status(200).json({
        success: true,
        upcomingLeaves,
        message: "Upcoming leaves fetched successfully"
      });
    } catch (error) {
      console.error("getUpcomingLeave error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch upcoming leaves",
        error: error.message
      });
    }
  };
  