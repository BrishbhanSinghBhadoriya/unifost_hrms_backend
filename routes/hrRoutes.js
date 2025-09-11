import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getEmployee } from "../controller/employeeController.js";
import getAttendance, { markAttendance,updateAttendance,deleteAttendance, markBulkAttendance } from "../controller/attendanceController.js";
// import { getEmployeeLeaves } from "../controller/hrController.js";
const hrRouter = express.Router();
hrRouter.get("/getEmployees", authenticateToken, getEmployee);
hrRouter.get("/getEmployee/:id", authenticateToken, getEmployee);
hrRouter.post("/markAttendance/:id", authenticateToken, markAttendance);
hrRouter.post("/bulkAttendance", authenticateToken, markBulkAttendance);
hrRouter.get('/getAttendance',authenticateToken,getAttendance)
hrRouter.put('/updateAttendance/:id',authenticateToken,updateAttendance)
hrRouter.delete('/deleteAttendance/:id',authenticateToken,deleteAttendance)
// hrRouter.get('/getEmployeeLeaves',authenticateToken,getEmployeeLeaves)
export default hrRouter;

