import User from "../model/userSchema.js";


export const getEmployee = async (req, res) => {
    const employee=await User.find({role:"employee"})
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
//  export const getEmployeeLeaves = async (req, res) => {
//     const employeeLeaves = await EmployeeLeave.find().populate("employeeId", "name");
//     res.status(200).json({
//         success:true,
//         employeeLeaves,
//         message:"employee leaves fetched successfully"
//     })}