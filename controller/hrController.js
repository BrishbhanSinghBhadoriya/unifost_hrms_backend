import User from "../model/userSchema.js";
import Attendance from "../model/AttendenceSchema.js";
import EmployeeLeave from "../model/EmployeeLeaveSchema.js";
import Announcement from "../model/AnnouncementSchema.js";


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
  
      
      const today = new Date();
today.setHours(0, 0, 0, 0);

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

      let rangeStart = today;
      let rangeEnd = tomorrow;
      let attendance = await Attendance.find({
        date: { $gte: rangeStart, $lt: rangeEnd }
      }).lean();

      if (!attendance || attendance.length === 0) {
        const nextDay = new Date(tomorrow);
        const dayAfterNext = new Date(nextDay);
        dayAfterNext.setDate(dayAfterNext.getDate() + 1);

        rangeStart = nextDay;
        rangeEnd = dayAfterNext;

        attendance = await Attendance.find({
          date: { $gte: rangeStart, $lt: rangeEnd }
        }).lean();
      }

      const presentCount = await Attendance.countDocuments({
        date: { $gte: rangeStart, $lt: rangeEnd },
        status: "present"
      });
      
      const absentCount = await Attendance.countDocuments({
        date: { $gte: rangeStart, $lt: rangeEnd },
        status: "absent"
      });
      
      const lateCount = await Attendance.countDocuments({
        date: { $gte: rangeStart, $lt: rangeEnd },
        status: "late"
      });
      
      console.log("Attendance counts window", { rangeStart, rangeEnd, presentCount, absentCount, lateCount });
      const TEN_DAYS = 10;
      const usersWithDob = await User.find({ dob: { $ne: "" } })
        .select("_id name employeeId department designation dob email profilePicture")
        .lean();
        console.log(usersWithDob);

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
        employeeRole: { $ne: "hr" }  
      }).populate("employeeId", "name email profilePicture").sort({ startDate: 1 });
      
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
  
  export const createAnnouncement = async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User id is required"
            });
        }

        const { subject, audience, publishedDate, expiryDate, body, image, document } = req.body;

        if (!subject || !audience || !publishedDate || !expiryDate || !body) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Create announcement
        const newAnnouncement = new Announcement({
            user: userId,
            subject,
            audience,
            publishedDate: new Date(publishedDate),
            expiryDate: new Date(expiryDate),
            body,
            image: image || null,       
            document: document || null, 
        });

        await newAnnouncement.save();

        return res.status(201).json({
            success: true,
            message: "Announcement created successfully",
            data: newAnnouncement
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

  
  export const getAnnouncement=async(req,res)=>{
    const announcement=await Announcement.find();
    res.status(200).json({
      success: true,
      announcement,
      message: "Announcement fetched successfully"
    });
  }
 export const deleteEmployee=async(req,res)=>{
    const id=req.params.id;
    const employee=await User.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      employee,
      message: "Employee deleted successfully"
    });
  }
  export const getforgetPasswordRequest=async(req,res)=>{
    const forgetPasswordRequest=await ForgetPasswordRequest.find();
    res.status(200).json({
      success: true,
      forgetPasswordRequest,
      message: "Forget password request fetched successfully"
    });
  }
  export const editPassword=async(req,res)=>{
    const { id } = req.params;
    const { password } = req.body;
    const user=await User.findByIdAndUpdate(id,{password});
    res.status(200).json({
      success: true,
      user,
      message: "Password edited successfully"
    });
  }
  export const deleteforgetPasswordRequest=async(req,res)=>{
    const { id } = req.params;
    const forgetPasswordRequest=await ForgetPasswordRequest.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      forgetPasswordRequest,
      message: "Forget password request deleted successfully"
    });
  }
