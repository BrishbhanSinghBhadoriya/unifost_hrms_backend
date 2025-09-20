import express from "express";
import Attendance from "../model/AttendenceSchema.js";
import User from "../model/userSchema.js";

export const markAttendance = async (req, res) => {
    try {
        const {employeeName, date, checkIn, checkOut, status } = req.body;
        const userId = req.params.id;
        if (!userId || !date || !employeeName) {
            return res.status(400).json({ status: "error", message: "Employee ID, date and employee name are required" });
        }
        const attendanceDate = new Date(date);
        const existingRecord = await Attendance.findOne({ employeeId: userId, date: attendanceDate });
        if (existingRecord) {
            return res.status(400).json({ status: "error", message: "Attendance already marked for this date" });
        }
        const hoursWorked = checkIn && checkOut ? (new Date(checkOut) - new Date(checkIn)) / 36e5 : 0;
        const newAttendance = new Attendance({
            employeeId: userId,
            employeeName,
            date: attendanceDate,
            checkIn: checkIn ? new Date(checkIn) : null,
            checkOut: checkOut ? new Date(checkOut) : null,
            hoursWorked,
            status: status || "present"
        });
        await newAttendance.save();
        return res.status(201).json({ status: "success", message: "Attendance marked successfully", attendance: newAttendance });
    } catch (error) {
        console.error("markAttendance error:", error);
        return res.status(500).json({ status: "error", message: "Failed to mark attendance", error: error.message });
    }
};
const getAttendance = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role; // assume 'employee' or 'hr'

        let filter = {};
        if (userRole === 'employee') {
            // employee ko sirf apna record dikhaye
            filter = { employeeId: userId };
        } 
        // HR ya admin ko filter empty chhod do → sabka attendance milega

        const records = await Attendance.find(filter)
            .populate("employeeId", "name email");

        return res.status(200).json({ 
            status: "success", 
            attendance: records 
        });

    } catch (error) {
        console.error("getAttendance error:", error);
        return res.status(500).json({ 
            status: "error", 
            message: "Failed to fetch attendance records", 
            error: error.message 
        });
    }   
};
export const updateAttendance = async (req, res) => {
    try {
        
        const {id } = req.params;

        console.log(id);
        
        const {employeeName,status,date,checkIn,checkOut } = req.body;
        const attendance = await Attendance.findByIdAndUpdate(id, { employeeName,status,
        checkIn:checkIn ,
        checkOut:checkOut ,
        date:date 
        }, { new: true });
        // console.log(attendance);
        // console.log(employeeName,status,date,checkIn,checkOut);
        return res.status(200).json({ status: "success", attendance,message: "Attendance updated successfully" });
    }
    catch (error) {
        console.error("updateAttendance error:", error);
        return res.status(500).json({ status: "error", message: "Failed to update attendance", error: error.message });
    }
};
export const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const attendance = await Attendance.findByIdAndDelete(id);
        return res.status(200).json({ status: "success", attendance,message: "Attendance deleted successfully" });
    }
    catch (error) {
        console.error("deleteAttendance error:", error);
        return res.status(500).json({ status: "error", message: "Failed to delete attendance", error: error.message });
    }
};

export const markBulkAttendance = async (req, res) => {
    try {
        const { date, checkIn, checkOut, status, selectedEmployees, selectAll } = req.body || {};
        if (!date) {
            return res.status(400).json({ status: "error", message: "date is required" });
        }
        const attendanceDate = new Date(date);
        const checkInDate = checkIn ? new Date(checkIn) : null;
        const checkOutDate = checkOut ? new Date(checkOut) : null;
        const hoursWorked = checkInDate && checkOutDate ? (checkOutDate - checkInDate) / 36e5 : 0;

        // Resolve target employees
        let employeeIds = [];
        if (selectAll) {
            const users = await User.find({}, "_id name");
            employeeIds = users.map(u => ({ id: String(u._id), name: u.name }));
        } else if (Array.isArray(selectedEmployees) && selectedEmployees.length > 0) {
            // selectedEmployees can be list of IDs or objects
            employeeIds = selectedEmployees.map(e => typeof e === "string" ? { id: e } : { id: String(e.id || e._id), name: e.name });
        } else {
            return res.status(400).json({ status: "error", message: "Provide selectedEmployees or set selectAll=true" });
        }

        const results = [];
        let createdCount = 0;
        let skippedCount = 0;

        for (const emp of employeeIds) {
            const employeeId = emp.id;
            const user = await User.findById(employeeId).select("name");
            if (!user) {
                results.push({ employeeId, status: "skipped", reason: "user not found" });
                skippedCount++;
                continue;
            }
            // skip if already marked for the date
            const exists = await Attendance.findOne({ employeeId, date: attendanceDate });
            if (exists) {
                results.push({ employeeId, name: user.name, status: "skipped", reason: "already marked" });
                skippedCount++;
                continue;
            }
            const doc = new Attendance({
                employeeId,
                employeeName: user.name,
                date: attendanceDate,
                checkIn: checkInDate,
                checkOut: checkOutDate,
                hoursWorked,
                status: status || "present"
            });
            await doc.save();
            results.push({ employeeId, name: user.name, status: "created", id: doc._id });
            createdCount++;
        }

        return res.status(201).json({
            status: "success",
            message: "Bulk attendance processed",
            summary: { created: createdCount, skipped: skippedCount, total: employeeIds.length },
            results
        });
    } catch (error) {
        console.error("markBulkAttendance error:", error);
        return res.status(500).json({ status: "error", message: "Failed to mark bulk attendance", error: error.message });
    }
};

export default getAttendance;


