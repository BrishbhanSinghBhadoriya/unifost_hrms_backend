import User from "../model/userSchema.js";

export const updateEmployee = async (req, res) => {
    try {
        const targetUserId = req.params.id || (req.user && req.user._id);
        if (!targetUserId) {
            return res.status(400).json({ status: "error", message: "Employee id is required" });
        }

        // Authorization: allow self-update or roles admin/hr/manager
        const requester = req.user;
        const isSelf = requester && String(requester._id) === String(targetUserId);
        const isPrivileged = requester && ["admin", "hr", "manager"].includes(requester.role);
        if (!isSelf && !isPrivileged) {
            return res.status(403).json({ status: "error", message: "Not authorized to update this employee" });
        }

        // Disallow these fields from being updated here
        const forbiddenFields = new Set(["_id", "id", "password", "username", "role", "createdAt", "updatedAt", "__v"]);

        const updates = {};
        for (const [key, value] of Object.entries(req.body || {})) {
            if (!forbiddenFields.has(key)) {
                updates[key] = value;
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ status: "error", message: "No valid fields to update" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            targetUserId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ status: "error", message: "Employee not found" });
        }

        return res.status(200).json({
            status: "success",
            message: "Employee updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("updateEmployee error:", error);
        return res.status(500).json({ status: "error", message: "Failed to update employee", error: error.message });
    }
};