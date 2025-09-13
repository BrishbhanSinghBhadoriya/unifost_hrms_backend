import User from "../model/userSchema.js";

const documentImageUploader = {
    adharImage: "documents.adharImage",
    panImage: "documents.panImage",
    experienceLetterImage: "documents.experienceLetterImage",
    MarksheetImage_10: "documents.MarksheetImage_10",
    MarksheetImage_12: "documents.MarksheetImage_12",
    MarksheetImage_Graduation: "documents.MarksheetImage_Graduation",
    MarksheetImage_PostGraduationImage: "documents.MarksheetImage_PostGraduationImage"
};

const allowedDocumentKeys = new Set(Object.keys(documentImageUploader));

export const updateEmployee = async (req, res) => {
    try {
        const targetUserId = req.params.id || (req.user && req.user._id);
        if (!targetUserId) {
            return res.status(400).json({ status: "error", message: "Employee id is required" });
        }

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

// Update employee documents from multer files or direct URLs
export const updateEmployeeDocuments = async (req, res) => {
    try {
        const targetUserId = req.params.id || (req.user && req.user._id);
        if (!targetUserId) {
            return res.status(400).json({ status: "error", message: "Employee id is required" });
        }

        const requester = req.user;
        const isSelf = requester && String(requester._id) === String(targetUserId);
        const isPrivileged = requester && ["admin", "hr", "manager"].includes(requester.role);
        if (!isSelf && !isPrivileged) {
            return res.status(403).json({ status: "error", message: "Not authorized to update this employee" });
        }

        const docUpdates = {};
        if (Array.isArray(req.files)) {
            for (const file of req.files) {
                const field = file.fieldname;
                if (allowedDocumentKeys.has(field)) {
                    const pathKey = documentImageUploader[field];
                    docUpdates[pathKey] = file.path; // cloudinary url
                }
            }
        } else if (req.files && typeof req.files === 'object') {
            for (const [field, files] of Object.entries(req.files)) {
                if (!allowedDocumentKeys.has(field)) continue;
                const f = Array.isArray(files) ? files[0] : files;
                if (f && f.path) {
                    const pathKey = documentImageUploader[field];
                    docUpdates[pathKey] = f.path;
                }
            }
        }

        // Build updates from direct URL strings in body
        for (const key of allowedDocumentKeys) {
            if (typeof req.body?.[key] === 'string' && req.body[key].length > 0) {
                const pathKey = documentImageUploader[key];
                docUpdates[pathKey] = req.body[key];
            }
        }

        if (Object.keys(docUpdates).length === 0) {
            return res.status(400).json({ status: "error", message: "No document fields provided" });
        }

        const updated = await User.findByIdAndUpdate(
            targetUserId,
            { $set: docUpdates },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updated) {
            return res.status(404).json({ status: "error", message: "Employee not found" });
        }

        return res.status(200).json({
            status: "success",
            message: "Documents updated successfully",
            user: updated
        });
    } catch (error) {
        console.error("updateEmployeeDocuments error:", error);
        return res.status(500).json({ status: "error", message: "Failed to update documents", error: error.message });
    }
};
export const getEmployee = async (req, res) => {
    try {
      // Extract pagination parameters
      let { page, limit, sortBy, sortOrder, search, department, status } = req.query;
  
      // Set default values and validation
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
      
      if (page < 1) page = 1;
      if (limit < 1 || limit > 100) limit = 10; // Max 100 records per page
  
      const skip = (page - 1) * limit;
  
      // Build dynamic query with search and filters
      let query = { role: "employee" };
  
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { empCode: { $regex: search, $options: 'i' } }
        ];
      }
  
      if (department && department !== 'all') {
        query.department = department;
      }
  
      if (status && status !== 'all') {
        query.status = status;
      }
  
      // Build sort object
      let sort = {};
      if (sortBy) {
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      } else {
        sort.createdAt = -1; // Default sort
      }
  
      // Get total count and paginated data
      const totalEmployees = await User.countDocuments(query);
      const totalPages = Math.ceil(totalEmployees / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
  
      const employees = await User.find(query)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
  
      // Return structured response
      res.status(200).json({
        success: true,
        data: employees,
        pagination: {
          currentPage: page,
          totalPages,
          totalEmployees,
          limit,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null
        },
        message: "Employee data fetched successfully"
      });
  
    } catch (error) {
      console.error("getEmployee error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch employees",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  };  